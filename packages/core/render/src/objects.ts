import type { ElementPack, PlacedObject } from "@iso-home/core-model";
import type { Graphics, Texture } from "pixi.js";
import { Sprite } from "pixi.js";
import { TILE_HEIGHT, depthKey, worldToScreen } from "./projection.js";
import { type SpriteState, createSpriteState } from "./sprite-state.js";

/** A placed object with its pack, live sprite and runtime state. */
export interface RenderedObject {
  object: PlacedObject;
  pack: ElementPack;
  sprite: Sprite;
  state: SpriteState;
  /** Lit-lamp halo, created on first use (halo.ts). */
  halo?: Graphics;
}

export type TextureResolver = (pack: ElementPack, frame: string) => Texture;

/** First sprite key to show before any state arrives: "off", else the pack's first frame. */
function initialVisualState(pack: ElementPack): string {
  return "off" in pack.sprites ? "off" : (Object.keys(pack.sprites)[0] ?? "default");
}

/**
 * Creates one sprite per object whose type has a loaded pack. Objects with an
 * unknown type are skipped with a console warning rather than aborting the scene.
 */
export function buildObjectSprites(
  objects: PlacedObject[],
  packs: Map<string, ElementPack>,
  texture: TextureResolver,
): RenderedObject[] {
  const rendered: RenderedObject[] = [];
  for (const object of objects) {
    const pack = packs.get(object.type);
    if (pack === undefined) {
      console.warn(`[iso-home] object "${object.id}": no pack for type "${object.type}"`);
      continue;
    }
    const state = createSpriteState(object.id, initialVisualState(pack));
    const sprite = new Sprite(texture(pack, pack.sprites[state.visualState] as string));
    sprite.anchor.set(0.5, 1);
    const screen = worldToScreen(object.position);
    // Sit the sprite's base on the tile's bottom vertex.
    sprite.position.set(screen.x, screen.y + TILE_HEIGHT / 2);
    sprite.zIndex = depthKey(object.position);
    rendered.push({ object, pack, sprite, state });
  }
  return rendered;
}

export function refreshSprite(item: RenderedObject, texture: TextureResolver): void {
  const frame = item.pack.sprites[item.state.visualState];
  if (frame !== undefined) item.sprite.texture = texture(item.pack, frame);
}
