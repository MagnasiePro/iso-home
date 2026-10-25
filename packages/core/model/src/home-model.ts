import { z } from "zod";
import { PlacedObjectSchema, RoomSchema } from "./schemas.js";

export const HomeModelSchema = z.object({
  version: z.literal("1"),
  rooms: z.array(RoomSchema),
  objects: z.array(PlacedObjectSchema),
});
export type HomeModel = z.infer<typeof HomeModelSchema>;
