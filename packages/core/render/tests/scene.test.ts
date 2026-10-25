import type { Room } from "@iso-home/core-model";
import { describe, expect, it } from "vitest";
import { buildRoomScene } from "../src/scene.js";

const room: Room = {
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

describe("buildRoomScene", () => {
  it("builds a sortable container with floor tiles and only the far walls", () => {
    const container = buildRoomScene(room);

    expect(container.sortableChildren).toBe(true);
    // 4m x 3m room, 1 tile per m^2 => up to 12 floor tiles, plus 2 far walls (north, west)
    expect(container.children.length).toBeGreaterThan(2);
    expect(container.children.length).toBeLessThanOrEqual(12 + 2);
  });
});
