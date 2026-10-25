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

  it("rejects a garage/door/gate cover quick action", () => {
    expect(checkQuickAction({ service: "cover.open_cover" }, "garage")).not.toBeNull();
    expect(checkQuickAction({ service: "cover.open_cover" }, "door")).not.toBeNull();
    expect(checkQuickAction({ service: "cover.open_cover" }, "gate")).not.toBeNull();
  });

  it("allows a non-forbidden cover device_class, e.g. curtains", () => {
    expect(checkQuickAction({ service: "cover.open_cover" }, "curtain")).toBeNull();
  });
});
