import { describe, expect, it } from "vitest";
import { HomeModelSchema } from "../src/home-model.js";
import { ElementPackSchema } from "../src/pack-schema.js";
import { PlacedObjectSchema, RoomSchema } from "../src/schemas.js";

describe("RoomSchema", () => {
  it("rejects a room id that isn't a lowercase slug", () => {
    expect(() =>
      RoomSchema.parse({
        id: "Living Room",
        name: "Living Room",
        polygon: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
        ],
        openings: [],
      }),
    ).toThrow();
  });

  it("rejects a polygon with fewer than 3 points", () => {
    expect(() =>
      RoomSchema.parse({
        id: "living-room",
        name: "Living Room",
        polygon: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
        openings: [],
      }),
    ).toThrow();
  });
});

describe("PlacedObjectSchema", () => {
  it("accepts a device with a valid Home Assistant entityId", () => {
    const object = PlacedObjectSchema.parse({
      id: "lamp-1",
      type: "floor-lamp",
      roomId: "living-room",
      position: { x: 1, y: 1 },
      rotation: 90,
      entityId: "light.salon_lampadaire",
    });
    expect(object.rotation).toBe(90);
  });

  it("rejects an invalid rotation", () => {
    expect(() =>
      PlacedObjectSchema.parse({
        id: "lamp-1",
        type: "floor-lamp",
        roomId: "living-room",
        position: { x: 1, y: 1 },
        rotation: 45,
      }),
    ).toThrow();
  });

  it("allows a decorative object with no entityId", () => {
    const object = PlacedObjectSchema.parse({
      id: "plant-1",
      type: "plant",
      roomId: "living-room",
      position: { x: 0.5, y: 0.5 },
      rotation: 0,
    });
    expect(object.entityId).toBeUndefined();
  });
});

describe("HomeModelSchema", () => {
  it("accepts an empty model", () => {
    expect(() => HomeModelSchema.parse({ version: "1", rooms: [], objects: [] })).not.toThrow();
  });
});

describe("ElementPackSchema", () => {
  it("accepts the plant pack with no haDomains, stateMap, or quickAction", () => {
    const pack = ElementPackSchema.parse({
      id: "plant",
      type: "plant",
      footprint: { width: 1, height: 1 },
      sprites: { default: "plant.png" },
    });
    expect(pack.haDomains).toEqual([]);
    expect(pack.stateMap).toEqual({});
    expect(pack.quickAction).toBeUndefined();
  });

  it("accepts a lamp pack with a quickAction", () => {
    const pack = ElementPackSchema.parse({
      id: "floor-lamp",
      type: "floor-lamp",
      haDomains: ["light"],
      footprint: { width: 1, height: 1 },
      sprites: { off: "off.png", on: "on.png" },
      stateMap: { off: "off", on: "on" },
      quickAction: { service: "light.toggle" },
    });
    expect(pack.quickAction?.service).toBe("light.toggle");
  });
});
