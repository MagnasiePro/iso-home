import { Graphics } from "pixi.js";
import type { RenderedObject } from "./objects.js";

export interface HaloStyle {
  color: number;
  alpha: number;
}

const WARM_WHITE = 0xffe27a;

/**
 * Halo tint for a lit lamp from its `rgb_color` / `brightness` attributes
 * (FR-007). Returns undefined when neither is present — no halo is drawn.
 */
export function haloStyle(attributes: Record<string, unknown> | undefined): HaloStyle | undefined {
  const rgb = attributes?.rgb_color;
  const brightness = attributes?.brightness;
  const channels =
    Array.isArray(rgb) && rgb.length === 3 && rgb.every((c) => typeof c === "number")
      ? (rgb as number[])
      : undefined;
  const level = typeof brightness === "number" ? brightness : undefined;
  if (channels === undefined && level === undefined) return undefined;

  const [r = 0, g = 0, b = 0] = channels ?? [];
  const color = channels ? ((r << 16) | (g << 8) | b) >>> 0 : WARM_WHITE;
  const alpha = 0.15 + 0.35 * (Math.min(Math.max(level ?? 255, 0), 255) / 255);
  return { color, alpha };
}

/** Shows, retints or hides the halo behind a sprite. Call after state/attribute changes. */
export function updateHalo(item: RenderedObject, style: HaloStyle | undefined): void {
  const lit = item.state.visualState === "on" && style !== undefined;
  if (!lit) {
    if (item.halo) item.halo.visible = false;
    return;
  }
  if (!item.halo) {
    item.halo = new Graphics();
    // Same zIndex, inserted just before the sprite: ties draw in child order,
    // so the halo lands over walls/floor at that depth but under its lamp.
    const parent = item.sprite.parent;
    parent?.addChildAt(item.halo, parent.getChildIndex(item.sprite));
  }
  const { x, y } = item.sprite.position;
  item.halo
    .clear()
    .ellipse(x, y - item.sprite.height / 2, 28, 18)
    .fill({ color: style.color, alpha: style.alpha });
  item.halo.zIndex = item.sprite.zIndex;
  item.halo.alpha = item.sprite.alpha;
  item.halo.visible = true;
}
