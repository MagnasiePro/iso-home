import { describe, expect, it } from "vitest";
import { enlargeRect, pickTarget } from "../src/hit-area.js";
import { loadPacks } from "../src/pack-loader.js";
import { applyOptimistic, confirm, createSpriteState, rollback } from "../src/sprite-state.js";

describe("SpriteState", () => {
  it("applies optimistically then confirms", () => {
    const s = applyOptimistic(createSpriteState("a", "off"), "on");
    expect(s).toMatchObject({ visualState: "on", optimistic: true });
    const done = confirm(s, "on");
    expect(done.optimistic).toBe(false);
    expect("previousVisualState" in done).toBe(false);
  });

  it("rolls back to the pre-optimistic state and flags the error", () => {
    const s = applyOptimistic(applyOptimistic(createSpriteState("a", "off"), "on"), "off");
    expect(rollback(s)).toMatchObject({ visualState: "off", optimistic: false, errorFlag: true });
  });
});

describe("hit area", () => {
  it("enlarges small sprites to 44px around their center, never shrinks", () => {
    expect(enlargeRect({ x: 10, y: 10, width: 20, height: 60 })).toEqual({
      x: -2,
      y: 10,
      width: 44,
      height: 60,
    });
  });

  it("picks the frontmost target among overlaps, using the enlarged area", () => {
    const targets = [
      { id: "back", rect: { x: 0, y: 0, width: 20, height: 20 }, depth: 1 },
      { id: "front", rect: { x: 10, y: 10, width: 20, height: 20 }, depth: 2 },
    ];
    expect(pickTarget(targets, { x: 15, y: 15 })).toBe("front");
    expect(pickTarget(targets, { x: -10, y: 10 })).toBe("back");
    expect(pickTarget(targets, { x: 200, y: 200 })).toBeUndefined();
  });
});

describe("loadPacks", () => {
  it("logs and strips a forbidden quick action but keeps the pack", () => {
    const logs: string[] = [];
    const packs = loadPacks(
      [
        {
          id: "door-lock",
          type: "door-lock",
          footprint: { width: 1, height: 1 },
          sprites: { locked: "l.png" },
          quickAction: { service: "lock.unlock" },
        },
      ],
      (m) => logs.push(m),
    );
    expect(packs.get("door-lock")?.quickAction).toBeUndefined();
    expect(logs[0]).toMatch(/lock/);
  });
});
