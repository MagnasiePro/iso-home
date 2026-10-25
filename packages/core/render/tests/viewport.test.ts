import { describe, expect, it } from "vitest";
import { computeFit } from "../src/viewport.js";

describe("computeFit", () => {
  const points = [
    { x: -100, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: 50 },
    { x: 0, y: -50 },
  ];

  it("fits content into a landscape viewport without overflow", () => {
    const fit = computeFit(points, { width: 800, height: 600 });
    expect(fit.scale).toBeGreaterThan(0);
    expect(fit.scale * 200).toBeLessThanOrEqual(800);
  });

  it("fits the same content into a portrait viewport by scaling down further", () => {
    const landscape = computeFit(points, { width: 800, height: 600 });
    const portrait = computeFit(points, { width: 600, height: 800 });
    expect(portrait.scale).toBeLessThan(landscape.scale);
  });

  it("centers the content in the viewport", () => {
    const fit = computeFit(points, { width: 800, height: 600 });
    // content's screen-space center is (0, 0), so the offset should land it at the viewport's center
    expect(fit.offsetX).toBeCloseTo(400);
    expect(fit.offsetY).toBeCloseTo(300);
  });
});
