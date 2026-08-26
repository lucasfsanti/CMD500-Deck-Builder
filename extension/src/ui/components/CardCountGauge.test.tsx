import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardCountGauge } from "./CardCountGauge";
import { calculateCardCount } from "../../lib/organizer/calculate-card-count";
import type { DeckCard } from "../../lib/deck/types";

function card(quantity: number): DeckCard {
  return {
    id: "a",
    name: "A",
    quantity,
    zone: "mainDeck",
    pageLowestPrice: 1,
    pageImageUrl: undefined,
    pageManaCostSymbols: undefined,
    enrichment: undefined,
    enrichmentStatus: "pending",
  };
}

describe("CardCountGauge", () => {
  it("renders the within-limit visual state, with no over-cap note, at or under 99", () => {
    const { container } = render(<CardCountGauge cardCount={calculateCardCount([card(90)])} />);
    expect(screen.getByText("90")).toBeTruthy();
    expect(container.querySelector(".c500-gauge--over")).toBeNull();
    expect(screen.queryByText(/over$/)).toBeNull();
  });

  it("renders the over-limit visual state with the exact overage when over 99", () => {
    const { container } = render(<CardCountGauge cardCount={calculateCardCount([card(105)])} />);
    expect(screen.getByText("105")).toBeTruthy();
    expect(container.querySelector(".c500-gauge--over")).not.toBeNull();
    expect(screen.getByText("6 acima")).toBeTruthy();
  });
});
