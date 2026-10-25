import { type Opening, type Room, slugifyRoomName, snapPointToGrid } from "@iso-home/core-model";
import type { RawRoomGeometry } from "./extract.js";

const CM_PER_METER = 100;

/** Converts the extractor's raw cm geometry into a validated, snapped Room (FR-001). */
export function toRoom(roomName: string, geometry: RawRoomGeometry): Room {
  const polygon = geometry.outline.map((point) =>
    snapPointToGrid({ x: point.x / CM_PER_METER, y: point.y / CM_PER_METER }),
  );

  const openings: Opening[] = geometry.openings.map((opening, index) => ({
    id: `${opening.type}-${index + 1}`,
    type: opening.type,
    wallSegmentIndex: opening.wallSegmentIndex,
    width: opening.width / CM_PER_METER,
  }));

  return {
    id: slugifyRoomName(roomName),
    name: roomName,
    polygon,
    openings,
  };
}
