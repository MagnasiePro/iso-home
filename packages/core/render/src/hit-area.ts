import type { Point } from "@iso-home/core-model";

/** Minimum touch target in screen pixels (FR-014). */
export const MIN_TAP_TARGET_PX = 44;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HitTarget {
  id: string;
  /** Screen-space sprite bounds. */
  rect: Rect;
  /** Painter's depth: the frontmost target wins overlaps. */
  depth: number;
}

/** Grows a rect around its center to at least `min` px per side; never shrinks it. */
export function enlargeRect(rect: Rect, min = MIN_TAP_TARGET_PX): Rect {
  const width = Math.max(rect.width, min);
  const height = Math.max(rect.height, min);
  return {
    x: rect.x - (width - rect.width) / 2,
    y: rect.y - (height - rect.height) / 2,
    width,
    height,
  };
}

export function pickTarget(targets: HitTarget[], p: Point): string | undefined {
  let best: HitTarget | undefined;
  for (const t of targets) {
    const r = enlargeRect(t.rect);
    const hit = p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
    if (hit && (best === undefined || t.depth > best.depth)) best = t;
  }
  return best?.id;
}
