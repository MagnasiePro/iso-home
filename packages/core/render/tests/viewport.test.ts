import { Container } from "pixi.js";
import { describe, expect, it } from "vitest";
import { Camera, computeFit } from "../src/viewport.js";

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

describe("Camera", () => {
  const room = {
    id: "r",
    name: "r",
    polygon: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    openings: [],
  };

  it("zooms in integer steps about a point, clamps, and refits", () => {
    const container = new Container();
    const camera = new Camera(container, room, () => ({ width: 800, height: 600 }));
    camera.refit();
    const base = container.scale.x;
    const center = { x: 400, y: 300 };
    const before = {
      x: (center.x - container.position.x) / base,
      y: (center.y - container.position.y) / base,
    };

    camera.zoomStep(1, center);
    expect(container.scale.x).toBeCloseTo(base * 2);
    expect((center.x - container.position.x) / container.scale.x).toBeCloseTo(before.x);

    for (let i = 0; i < 10; i++) camera.zoomStep(1, center);
    expect(camera.level).toBe(3);
    camera.zoomStep(-1, center);
    expect(camera.level).toBe(2);

    camera.pan(30, 0);
    camera.refit();
    expect(camera.level).toBe(0);
    expect(container.scale.x).toBeCloseTo(base);
  });
});
