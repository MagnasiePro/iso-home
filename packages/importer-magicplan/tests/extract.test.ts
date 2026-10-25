import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractFromSvg } from "../src/extract.js";
import { toRoom } from "../src/to-home-model.js";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "fixtures",
  "magicplan",
  "sample-room.svg",
);
const svgContent = readFileSync(fixturePath, "utf-8");

describe("extractFromSvg", () => {
  it("extracts the 4-point wall outline", () => {
    const geometry = extractFromSvg(svgContent);
    expect(geometry.outline).toEqual([
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 300 },
      { x: 0, y: 300 },
    ]);
  });

  it("extracts the door on the south wall", () => {
    const geometry = extractFromSvg(svgContent);
    const door = geometry.openings.find((o) => o.type === "door");
    expect(door).toBeDefined();
    expect(door?.width).toBe(90);
    // South wall is outline[2] -> outline[3] (400,300) -> (0,300)
    expect(door?.wallSegmentIndex).toBe(2);
  });

  it("extracts the window on the east wall", () => {
    const geometry = extractFromSvg(svgContent);
    const window_ = geometry.openings.find((o) => o.type === "window");
    expect(window_).toBeDefined();
    expect(window_?.width).toBe(120);
    // East wall is outline[1] -> outline[2] (400,0) -> (400,300)
    expect(window_?.wallSegmentIndex).toBe(1);
  });
});

describe("toRoom", () => {
  it("converts to meters, snapped to the 0.5m grid, with a deterministic id", () => {
    const geometry = extractFromSvg(svgContent);
    const room = toRoom("Living Room", geometry);

    expect(room.id).toBe("living-room");
    expect(room.polygon).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ]);
    expect(room.openings).toHaveLength(2);
    expect(room.openings[0]?.width).toBeCloseTo(0.9);
  });

  it("produces the same room id across repeated imports (Clarification 1)", () => {
    const geometry = extractFromSvg(svgContent);
    const first = toRoom("Living Room", geometry);
    const second = toRoom("Living Room", geometry);
    expect(first.id).toBe(second.id);
  });
});
