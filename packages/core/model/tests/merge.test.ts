import { describe, expect, it } from "vitest";
import { mergeHomeModel } from "../src/merge.js";
import type { PlacedObject, Room } from "../src/schemas.js";

const livingRoom: Room = {
  id: "living-room",
  name: "Living Room",
  polygon: [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ],
  openings: [],
};

const lamp: PlacedObject = {
  id: "lamp-1",
  type: "floor-lamp",
  roomId: "living-room",
  position: { x: 3.5, y: 0.5 },
  rotation: 0,
  entityId: "light.salon_lampadaire",
};

describe("mergeHomeModel", () => {
  it("merges matching rooms and objects into a validated HomeModel", () => {
    const model = mergeHomeModel([livingRoom], [lamp]);
    expect(model).toEqual({ version: "1", rooms: [livingRoom], objects: [lamp] });
  });

  it("throws, naming the object and the unmatched roomId, on a mismatch (Clarification 1)", () => {
    const orphan: PlacedObject = { ...lamp, id: "lamp-2", roomId: "kitchen" };

    expect(() => mergeHomeModel([livingRoom], [orphan])).toThrowError(/lamp-2.*kitchen/s);
  });
});
