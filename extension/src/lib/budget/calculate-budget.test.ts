import { describe, expect, it } from "vitest";
import { calculateBudget, BUDGET_CAP } from "./calculate-budget";
import type { DeckCard } from "../deck/types";

function card(
  name: string,
  zone: DeckCard["zone"],
  pageLowestPrice: number | undefined,
  quantity = 1,
): DeckCard {
  return {
    id: name,
    name,
    quantity,
    zone,
    pageLowestPrice,
    pageImageUrl: undefined,
    pageManaCostSymbols: undefined,
    pageNamePt: undefined,
    enrichment: undefined,
    enrichmentStatus: "pending",
  };
}

describe("calculateBudget (task 5.1)", () => {
  it("excludes the primary commander and basic lands from the total", () => {
    const cards = [
      card("Xyris, the Writhing Storm", "comandante", 999),
      card("Forest", "mainDeck", 0.1, 20),
      card("Sol Ring", "mainDeck", 4),
    ];
    const result = calculateBudget(cards);
    expect(result.total).toBeCloseTo(4);
  });

  it("counts a partner commander in Comandante Parceiro", () => {
    const cards = [
      card("Vial Smasher the Fierce", "comandanteParceiro", 500),
      card("Sol Ring", "mainDeck", 4),
    ];
    const result = calculateBudget(cards);
    expect(result.total).toBeCloseTo(504);
  });

  it("excludes maybeboard cards from the total", () => {
    const cards = [
      card("Chalice of the Void", "maybeboard", 92.25),
      card("Mystery Card", "maybeboard", 40),
      card("Sol Ring", "mainDeck", 4),
    ];
    const result = calculateBudget(cards);
    expect(result.total).toBeCloseTo(4);
  });
});

describe("calculateBudget lowest price across printings (task 5.2)", () => {
  it("uses the card's resolved lowest price, which already reflects the minimum across valid printings", () => {
    // deck-page-capture and card-data-service resolve pageLowestPrice as
    // LigaMagic's own aggregated lowest price across a card's valid
    // printings (confirmed against the live site), so the budget total
    // simply sums that resolved figure rather than re-deriving a minimum.
    const threePrintings = [2.34, 3.66, 5.7]; // LigaMagic already picked the min: 2.34
    const cards = [card("Sol Ring", "mainDeck", Math.min(...threePrintings))];
    const result = calculateBudget(cards);
    expect(result.total).toBeCloseTo(2.34);
  });
});

describe("calculateBudget live recomputation inputs (task 5.3 support)", () => {
  it("scales a card's contribution by quantity, so a quantity change changes the total", () => {
    const cards = [card("Swiftfoot Boots", "mainDeck", 0.1, 1)];
    expect(calculateBudget(cards).total).toBeCloseTo(0.1);
    const updated = [card("Swiftfoot Boots", "mainDeck", 0.1, 4)];
    expect(calculateBudget(updated).total).toBeCloseTo(0.4);
  });
});

describe("calculateBudget over-cap detection (task 5.4)", () => {
  it("reports in-budget for a total under the cap", () => {
    const result = calculateBudget([card("A", "mainDeck", 480)]);
    expect(result.isOverCap).toBe(false);
    expect(result.overAmount).toBe(0);
  });

  it("reports over-cap with the exact over amount", () => {
    const result = calculateBudget([card("A", "mainDeck", 540)]);
    expect(result.isOverCap).toBe(true);
    expect(result.overAmount).toBeCloseTo(540 - BUDGET_CAP);
  });
});

describe("calculateBudget reflects manually edited prices (editable-card-price)", () => {
  it("recomputes the total using an edited Main Deck card's price", () => {
    const before = calculateBudget([card("Sol Ring", "mainDeck", 4)]);
    expect(before.total).toBeCloseTo(4);

    const after = calculateBudget([card("Sol Ring", "mainDeck", 25)]);
    expect(after.total).toBeCloseTo(25);
  });

  it("recomputes the total using an edited Comandante Parceiro card's price", () => {
    const after = calculateBudget([card("Vial Smasher the Fierce", "comandanteParceiro", 300)]);
    expect(after.total).toBeCloseTo(300);
  });

  it("leaves the total unchanged when the primary Comandante's price is edited", () => {
    const before = calculateBudget([
      card("Xyris, the Writhing Storm", "comandante", 999),
      card("Sol Ring", "mainDeck", 4),
    ]);
    const after = calculateBudget([
      card("Xyris, the Writhing Storm", "comandante", 1500),
      card("Sol Ring", "mainDeck", 4),
    ]);
    expect(before.total).toBeCloseTo(4);
    expect(after.total).toBeCloseTo(4);
  });
});

describe("calculateBudget unresolved prices (task 5.5)", () => {
  it("marks the total incomplete and lists the affected cards instead of treating them as R$0", () => {
    const cards = [card("Sol Ring", "mainDeck", 4), card("Mystery Card", "mainDeck", undefined)];
    const result = calculateBudget(cards);
    expect(result.isComplete).toBe(false);
    expect(result.cardsMissingPrice.map((c) => c.name)).toEqual(["Mystery Card"]);
    expect(result.total).toBeCloseTo(4); // does not add R$0 for the missing card
  });

  it("is complete when every budget-counted card has a resolved price", () => {
    const cards = [card("Sol Ring", "mainDeck", 4)];
    expect(calculateBudget(cards).isComplete).toBe(true);
  });
});
