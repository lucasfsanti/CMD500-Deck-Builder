import { describe, expect, it } from "vitest";
import { parseBrlPrice } from "./price-parsing";

describe("parseBrlPrice", () => {
  it("parses a simple decimal price", () => {
    expect(parseBrlPrice("2,34")).toBeCloseTo(2.34);
  });

  it("parses a price with a thousands separator", () => {
    expect(parseBrlPrice("2.499,90")).toBeCloseTo(2499.9);
  });

  it("parses a price with multiple thousands separators", () => {
    expect(parseBrlPrice("391.662,50")).toBeCloseTo(391662.5);
  });

  it("returns undefined for empty text", () => {
    expect(parseBrlPrice("")).toBeUndefined();
    expect(parseBrlPrice("   ")).toBeUndefined();
  });
});
