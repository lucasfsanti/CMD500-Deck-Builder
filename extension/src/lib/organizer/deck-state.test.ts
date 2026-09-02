import { describe, expect, it } from "vitest";
import { moveCard, setCardQuantity, setCardPrice, removeCard, reorderWithinGroup, clearCustomOrder } from "./deck-state";
import type { DeckCard } from "../deck/types";

function card(id: string, zone: DeckCard["zone"], quantity = 1): DeckCard {
  return {
    id,
    name: id,
    quantity,
    zone,
    pageLowestPrice: 1,
    pageImageUrl: undefined,
    pageManaCostSymbols: undefined,
    pageNamePt: undefined,
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

    expect(result.error).toMatch(/já tem um comandante/i);
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
    const cards = [card("a", "maybeboard", 1)];
    const updated = setCardQuantity(cards, "a", 5);
    expect(updated.find((c) => c.id === "a")?.zone).toBe("maybeboard");
  });
});

describe("setCardPrice", () => {
  it("updates a card's price", () => {
    const cards = [card("a", "mainDeck")];
    const updated = setCardPrice(cards, "a", 7.5);
    expect(updated.find((c) => c.id === "a")?.pageLowestPrice).toBe(7.5);
  });

  it("rejects a negative price, leaving the deck unchanged", () => {
    const cards = [card("a", "mainDeck")];
    const updated = setCardPrice(cards, "a", -1);
    expect(updated).toBe(cards);
  });

  it("rejects a NaN price, leaving the deck unchanged", () => {
    const cards = [card("a", "mainDeck")];
    const updated = setCardPrice(cards, "a", Number.NaN);
    expect(updated).toBe(cards);
  });

  it("sets a price on a card whose price was previously undefined", () => {
    const cards = [{ ...card("a", "mainDeck"), pageLowestPrice: undefined }];
    const updated = setCardPrice(cards, "a", 12);
    expect(updated.find((c) => c.id === "a")?.pageLowestPrice).toBe(12);
  });
});

describe("reorderWithinGroup", () => {
  it("stamps rank onto every card in the given sequence", () => {
    const cards = [card("a", "mainDeck"), card("b", "mainDeck"), card("c", "mainDeck")];
    const updated = reorderWithinGroup(cards, "type", "Creature", ["c", "a", "b"]);
    expect(updated.find((c) => c.id === "c")?.customOrder).toEqual({ axis: "type", groupKey: "Creature", rank: 0 });
    expect(updated.find((c) => c.id === "a")?.customOrder).toEqual({ axis: "type", groupKey: "Creature", rank: 1 });
    expect(updated.find((c) => c.id === "b")?.customOrder).toEqual({ axis: "type", groupKey: "Creature", rank: 2 });
  });

  it("leaves cards outside the given group/ids untouched", () => {
    const cards = [card("a", "mainDeck"), card("b", "mainDeck")];
    const updated = reorderWithinGroup(cards, "type", "Creature", ["a"]);
    expect(updated.find((c) => c.id === "b")?.customOrder).toBeUndefined();
  });

  it("overwrites a previous custom order when called again with a different sequence", () => {
    const cards = [card("a", "mainDeck"), card("b", "mainDeck")];
    const first = reorderWithinGroup(cards, "type", "Creature", ["a", "b"]);
    const second = reorderWithinGroup(first, "type", "Creature", ["b", "a"]);
    expect(second.find((c) => c.id === "b")?.customOrder?.rank).toBe(0);
    expect(second.find((c) => c.id === "a")?.customOrder?.rank).toBe(1);
  });
});

describe("clearCustomOrder", () => {
  it("strips customOrder from every card, regardless of which axis/group it was set under", () => {
    const cards = [
      { ...card("a", "mainDeck"), customOrder: { axis: "type" as const, groupKey: "Creature", rank: 0 } },
      { ...card("b", "mainDeck"), customOrder: { axis: "color" as const, groupKey: "Blue", rank: 3 } },
      card("c", "mainDeck"),
    ];
    const updated = clearCustomOrder(cards);
    expect(updated.every((c) => c.customOrder === undefined)).toBe(true);
  });
});

describe("removeCard", () => {
  it("removes the matching card", () => {
    const cards = [card("a", "mainDeck"), card("b", "mainDeck")];
    const updated = removeCard(cards, "a");
    expect(updated.find((c) => c.id === "a")).toBeUndefined();
  });

  it("leaves other cards untouched", () => {
    const cards = [card("a", "mainDeck"), card("b", "maybeboard")];
    const updated = removeCard(cards, "a");
    expect(updated).toEqual([card("b", "maybeboard")]);
  });

  it("is a no-op for an unknown id", () => {
    const cards = [card("a", "mainDeck")];
    const updated = removeCard(cards, "missing");
    expect(updated).toEqual(cards);
  });
});
