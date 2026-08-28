import { describe, expect, it } from "vitest";
import { parseScryfallManaCost } from "./mana-cost";

describe("parseScryfallManaCost", () => {
  it("decodes a plain multi-symbol cost", () => {
    expect(parseScryfallManaCost("{2}{G}{U}{R}")).toEqual(["2", "G", "U", "R"]);
  });

  it("decodes a two-color hybrid symbol printed in canonical order", () => {
    expect(parseScryfallManaCost("{1}{B/G}")).toEqual(["1", "BG"]);
  });

  it("sorts a two-color hybrid symbol printed in reverse order to the same canonical code", () => {
    expect(parseScryfallManaCost("{1}{W/B}")).toEqual(["1", "BW"]);
    expect(parseScryfallManaCost("{1}{B/W}")).toEqual(["1", "BW"]);
  });

  it("decodes a Phyrexian mana symbol", () => {
    expect(parseScryfallManaCost("{1}{B/P}{B/P}")).toEqual(["1", "BP", "BP"]);
  });

  it("decodes Thranduil, Sindarin Liege // Silvan Rally's real per-face costs", () => {
    expect(parseScryfallManaCost("{2}{G/U}{G/U}")).toEqual(["2", "GU", "GU"]);
    expect(parseScryfallManaCost("{1}{G/U}{G/U}")).toEqual(["1", "GU", "GU"]);
  });

  it("returns undefined for an empty cost (a face with no printed cost)", () => {
    expect(parseScryfallManaCost("")).toBeUndefined();
  });

  it("returns undefined rather than guess at an unrecognized symbol shape (e.g. generic hybrid)", () => {
    expect(parseScryfallManaCost("{2/W}")).toBeUndefined();
  });
});
