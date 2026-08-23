import { describe, expect, it } from "vitest";
import { calculateCardCount, CARD_COUNT_CAP } from "./calculate-card-count";
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

describe("calculateCardCount", () => {
  it("reports under-cap for a total below 99", () => {
    const result = calculateCardCount([card("Sol Ring", "mainDeck", 90)]);
    expect(result.total).toBe(90);
    expect(result.isOverCap).toBe(false);
    expect(result.overAmount).toBe(0);
  });

  it("reports exactly at cap as not over", () => {
    const result = calculateCardCount([card("Sol Ring", "mainDeck", CARD_COUNT_CAP)]);
    expect(result.total).toBe(CARD_COUNT_CAP);
    expect(result.isOverCap).toBe(false);
    expect(result.overAmount).toBe(0);
  });

  it("reports over-cap with the exact overage", () => {
    const result = calculateCardCount([card("Sol Ring", "mainDeck", 105)]);
    expect(result.total).toBe(105);
    expect(result.isOverCap).toBe(true);
    expect(result.overAmount).toBe(6);
  });

  it("counts Main Deck and Comandante Parceiro together", () => {
    const cards = [
      card("Sol Ring", "mainDeck", 98),
      card("Vial Smasher the Fierce", "comandanteParceiro", 1),
    ];
    const result = calculateCardCount(cards);
    expect(result.total).toBe(99);
    expect(result.isOverCap).toBe(false);
  });

  it("excludes the primary Comandante and Maybeboard", () => {
    const cards = [
      card("Xyris, the Writhing Storm", "comandante", 1),
      card("Rhystic Study", "maybeboard", 5),
      card("Sol Ring", "mainDeck", 99),
    ];
    const result = calculateCardCount(cards);
    expect(result.total).toBe(99);
  });

  it("counts basic lands, unlike the budget total", () => {
    const result = calculateCardCount([card("Forest", "mainDeck", 100)]);
    expect(result.total).toBe(100);
    expect(result.isOverCap).toBe(true);
  });
});
