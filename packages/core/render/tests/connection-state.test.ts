import { describe, expect, it } from "vitest";
import { ConnectionState } from "../src/connection-state.js";
import { haloStyle } from "../src/halo.js";

describe("ConnectionState", () => {
  it("starts connected and notifies only on real transitions", () => {
    const c = new ConnectionState();
    const seen: string[] = [];
    const off = c.subscribe((s) => seen.push(s));
    expect(c.status).toBe("connected");
    c.setStatus("connected");
    c.setStatus("reconnecting");
    c.setStatus("reconnecting");
    c.setStatus("connected");
    off();
    c.setStatus("reconnecting");
    expect(seen).toEqual(["reconnecting", "connected"]);
  });
});

describe("haloStyle", () => {
  it("tints from rgb_color and scales alpha with brightness", () => {
    const dim = haloStyle({ rgb_color: [255, 0, 0], brightness: 0 });
    const bright = haloStyle({ rgb_color: [255, 0, 0], brightness: 255 });
    expect(bright?.color).toBe(0xff0000);
    expect((bright?.alpha ?? 0) > (dim?.alpha ?? 1)).toBe(true);
  });

  it("falls back to warm white with brightness only, and none without attributes", () => {
    expect(haloStyle({ brightness: 128 })?.color).toBe(0xffe27a);
    expect(haloStyle({})).toBeUndefined();
    expect(haloStyle(undefined)).toBeUndefined();
  });
});
