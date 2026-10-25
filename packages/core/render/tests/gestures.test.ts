import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GestureRecognizer } from "../src/gestures.js";

function setup() {
  const calls: string[] = [];
  const g = new GestureRecognizer({
    onTap: () => calls.push("tap"),
    onDoubleTap: () => calls.push("double"),
    onPressStart: () => calls.push("start"),
    onPressCancel: () => calls.push("cancel"),
    onLongPress: () => calls.push("long"),
    onPan: (dx, dy) => calls.push(`pan:${dx},${dy}`),
    onZoomStep: (d) => calls.push(`zoom:${d}`),
  });
  return { g, calls };
}

describe("GestureRecognizer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires a long-press after 500ms and not before", () => {
    const { g, calls } = setup();
    g.pointerDown(1, { x: 50, y: 50 });
    vi.advanceTimersByTime(499);
    expect(calls).not.toContain("long");
    vi.advanceTimersByTime(1);
    expect(calls).toContain("long");
    g.pointerUp(1, { x: 50, y: 50 }, 600);
    expect(calls).not.toContain("tap");
  });

  it("keeps the long-press when the finger drifts 10px or less", () => {
    const { g, calls } = setup();
    g.pointerDown(1, { x: 50, y: 50 });
    g.pointerMove(1, { x: 58, y: 56 });
    vi.advanceTimersByTime(500);
    expect(calls).toContain("long");
  });

  it("cancels the long-press and pans when the finger moves more than 10px", () => {
    const { g, calls } = setup();
    g.pointerDown(1, { x: 50, y: 50 });
    g.pointerMove(1, { x: 50, y: 61 });
    vi.advanceTimersByTime(600);
    expect(calls).toEqual(["start", "cancel", "pan:0,11"]);
  });

  it("emits a tap on a quick release", () => {
    const { g, calls } = setup();
    g.pointerDown(1, { x: 5, y: 5 });
    g.pointerUp(1, { x: 5, y: 5 }, 100);
    expect(calls).toEqual(["start", "cancel", "tap"]);
  });

  it("turns a second quick tap into a double-tap", () => {
    const { g, calls } = setup();
    for (const t of [100, 250]) {
      g.pointerDown(1, { x: 5, y: 5 });
      g.pointerUp(1, { x: 5, y: 5 }, t);
    }
    expect(calls.filter((c) => c === "tap" || c === "double")).toEqual(["tap", "double"]);
  });

  it("does not double-tap when the second tap is too late", () => {
    const { g, calls } = setup();
    g.pointerDown(1, { x: 5, y: 5 });
    g.pointerUp(1, { x: 5, y: 5 }, 100);
    g.pointerDown(1, { x: 5, y: 5 });
    g.pointerUp(1, { x: 5, y: 5 }, 500);
    expect(calls.filter((c) => c === "double")).toEqual([]);
  });

  it("zooms one integer step per pinch threshold crossed", () => {
    const { g, calls } = setup();
    g.pointerDown(1, { x: 100, y: 100 });
    g.pointerDown(2, { x: 200, y: 100 });
    g.pointerMove(2, { x: 220, y: 100 });
    expect(calls).not.toContain("zoom:1");
    g.pointerMove(2, { x: 300, y: 100 });
    expect(calls.filter((c) => c.startsWith("zoom"))).toEqual(["zoom:1"]);
    g.pointerMove(2, { x: 160, y: 100 });
    expect(calls.filter((c) => c.startsWith("zoom"))).toEqual(["zoom:1", "zoom:-1"]);
  });

  it("never long-presses once a second finger lands", () => {
    const { g, calls } = setup();
    g.pointerDown(1, { x: 100, y: 100 });
    g.pointerDown(2, { x: 200, y: 100 });
    vi.advanceTimersByTime(600);
    expect(calls).not.toContain("long");
  });
});
