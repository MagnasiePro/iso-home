import { describe, expect, it } from "vitest";
import { validateElementPack } from "../src/pack-schema.js";

const base = {
  id: "p",
  type: "p",
  footprint: { width: 1, height: 1 },
  sprites: { off: "p.png" },
};

describe("validateElementPack", () => {
  it("accepts a lamp with a light.toggle quick action", () => {
    const result = validateElementPack({ ...base, quickAction: { service: "light.toggle" } });
    expect(result.ok).toBe(true);
  });

  it("accepts a decorative pack with no HA fields", () => {
    expect(validateElementPack(base).ok).toBe(true);
  });

  it.each(["lock.unlock", "alarm_control_panel.arm_away", "valve.open_valve", "cover.open_cover"])(
    "drops a forbidden %s quick action and keeps the pack tap-only",
    (service) => {
      const result = validateElementPack({ ...base, quickAction: { service } });
      expect(result.ok).toBe("tap-only");
      if (result.ok === "tap-only") {
        expect(result.pack.quickAction).toBeUndefined();
        expect(result.reason).not.toBe("");
      }
    },
  );

  it("rejects a malformed manifest", () => {
    expect(validateElementPack({ id: "x" }).ok).toBe(false);
  });
});
