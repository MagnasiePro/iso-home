import { describe, expect, it } from "vitest";
import { checkQuickAction } from "../src/quick-action.js";

describe("checkQuickAction", () => {
  it("allows an ordinary light toggle", () => {
    expect(checkQuickAction({ service: "light.toggle" })).toBeNull();
  });

  it("rejects a lock domain quick action", () => {
    const rejection = checkQuickAction({ service: "lock.unlock" });
    expect(rejection?.reason).toMatch(/lock/);
  });

  it("rejects alarm_control_panel and valve quick actions", () => {
    expect(checkQuickAction({ service: "alarm_control_panel.arm_away" })).not.toBeNull();
    expect(checkQuickAction({ service: "valve.open_valve" })).not.toBeNull();
  });

  it("rejects generic/indirect service domains that could target any entity", () => {
    // These bypass a plain denylist entirely, since none of them is itself
    // "lock" or "alarm_control_panel" — they can still act on one.
    expect(checkQuickAction({ service: "homeassistant.turn_on" })).not.toBeNull();
    expect(checkQuickAction({ service: "script.turn_on" })).not.toBeNull();
    expect(checkQuickAction({ service: "scene.turn_on" })).not.toBeNull();
    expect(checkQuickAction({ service: "automation.trigger" })).not.toBeNull();
  });

  it("rejects a garage/door/gate cover quick action", () => {
    expect(checkQuickAction({ service: "cover.open_cover" }, "garage")).not.toBeNull();
    expect(checkQuickAction({ service: "cover.open_cover" }, "door")).not.toBeNull();
    expect(checkQuickAction({ service: "cover.open_cover" }, "gate")).not.toBeNull();
  });

  it("rejects a cover quick action with no known device_class (fail-closed)", () => {
    expect(checkQuickAction({ service: "cover.open_cover" })).not.toBeNull();
  });

  it("allows a known-safe cover device_class, e.g. curtains", () => {
    expect(checkQuickAction({ service: "cover.open_cover" }, "curtain")).toBeNull();
  });

  it("rejects when the bound entity's domain doesn't match the service's domain", () => {
    const rejection = checkQuickAction({ service: "light.toggle" }, undefined, "lock.front_door");
    expect(rejection?.reason).toMatch(/does not match/);
  });

  it("allows when the bound entity's domain matches the service's domain", () => {
    expect(
      checkQuickAction({ service: "light.toggle" }, undefined, "light.salon_lampadaire"),
    ).toBeNull();
  });
});
