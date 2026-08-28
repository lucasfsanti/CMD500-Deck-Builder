import { describe, expect, it } from "vitest";
import { displayName } from "./display-name";

describe("displayName (card-name-language spec)", () => {
  it("returns the Portuguese name when pt is active and pageNamePt is set", () => {
    expect(displayName({ name: "Sol Ring", pageNamePt: "Anel Solar" }, "pt")).toBe("Anel Solar");
  });

  it("falls back to the English name when pt is active but pageNamePt is undefined", () => {
    expect(displayName({ name: "Sol Ring", pageNamePt: undefined }, "pt")).toBe("Sol Ring");
  });

  it("always returns the English name when en is active, regardless of pageNamePt", () => {
    expect(displayName({ name: "Sol Ring", pageNamePt: "Anel Solar" }, "en")).toBe("Sol Ring");
  });
});
