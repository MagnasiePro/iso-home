import type { HomeModel } from "./home-model.js";
import type { PlacedObject, Room } from "./schemas.js";

/**
 * Merges the importer's room geometry with a hand-written device list into
 * one validated HomeModel. Fails loudly — naming the offending object and the
 * unmatched roomId — rather than silently dropping a misconfigured device
 * (Clarification 1, FR-002).
 */
export function mergeHomeModel(rooms: Room[], objects: PlacedObject[]): HomeModel {
  const roomIds = new Set(rooms.map((room) => room.id));

  for (const object of objects) {
    if (!roomIds.has(object.roomId)) {
      throw new Error(
        `Object "${object.id}" references roomId "${object.roomId}", which does not match any imported room (${[...roomIds].join(", ") || "none"})`,
      );
    }
  }

  return { version: "1", rooms, objects };
}
