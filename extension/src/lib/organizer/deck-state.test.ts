import { describe, expect, it } from "vitest";
import { moveCard, setCardQuantity } from "./deck-state";
import type { DeckCard } from "../deck/types";

function card(id: string, zone: DeckCard["zone"], quantity = 1): DeckCard {
  return {
    id,
    name: id,
    quantity,
    zone,
    pageLowestPrice: 1,
    pageImageUrl: undefined,
    enrichmentStatus: "pending",
    enrichment: undefined,
  };
}

describe("moveCard (task 4.3)", () => {
  it("moves a card from Maybeboard to Main Deck", () => {
    const cards = [card("a", "maybeboard")];
    const result = moveCard(cards, "a", "mainDeck");
    expect(result.error).toBeUndefined();
    expect(result.cards.find((c) => c.id === "a")?.zone).toBe("mainDeck");
  });

  it("leaves the deck unchanged when the card id does not exist", () => {
    const cards = [card("a", "maybeboard")];
    const result = moveCard(cards, "missing", "mainDeck");
    expect(result.error).toBeDefined();
    expect(result.cards).toBe(cards);
  });

  it("is a no-op when dropped on the card's current zone", () => {
    const cards = [card("a", "mainDeck")];
    const result = moveCard(cards, "a", "mainDeck");
    expect(result.cards).toBe(cards);
  });
});

describe("moveCard commander cardinality (task 4.4)", () => {
  it("rejects a second card dropped into an occupied Comandante zone", () => {
    const cards = [card("existing", "comandante"), card("challenger", "mainDeck")];
    const result = moveCard(cards, "challenger", "comandante");

    expect(result.error).toMatch(/already has a commander/i);
    expect(result.cards.find((c) => c.id === "challenger")?.zone).toBe("mainDeck");
  });

  it("allows a card into an empty Comandante Parceiro zone", () => {
    const cards = [card("primary", "comandante"), card("partner", "mainDeck")];
    const result = moveCard(cards, "partner", "comandanteParceiro");

    expect(result.error).toBeUndefined();
    expect(result.cards.find((c) => c.id === "partner")?.zone).toBe("comandanteParceiro");
  });

  it("rejects a second card dropped into an occupied Comandante Parceiro zone", () => {
    const cards = [
      card("primary", "comandante"),
      card("partner", "comandanteParceiro"),
      card("challenger", "mainDeck"),
    ];
    const result = moveCard(cards, "challenger", "comandanteParceiro");
    expect(result.error).toBeDefined();
  });

  it("allows the occupant itself to be re-dropped without triggering the occupancy check", () => {
    const cards = [card("existing", "comandante")];
    const result = moveCard(cards, "existing", "comandante");
    expect(result.error).toBeUndefined();
  });
});

describe("setCardQuantity (task 4.5)", () => {
  it("updates a card's quantity", () => {
    const cards = [card("a", "mainDeck", 1)];
    const updated = setCardQuantity(cards, "a", 4);
    expect(updated.find((c) => c.id === "a")?.quantity).toBe(4);
  });

  it("clamps a negative quantity to zero rather than going negative", () => {
    const cards = [card("a", "mainDeck", 1)];
    const updated = setCardQuantity(cards, "a", -3);
    expect(updated.find((c) => c.id === "a")?.quantity).toBe(0);
  });

  it("does not change a card's zone when its quantity is edited", () => {
    const cards = [card("a", "sideboard", 1)];
    const updated = setCardQuantity(cards, "a", 5);
    expect(updated.find((c) => c.id === "a")?.zone).toBe("sideboard");
  });
});
