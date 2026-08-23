import { describe, expect, it } from "vitest";
import { manaCurveBuckets, colorBuckets, typeBuckets } from "./bucket-counts";
import type { DeckCard } from "../deck/types";

function card(
  name: string,
  overrides: Partial<DeckCard> & { typeLine?: string; colorIdentity?: string[]; cmc?: number } = {},
): DeckCard {
  const { typeLine = "Creature", colorIdentity = [], cmc = 1, ...rest } = overrides;
  return {
    id: name,
    name,
    quantity: 1,
    zone: "mainDeck",
    pageLowestPrice: 1,
    pageImageUrl: undefined,
    enrichment: {
      name,
      typeLine,
      colorIdentity,
      cmc,
      layout: "normal",
      legalInCommander: true,
      scryfallId: name,
      imageUrl: undefined,
    },
    enrichmentStatus: "ok",
    ...rest,
  };
}

describe("manaCurveBuckets (task 5.1)", () => {
  it("counts quantity, not distinct cards, per mana cost (spec's explicit scenario)", () => {
    const cards = [
      card("Cheap A", { cmc: 2, quantity: 4 }),
      card("Cheap B", { cmc: 2, quantity: 1 }),
      card("Expensive", { cmc: 4, quantity: 1 }),
    ];
    const buckets = manaCurveBuckets(cards);
    expect(buckets).toEqual([
      { label: "2", count: 5 },
      { label: "4", count: 1 },
    ]);
  });

  it("sorts buckets by ascending mana cost", () => {
    const cards = [card("A", { cmc: 5 }), card("B", { cmc: 0 }), card("C", { cmc: 2 })];
    expect(manaCurveBuckets(cards).map((b) => b.label)).toEqual(["0", "2", "5"]);
  });

  it("excludes a card whose CMC hasn't resolved yet, rather than guessing 0", () => {
    const cards = [
      card("Resolved", { cmc: 3 }),
      card("Pending", { enrichment: undefined, enrichmentStatus: "pending" }),
    ];
    const buckets = manaCurveBuckets(cards);
    expect(buckets).toEqual([{ label: "3", count: 1 }]);
  });
});

describe("colorBuckets (task 5.1)", () => {
  it("groups by the same color-identity classification as the organizer", () => {
    const cards = [
      card("Colorless", { colorIdentity: [] }),
      card("Mono W", { colorIdentity: ["W"] }),
      card("Mono W 2", { colorIdentity: ["W"] }),
      card("Multi", { colorIdentity: ["W", "U"] }),
    ];
    expect(colorBuckets(cards)).toEqual([
      { label: "Incolor", count: 1 },
      { label: "Branco", count: 2 },
      { label: "Multicolor", count: 1 },
    ]);
  });
});

describe("typeBuckets (task 5.1)", () => {
  it("groups by the same primary-type classification as the organizer", () => {
    const cards = [
      card("A", { typeLine: "Creature" }),
      card("B", { typeLine: "Instant" }),
      card("C", { typeLine: "Creature" }),
    ];
    expect(typeBuckets(cards)).toEqual([
      { label: "Criatura", count: 2 },
      { label: "Mágica Instantânea", count: 1 },
    ]);
  });
});

describe("deck-analytics charts are scoped to Main Deck only (task 5.3)", () => {
  it("excludes Comandante, Comandante Parceiro, and Maybeboard cards from all three charts", () => {
    const cards = [
      card("Commander", { zone: "comandante", cmc: 9, typeLine: "Legendary Creature" }),
      card("Partner", { zone: "comandanteParceiro", cmc: 9 }),
      card("Maybe", { zone: "maybeboard", cmc: 9 }),
      card("MainDeckCard", { zone: "mainDeck", cmc: 2 }),
    ];

    expect(manaCurveBuckets(cards)).toEqual([{ label: "2", count: 1 }]);
    expect(colorBuckets(cards).every((b) => b.count === 1)).toBe(true);
    expect(typeBuckets(cards).reduce((sum, b) => sum + b.count, 0)).toBe(1);
  });
});
