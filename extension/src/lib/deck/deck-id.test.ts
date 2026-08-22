import { describe, expect, it } from "vitest";
import { extractDeckId } from "./deck-id";

describe("extractDeckId", () => {
  it("extracts the id from a deck page URL", () => {
    expect(extractDeckId(new URL("https://www.ligamagic.com.br/?view=dks/deck&id=10174508"))).toBe(
      "10174508",
    );
  });

  it("returns undefined for a non-deck page", () => {
    expect(
      extractDeckId(new URL("https://www.ligamagic.com.br/?view=colecao/colecao")),
    ).toBeUndefined();
  });
});
