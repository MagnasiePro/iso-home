import type { Point } from "./schemas.js";

/** Snaps a coordinate (in meters) to the nearest multiple of gridSize (FR-001's 0.5m grid). */
export function snapToGrid(value: number, gridSize = 0.5): number {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(point: Point, gridSize = 0.5): Point {
  return { x: snapToGrid(point.x, gridSize), y: snapToGrid(point.y, gridSize) };
}
