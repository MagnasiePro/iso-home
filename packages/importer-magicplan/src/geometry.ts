export interface Vec2 {
  x: number;
  y: number;
}

/** Shortest distance from `point` to the segment [a, b]. */
export function distanceToSegment(point: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * abx + (point.y - a.y) * aby) / lengthSquared),
  );
  const closest = { x: a.x + t * abx, y: a.y + t * aby };
  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

/** Index of the polygon edge (points[i] -> points[i+1], wrapping) nearest to `point`. */
export function nearestEdgeIndex(point: Vec2, polygon: Vec2[]): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    if (a === undefined || b === undefined) continue;

    const distance = distanceToSegment(point, a, b);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  return bestIndex;
}
