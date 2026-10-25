import type { Room } from "@iso-home/core-model";
import { Container, Graphics } from "pixi.js";
import {
  TILE_HEIGHT,
  TILE_WIDTH,
  depthKey,
  isFrontWall,
  polygonCenter,
  polygonEdges,
  worldToScreen,
} from "./projection.js";

export const WALL_HEIGHT_PX = 96;
const FLOOR_COLOR = 0xd8c9a8;
const WALL_COLOR = 0xe8dcc2;
const WALL_OUTLINE = 0x3a2f26;

/** Even-odd point-in-polygon test, room-space meters. */
function isInsidePolygon(point: { x: number; y: number }, polygon: Room["polygon"]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];
    if (pi === undefined || pj === undefined) continue;
    const intersects =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function drawFloorTile(center: { x: number; y: number }): Graphics {
  const screen = worldToScreen(center);
  const halfW = TILE_WIDTH / 2;
  const halfH = TILE_HEIGHT / 2;

  const tile = new Graphics()
    .moveTo(screen.x, screen.y - halfH)
    .lineTo(screen.x + halfW, screen.y)
    .lineTo(screen.x, screen.y + halfH)
    .lineTo(screen.x - halfW, screen.y)
    .closePath()
    .fill({ color: FLOOR_COLOR })
    .stroke({ color: WALL_OUTLINE, width: 1 });

  tile.zIndex = depthKey(center);
  return tile;
}

function drawWallSegment(a: { x: number; y: number }, b: { x: number; y: number }): Graphics {
  const screenA = worldToScreen(a);
  const screenB = worldToScreen(b);

  const wall = new Graphics()
    .moveTo(screenA.x, screenA.y)
    .lineTo(screenB.x, screenB.y)
    .lineTo(screenB.x, screenB.y - WALL_HEIGHT_PX)
    .lineTo(screenA.x, screenA.y - WALL_HEIGHT_PX)
    .closePath()
    .fill({ color: WALL_COLOR })
    .stroke({ color: WALL_OUTLINE, width: 1 });

  wall.zIndex = depthKey({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  return wall;
}

/**
 * Builds the room's floor + wall scene with painter's-algorithm depth sort
 * (research.md §2): one diamond tile per 1m cell inside the room outline,
 * and one quad per wall edge — front-facing edges (nearest the fixed
 * north-west camera) are culled per FR-003.
 */
export function buildRoomScene(room: Room): Container {
  const container = new Container();
  container.sortableChildren = true;

  const xs = room.polygon.map((p) => p.x);
  const ys = room.polygon.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  for (let x = minX + 0.5; x < maxX; x += 1) {
    for (let y = minY + 0.5; y < maxY; y += 1) {
      if (isInsidePolygon({ x, y }, room.polygon)) {
        container.addChild(drawFloorTile({ x, y }));
      }
    }
  }

  const center = polygonCenter(room.polygon);
  for (const edge of polygonEdges(room.polygon)) {
    if (isFrontWall(edge, center)) continue;
    container.addChild(drawWallSegment(edge.a, edge.b));
  }

  return container;
}
