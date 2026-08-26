import { describe, expect, it } from "vitest";
import { extractManaCost } from "./mana-cost";

function cardRow(cmcHtml: string): Element {
  const doc = new DOMParser().parseFromString(
    `<div class="deck-line"><div class="deck-box-right">${cmcHtml}</div></div>`,
    "text/html",
  );
  return doc.querySelector(".deck-line")!;
}

describe("extractManaCost", () => {
  it("decodes a multi-symbol cost to ordered canonical codes", () => {
    const row = cardRow(`
      <div class="deck-cmc">
        <span class="txt-mana">
          <abbr class="mtg-symbol mtg-symbol-dois"></abbr>
          <abbr class="mtg-symbol mtg-symbol-g"></abbr>
          <abbr class="mtg-symbol mtg-symbol-u"></abbr>
          <abbr class="mtg-symbol mtg-symbol-r"></abbr>
        </span>
      </div>
    `);
    expect(extractManaCost(row)).toEqual(["2", "G", "U", "R"]);
  });

  it("returns undefined when the row has no mana-cost markup", () => {
    const row = cardRow("");
    expect(extractManaCost(row)).toBeUndefined();
  });

  it("returns undefined for the whole cost when one symbol's slug isn't recognized", () => {
    const row = cardRow(`
      <div class="deck-cmc">
        <span class="txt-mana">
          <abbr class="mtg-symbol mtg-symbol-um"></abbr>
          <abbr class="mtg-symbol mtg-symbol-nonexistent-symbol"></abbr>
        </span>
      </div>
    `);
    expect(extractManaCost(row)).toBeUndefined();
  });

  it("decodes a Phyrexian mana symbol", () => {
    const row = cardRow(`
      <div class="deck-cmc">
        <span class="txt-mana">
          <abbr class="mtg-symbol mtg-symbol-um"></abbr>
          <abbr class="mtg-symbol mtg-symbol-bp"></abbr>
          <abbr class="mtg-symbol mtg-symbol-bp"></abbr>
        </span>
      </div>
    `);
    expect(extractManaCost(row)).toEqual(["1", "BP", "BP"]);
  });
});
