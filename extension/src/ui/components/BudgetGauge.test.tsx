import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetGauge } from "./BudgetGauge";
import { calculateBudget } from "../../lib/budget/calculate-budget";
import type { DeckCard } from "../../lib/deck/types";

function card(name: string, price: number): DeckCard {
  return {
    id: name,
    name,
    quantity: 1,
    zone: "mainDeck",
    pageLowestPrice: price,
    pageImageUrl: undefined,
    pageManaCostSymbols: undefined,
    enrichment: undefined,
    enrichmentStatus: "pending",
  };
}

describe("BudgetGauge (task 5.4)", () => {
  it("renders the in-budget visual state, showing both used and remaining, when under R$500", () => {
    const { container } = render(<BudgetGauge budget={calculateBudget([card("A", 480)])} />);
    expect(screen.getByText("R$480,00 usados")).toBeTruthy();
    expect(screen.getByText("R$20,00 restantes")).toBeTruthy();
    expect(container.querySelector(".c500-gauge--over")).toBeNull();
    expect(screen.queryByText(/over$/)).toBeNull();
  });

  it("renders the over-budget visual state with the exact over amount, remaining floored at R$0,00, when over R$500", () => {
    const { container } = render(<BudgetGauge budget={calculateBudget([card("A", 540)])} />);
    expect(screen.getByText("R$540,00 usados")).toBeTruthy();
    expect(screen.getByText("R$0,00 restantes")).toBeTruthy();
    expect(container.querySelector(".c500-gauge--over")).not.toBeNull();
    expect(screen.getByText("R$40,00 acima")).toBeTruthy();
  });

  it("shows the incomplete-total note when a card's price is unresolved", () => {
    const cards = [card("A", 10), { ...card("B", 0), pageLowestPrice: undefined }];
    render(<BudgetGauge budget={calculateBudget(cards)} />);
    expect(screen.getByText("1 carta sem preço")).toBeTruthy();
  });
});
