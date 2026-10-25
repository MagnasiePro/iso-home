import { describe, expect, it } from "vitest";
import { snapPointToGrid, snapToGrid } from "../src/snap.js";

describe("snapToGrid", () => {
  it("rounds to the nearest 0.5m by default", () => {
    expect(snapToGrid(1.24)).toBe(1.0);
    expect(snapToGrid(1.26)).toBe(1.5);
    expect(snapToGrid(1.75)).toBe(2.0);
  });

  it("supports a custom grid size", () => {
    expect(snapToGrid(1.3, 0.25)).toBe(1.25);
  });

  it("snaps both coordinates of a point", () => {
    expect(snapPointToGrid({ x: 1.24, y: 3.76 })).toEqual({ x: 1.0, y: 4.0 });
  });
});
