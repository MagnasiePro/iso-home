import { describe, expect, it } from "vitest";
import { slugifyRoomName } from "../src/slug.js";

describe("slugifyRoomName", () => {
  it("is deterministic for the same name", () => {
    expect(slugifyRoomName("Living Room")).toBe(slugifyRoomName("Living Room"));
  });

  it("produces a lowercase, hyphenated slug", () => {
    expect(slugifyRoomName("Living Room")).toBe("living-room");
  });

  it("strips accents", () => {
    expect(slugifyRoomName("Séjour")).toBe("sejour");
  });

  it("collapses repeated separators", () => {
    expect(slugifyRoomName("Kitchen  &  Dining")).toBe("kitchen-dining");
  });

  it("throws on a name with no alphanumeric characters", () => {
    expect(() => slugifyRoomName("***")).toThrow();
  });
});
