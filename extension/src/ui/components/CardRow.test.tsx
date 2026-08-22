import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { CardRow } from "./CardRow";
import type { DeckCard } from "../../lib/deck/types";

const baseCard: DeckCard = {
  id: "a",
  name: "Test Card",
  quantity: 1,
  zone: "mainDeck",
  pageLowestPrice: 10,
  enrichment: undefined,
  enrichmentStatus: "pending",
};

function renderCard(props: Partial<Parameters<typeof CardRow>[0]>) {
  return render(
    <DndContext>
      <CardRow card={baseCard} {...props} />
    </DndContext>,
  );
}

describe("CardRow illegal vs over-budget markers (task 6.4)", () => {
  it("shows neither marker when the card is legal and not over budget", () => {
    const { container } = renderCard({});
    expect(container.querySelector(".c500-card__badge--illegal")).toBeNull();
    expect(container.querySelector(".c500-card__price--over-budget")).toBeNull();
  });

  it("shows only the illegal badge when illegal but not over budget", () => {
    const { container } = renderCard({ illegal: true, overBudget: false });
    expect(container.querySelector(".c500-card__badge--illegal")).not.toBeNull();
    expect(container.querySelector(".c500-card__price--over-budget")).toBeNull();
  });

  it("shows only the over-budget price style when over budget but legal", () => {
    const { container } = renderCard({ illegal: false, overBudget: true });
    expect(container.querySelector(".c500-card__badge--illegal")).toBeNull();
    expect(container.querySelector(".c500-card__price--over-budget")).not.toBeNull();
  });

  it("shows both distinct markers at once when a card is both illegal and over-budget-relevant", () => {
    const { container } = renderCard({ illegal: true, overBudget: true });
    expect(container.querySelector(".c500-card__badge--illegal")).not.toBeNull();
    expect(container.querySelector(".c500-card__price--over-budget")).not.toBeNull();
  });
});
