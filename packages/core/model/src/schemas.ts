import { z } from "zod";

/** Room-local coordinates, in meters. */
export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Point = z.infer<typeof PointSchema>;

export const OpeningSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["door", "window"]),
  /** Index into the owning Room's polygon edge list. */
  wallSegmentIndex: z.number().int().nonnegative(),
  /** Meters. */
  width: z.number().positive(),
});
export type Opening = z.infer<typeof OpeningSchema>;

/** Deterministic slug of the room's name — see slugifyRoomName. */
const ROOM_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const RoomSchema = z.object({
  id: z.string().regex(ROOM_ID_PATTERN, "Room.id must be a lowercase, hyphenated slug"),
  name: z.string().min(1),
  /** Room outline in meters, snapped to the 0.5m grid (FR-001). At least 3 points. */
  polygon: z.array(PointSchema).min(3),
  openings: z.array(OpeningSchema),
});
export type Room = z.infer<typeof RoomSchema>;

const HA_ENTITY_ID_PATTERN = /^[a-z_]+\.[a-z0-9_]+$/;

export const PlacedObjectSchema = z.object({
  id: z.string().min(1),
  /** Must match some loaded ElementPack.type. */
  type: z.string().min(1),
  roomId: z.string().regex(ROOM_ID_PATTERN),
  position: PointSchema,
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  entityId: z.string().regex(HA_ENTITY_ID_PATTERN).optional(),
});
export type PlacedObject = z.infer<typeof PlacedObjectSchema>;
