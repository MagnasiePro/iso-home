import { describe, expect, it, vi } from "vitest";
import { IdleRenderLoop } from "../src/render-loop.js";

describe("IdleRenderLoop", () => {
  it("renders once on the first tick (initial draw)", () => {
    const render = vi.fn();
    const loop = new IdleRenderLoop(render);

    loop.tick();

    expect(render).toHaveBeenCalledTimes(1);
  });

  it("produces 0 redraws per idle tick after the initial draw (SC-006)", () => {
    const render = vi.fn();
    const loop = new IdleRenderLoop(render);
    loop.tick(); // initial draw
    render.mockClear();

    for (let i = 0; i < 100; i++) loop.tick();

    expect(render).not.toHaveBeenCalled();
  });

  it("redraws exactly once per requestRender()", () => {
    const render = vi.fn();
    const loop = new IdleRenderLoop(render);
    loop.tick();
    render.mockClear();

    loop.requestRender();
    loop.tick();
    loop.tick(); // should not redraw again — already clean

    expect(render).toHaveBeenCalledTimes(1);
  });

  it("redraws on every tick while an animation is in progress, then goes idle", () => {
    const render = vi.fn();
    const loop = new IdleRenderLoop(render);
    loop.tick();
    render.mockClear();

    loop.setAnimating(true);
    loop.tick();
    loop.tick();
    expect(render).toHaveBeenCalledTimes(2);

    loop.setAnimating(false);
    render.mockClear();
    loop.tick(); // nothing requested a render and the animation stopped — idle

    expect(render).not.toHaveBeenCalled();
  });

  it("tracks the redraw count for the on-screen debug counter", () => {
    const loop = new IdleRenderLoop(() => {});
    loop.tick();
    loop.requestRender();
    loop.tick();

    expect(loop.getRedrawCount()).toBe(2);
  });
});
