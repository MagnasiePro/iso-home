import { z } from "zod";
import { QuickActionSchema, checkQuickAction } from "./quick-action.js";

export const ElementPackSchema = z.object({
  id: z.string().min(1),
  /** Unique element type key, referenced by PlacedObject.type. */
  type: z.string().min(1),
  /** Home Assistant domains this type can bind to. Omitted for decorative packs (e.g. "plant"). */
  haDomains: z.array(z.string().min(1)).optional().default([]),
  footprint: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  /** Maps a visual state key to a spritesheet frame reference. */
  sprites: z.record(z.string(), z.string().min(1)),
  /** Maps an HA entity's state string to one of `sprites`'s keys. Omitted for decorative packs. */
  stateMap: z.record(z.string(), z.string()).optional().default({}),
  quickAction: QuickActionSchema.optional(),
});
export type ElementPack = z.infer<typeof ElementPackSchema>;

export type PackValidation =
  | { ok: true; pack: ElementPack }
  | { ok: false; reason: string }
  | { ok: "tap-only"; pack: ElementPack; reason: string };

/**
 * Load-time pack check (FR-009). A malformed manifest is rejected outright;
 * a forbidden quick action is dropped and reported, so the device stays
 * usable via tap only (spec User Story 2, scenario 3).
 */
export function validateElementPack(raw: unknown): PackValidation {
  const parsed = ElementPackSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: parsed.error.message };

  const pack = parsed.data;
  if (pack.quickAction === undefined) return { ok: true, pack };

  const rejection = checkQuickAction(pack.quickAction);
  if (rejection === null) return { ok: true, pack };

  const { quickAction: _dropped, ...tapOnly } = pack;
  return { ok: "tap-only", pack: tapOnly, reason: rejection.reason };
}
