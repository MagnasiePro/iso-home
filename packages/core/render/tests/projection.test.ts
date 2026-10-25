import { describe, expect, it } from "vitest";
import {
  TILE_HEIGHT,
  TILE_WIDTH,
  depthKey,
  isFrontWall,
  polygonCenter,
  polygonEdges,
  worldToScreen,
} from "../src/projection.js";

describe("worldToScreen", () => {
  it("projects the origin to the screen origin", () => {
    expect(worldToScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });

  it("projects one meter along x to half a tile right and half a tile down", () => {
    expect(worldToScreen({ x: 1, y: 0 })).toEqual({ x: TILE_WIDTH / 2, y: TILE_HEIGHT / 2 });
  });

  it("projects one meter along y to half a tile left and half a tile down", () => {
    expect(worldToScreen({ x: 0, y: 1 })).toEqual({ x: -TILE_WIDTH / 2, y: TILE_HEIGHT / 2 });
  });
});

describe("depthKey", () => {
  it("increases toward the near (south-east) side of the room", () => {
    expect(depthKey({ x: 1, y: 1 })).toBeGreaterThan(depthKey({ x: 0, y: 0 }));
  });
});

describe("isFrontWall", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ];
  const center = polygonCenter(square);
  const edges = polygonEdges(square);

  it("marks the north and west edges (far side) as not front", () => {
    expect(isFrontWall(edges[0] as (typeof edges)[number], center)).toBe(false); // north
    expect(isFrontWall(edges[3] as (typeof edges)[number], center)).toBe(false); // west
  });

  it("marks the south and east edges (near side) as front", () => {
    expect(isFrontWall(edges[1] as (typeof edges)[number], center)).toBe(true); // east
    expect(isFrontWall(edges[2] as (typeof edges)[number], center)).toBe(true); // south
  });
});
