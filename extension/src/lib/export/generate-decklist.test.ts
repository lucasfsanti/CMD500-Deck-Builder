import { describe, expect, it } from "vitest";
import { generateLigaMagicExport, generateReadableExport } from "./generate-decklist";
import { moveCard } from "../organizer/deck-state";
import type { DeckCard } from "../deck/types";

function card(name: string, zone: DeckCard["zone"], quantity = 1): DeckCard {
  return {
    id: name,
    name,
    quantity,
    zone,
    pageLowestPrice: 1,
    pageImageUrl: undefined,
    enrichment: undefined,
    enrichmentStatus: "pending",
  };
}

const fullDeck: DeckCard[] = [
  card("Xyris, the Writhing Storm", "comandante"),
  card("Vial Smasher the Fierce", "comandanteParceiro"),
  card("Sol Ring", "mainDeck"),
  card("Forest", "mainDeck", 9),
  card("Chalice of the Void", "maybeboard", 3),
  card("Rhystic Study", "maybeboard"),
];

describe("generateLigaMagicExport (task 7.1)", () => {
  it("merges commander zones into the unlabeled main block, ahead of the rest of Main Deck", () => {
    const text = generateLigaMagicExport(fullDeck);
    const lines = text.split("\n");
    expect(lines[0]).toBe("1 Xyris, the Writhing Storm");
    expect(lines[1]).toBe("1 Vial Smasher the Fierce");
    expect(lines).toContain("1 Sol Ring");
    expect(lines).toContain("9 Forest");
  });

  it("separates the maybeboard block with a single blank line, no header text", () => {
    const text = generateLigaMagicExport(fullDeck);
    expect(text).not.toContain("Maybeboard");
    expect(text).not.toContain("Comandante");
    expect(text.split("\n\n")).toHaveLength(2); // main, maybeboard
    expect(text).toContain("\n\n3 Chalice of the Void");
  });

  it("omits an empty zone's block entirely rather than leaving stray blank lines", () => {
    const deckWithoutMaybeboard = fullDeck.filter((c) => c.zone !== "maybeboard");
    const text = generateLigaMagicExport(deckWithoutMaybeboard);
    expect(text).not.toContain("\n\n\n");
    expect(text.trim().endsWith("9 Forest")).toBe(true);
  });

  it("matches LigaMagic's own confirmed export shape for a deck with no maybeboard (single block, no blank lines)", () => {
    const cards = [card("Xyris, the Writhing Storm", "comandante"), card("Sol Ring", "mainDeck")];
    const text = generateLigaMagicExport(cards);
    expect(text).toBe("1 Xyris, the Writhing Storm\n1 Sol Ring");
  });
});

describe("generateReadableExport (task 7.1b)", () => {
  it("shows each non-empty zone under its own header", () => {
    const text = generateReadableExport(fullDeck);
    expect(text).toContain("Comandante\n1 Xyris, the Writhing Storm");
    expect(text).toContain("Comandante Parceiro\n1 Vial Smasher the Fierce");
    expect(text).toContain("Maybeboard\n3 Chalice of the Void\n1 Rhystic Study");
  });

  it("omits headers for empty zones", () => {
    const cards = [card("Sol Ring", "mainDeck")];
    const text = generateReadableExport(cards);
    expect(text).not.toContain("Maybeboard");
    expect(text).not.toContain("Comandante");
  });
});

describe("export reflects current organizer state, not last capture (verification finding #4b)", () => {
  it("reflects a drag-and-drop move made since capture, in both export formats", () => {
    const captured = [card("Llanowar Elves", "mainDeck"), card("Sol Ring", "maybeboard")];

    const afterMove = moveCard(captured, "Llanowar Elves", "maybeboard").cards;

    const ligaExport = generateLigaMagicExport(afterMove);
    const readableExport = generateReadableExport(afterMove);

    // Moved into the maybeboard zone alongside Sol Ring; Main Deck is now
    // empty so the unlabeled main block is omitted entirely from the
    // LigaMagic-exact export (only one block remains, no blank-line
    // separator needed). Array order (moveCard reassigns zone in place,
    // it doesn't reorder) puts Elves first, matching captured order.
    expect(ligaExport).toBe("1 Llanowar Elves\n1 Sol Ring");
    expect(readableExport).toBe("Maybeboard\n1 Llanowar Elves\n1 Sol Ring");
    // The original captured order (Elves in Main Deck) must not appear.
    expect(generateLigaMagicExport(captured)).not.toBe(ligaExport);
  });

  it("reflects a quantity edit made since capture", () => {
    const captured = [card("Sol Ring", "mainDeck", 1)];
    const edited: DeckCard[] = [{ ...captured[0]!, quantity: 4 }];

    expect(generateLigaMagicExport(edited)).toBe("4 Sol Ring");
    expect(generateLigaMagicExport(captured)).toBe("1 Sol Ring");
  });
});

describe("export availability regardless of deck status (task 7.4)", () => {
  it("both formats produce complete output for a deck that would be over budget or contain illegal cards", () => {
    // The generator has no awareness of budget/legality at all — it always
    // produces a complete decklist from whatever cards/zones exist.
    const overBudgetDeck = [card("Anything", "mainDeck", 100)];
    expect(generateLigaMagicExport(overBudgetDeck)).toBe("100 Anything");
    expect(generateReadableExport(overBudgetDeck)).toBe("Deck Principal\n100 Anything");
  });
});
