import { describe, expect, it } from "vitest";
import { checkLegality } from "./check-legality";
import type { DeckCard } from "../deck/types";

function card(
  name: string,
  zone: DeckCard["zone"],
  overrides: Partial<DeckCard> = {},
): DeckCard {
  return {
    id: name,
    name,
    quantity: 1,
    zone,
    pageLowestPrice: 1,
    enrichment: {
      name,
      typeLine: "Creature",
      colorIdentity: [],
      cmc: 1,
      layout: "normal",
      legalInCommander: true,
      scryfallId: name,
    },
    enrichmentStatus: "ok",
    ...overrides,
  };
}

describe("checkLegality — Commander 500 (task 6.2)", () => {
  it("flags a card Scryfall marks as banned in Commander", () => {
    const cards = [
      card("Balance", "mainDeck", {
        enrichment: {
          name: "Balance",
          typeLine: "Sorcery",
          colorIdentity: ["W"],
          cmc: 1,
          layout: "normal",
          legalInCommander: false,
          scryfallId: "balance",
        },
      }),
    ];
    const result = checkLegality(cards, "commander500");
    expect(result.status).toBe("ok");
    expect(result.illegalCardIds.has("Balance")).toBe(true);
  });

  it("does not flag a legal card", () => {
    const cards = [card("Sol Ring", "mainDeck")];
    const result = checkLegality(cards, "commander500");
    expect(result.illegalCardIds.size).toBe(0);
  });
});

describe("checkLegality — Commander 500 Duel (task 6.3)", () => {
  it("flags a banned-in-deck card across any zone", () => {
    const cards = [card("Sol Ring", "mainDeck")];
    const result = checkLegality(cards, "commander500Duel");
    expect(result.illegalCardIds.has("Sol Ring")).toBe(true);
  });

  it("flags a banned-as-commander-only card when it is placed in Comandante", () => {
    const cards = [card("Edgar Markov", "comandante")];
    const result = checkLegality(cards, "commander500Duel");
    expect(result.illegalCardIds.has("Edgar Markov")).toBe(true);
  });

  it("does not flag a banned-as-commander-only card when it is in Main Deck instead", () => {
    const cards = [card("Edgar Markov", "mainDeck")];
    const result = checkLegality(cards, "commander500Duel");
    expect(result.illegalCardIds.has("Edgar Markov")).toBe(false);
  });

  it("flags the banned-as-companion card regardless of zone", () => {
    const cards = [card("Lutri, the Spellchaser", "sideboard")];
    const result = checkLegality(cards, "commander500Duel");
    expect(result.illegalCardIds.has("Lutri, the Spellchaser")).toBe(true);
  });
});

describe("checkLegality deck-level illegal count (task 6.5)", () => {
  it("reflects flags across multiple zones in a single count", () => {
    // Sol Ring (mainDeck) and Mana Crypt (sideboard) are both banned-in-deck
    // under Commander 500 Duel — a fixture with two banned cards in
    // different zones, per the format-legality spec's scenario.
    const cards = [
      card("Sol Ring", "mainDeck"),
      card("Mana Crypt", "sideboard"),
      card("Lightning Bolt", "mainDeck"),
    ];
    const result = checkLegality(cards, "commander500Duel");
    expect(result.illegalCardIds.size).toBe(2);
    expect(result.illegalCardIds.has("Sol Ring")).toBe(true);
    expect(result.illegalCardIds.has("Mana Crypt")).toBe(true);
    expect(result.illegalCardIds.has("Lightning Bolt")).toBe(false);
  });
});

describe("checkLegality — same card differs by format", () => {
  it("a card absent from the Commander banlist but present on the Duel Commander banlist is illegal only under Commander 500 Duel", () => {
    // Sol Ring is legal in Commander (per Scryfall) but banned-in-deck under Duel Commander.
    const cards = [card("Sol Ring", "mainDeck")];
    expect(checkLegality(cards, "commander500").illegalCardIds.has("Sol Ring")).toBe(false);
    expect(checkLegality(cards, "commander500Duel").illegalCardIds.has("Sol Ring")).toBe(true);
  });
});

describe("checkLegality degraded mode (task 6.6)", () => {
  it("reports 'unknown' for Commander 500 when a card's enrichment is unavailable, rather than showing zero illegal cards", () => {
    const cards = [card("Mystery", "mainDeck", { enrichment: undefined, enrichmentStatus: "unavailable" })];
    const result = checkLegality(cards, "commander500");
    expect(result.status).toBe("unknown");
  });

  it("also reports 'unknown' while a card's enrichment is still pending, not just once it gives up", () => {
    // Otherwise the panel could briefly show a confident 0-illegal-cards
    // result before every card in the deck has actually been checked.
    const cards = [card("Still Loading", "mainDeck", { enrichment: undefined, enrichmentStatus: "pending" })];
    const result = checkLegality(cards, "commander500");
    expect(result.status).toBe("unknown");
  });

  it("Commander 500 Duel is unaffected by the same Scryfall outage, since it uses the bundled dataset", () => {
    const cards = [card("Mystery", "mainDeck", { enrichment: undefined, enrichmentStatus: "unavailable" })];
    const result = checkLegality(cards, "commander500Duel");
    expect(result.status).toBe("ok");
  });
});
