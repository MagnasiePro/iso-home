import { z } from "zod";
import { QuickActionSchema } from "./quick-action.js";

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
