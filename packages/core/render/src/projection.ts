import type { Point } from "@iso-home/core-model";

/** 2:1 dimetric tile, per docs/STYLE_GUIDE.md. */
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

/** Projects a room-space point (meters) to screen pixels, 1 meter = 1 tile. */
export function worldToScreen(point: Point): Point {
  return {
    x: (point.x - point.y) * (TILE_WIDTH / 2),
    y: (point.x + point.y) * (TILE_HEIGHT / 2),
  };
}

/** Painter's-algorithm depth key (research.md §2) — higher draws later (in front). */
export function depthKey(point: Point): number {
  return point.x + point.y;
}

export interface WallEdge {
  a: Point;
  b: Point;
  index: number;
}

/**
 * The fixed camera looks from the north-west. A wall edge is "front" (and
 * therefore hidden, per FR-003) when it sits on the near side of the room
 * relative to its center — i.e. its midpoint's x+y exceeds the room
 * center's x+y (research.md §2).
 */
export function isFrontWall(edge: WallEdge, roomCenter: Point): boolean {
  const midpoint: Point = {
    x: (edge.a.x + edge.b.x) / 2,
    y: (edge.a.y + edge.b.y) / 2,
  };
  return depthKey(midpoint) > depthKey(roomCenter);
}

export function polygonCenter(polygon: Point[]): Point {
  const sum = polygon.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / polygon.length, y: sum.y / polygon.length };
}

export function polygonEdges(polygon: Point[]): WallEdge[] {
  return polygon.map((a, index) => ({
    a,
    b: polygon[(index + 1) % polygon.length] as Point,
    index,
  }));
}
