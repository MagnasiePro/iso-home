import type { Point, Room } from "@iso-home/core-model";
import type { Container } from "pixi.js";
import { worldToScreen } from "./projection.js";
import { WALL_HEIGHT_PX } from "./scene.js";

export interface Size {
  width: number;
  height: number;
}

export interface Fit {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Fits a set of already-projected screen points into a viewport of any
 * orientation (portrait or landscape), per FR-003, leaving a 10% margin.
 */
export function computeFit(screenPoints: Point[], viewport: Size, margin = 0.9): Fit {
  const xs = screenPoints.map((p) => p.x);
  const ys = screenPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const contentWidth = maxX - minX || 1;
  const contentHeight = maxY - minY || 1;

  const scale = Math.min(viewport.width / contentWidth, viewport.height / contentHeight) * margin;
  const offsetX = viewport.width / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = viewport.height / 2 - ((minY + maxY) / 2) * scale;

  return { scale, offsetX, offsetY };
}

/** The room's screen-space bounds, including wall height, for fitting purposes. */
export function roomScreenBounds(room: Room): Point[] {
  const floorPoints = room.polygon.map(worldToScreen);
  const wallTopPoints = floorPoints.map((p) => ({ x: p.x, y: p.y - WALL_HEIGHT_PX }));
  return [...floorPoints, ...wallTopPoints];
}

export function applyFit(container: Container, fit: Fit): void {
  container.scale.set(fit.scale);
  container.position.set(fit.offsetX, fit.offsetY);
}

/** Auto-fits the room's scene container to the current viewport size (FR-003). */
export function fitRoomToViewport(container: Container, room: Room, viewport: Size): Fit {
  const fit = computeFit(roomScreenBounds(room), viewport);
  applyFit(container, fit);
  return fit;
}
