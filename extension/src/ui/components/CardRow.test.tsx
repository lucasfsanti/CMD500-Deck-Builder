import { describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { CardRow } from "./CardRow";
import type { DeckCard } from "../../lib/deck/types";

const baseCard: DeckCard = {
  id: "a",
  name: "Test Card",
  quantity: 1,
  zone: "mainDeck",
  pageLowestPrice: 10,
  pageImageUrl: "https://repositorio.sbrauble.com/example.jpg",
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

describe("CardRow quantity field scoped to basic lands", () => {
  it("shows no quantity field for a non-basic card", () => {
    const { queryByLabelText } = renderCard({});
    expect(queryByLabelText("quantidade de Test Card")).toBeNull();
  });

  it("shows an editable quantity field for a basic land", () => {
    const { getByLabelText } = renderCard({ card: { ...baseCard, name: "Island", quantity: 20 } });
    expect(getByLabelText("quantidade de Island")).toHaveProperty("value", "20");
  });
});

describe("CardRow removal control", () => {
  it("calls onRemove with the card's id when clicked", () => {
    let removedId: string | undefined;
    const { getByLabelText } = renderCard({ onRemove: (id) => (removedId = id) });
    fireEvent.click(getByLabelText("remover Test Card do deck"));
    expect(removedId).toBe("a");
  });

  it("does not render a removal control when onRemove is not provided", () => {
    const { queryByLabelText } = renderCard({});
    expect(queryByLabelText("remover Test Card do deck")).toBeNull();
  });

  it("stops the pointerdown from bubbling past it, so the row's own drag-start listener never sees it", () => {
    // dnd-kit's drag-activation listener is itself just a React onPointerDown
    // prop spread onto the row (see CardRow's `{...listeners}`), so an
    // ancestor's React onPointerDown handler stands in for it here: React's
    // synthetic stopPropagation blocks every outer React handler the same
    // way, regardless of which element registered it.
    const ancestorPointerDown = vi.fn();
    const { getByLabelText } = render(
      <div onPointerDown={ancestorPointerDown}>
        <DndContext>
          <CardRow card={baseCard} onRemove={() => {}} />
        </DndContext>
      </div>,
    );

    fireEvent.pointerDown(getByLabelText("remover Test Card do deck"));
    expect(ancestorPointerDown).not.toHaveBeenCalled();
  });
});

describe("CardRow artwork hover preview (task 5.4)", () => {
  it("shows the artwork preview on hover", () => {
    const { container } = renderCard({});
    expect(container.querySelector(".c500-hover-preview")).toBeNull();

    fireEvent.pointerEnter(container.querySelector(".c500-card")!, { clientX: 10, clientY: 20 });

    const preview = container.querySelector(".c500-hover-preview");
    expect(preview).not.toBeNull();
    expect(preview!.querySelector("img")).toHaveProperty("src", baseCard.pageImageUrl);
  });

  it("hides the preview when the pointer leaves the row", () => {
    const { container } = renderCard({});
    const row = container.querySelector(".c500-card")!;

    fireEvent.pointerEnter(row, { clientX: 10, clientY: 20 });
    expect(container.querySelector(".c500-hover-preview")).not.toBeNull();

    fireEvent.pointerLeave(row);
    expect(container.querySelector(".c500-hover-preview")).toBeNull();
  });

  it("shows the same name-only placeholder Visual view uses when artwork can't be resolved", () => {
    const { container } = renderCard({
      card: { ...baseCard, pageImageUrl: undefined, enrichmentStatus: "unavailable" },
    });
    const row = container.querySelector(".c500-card")!;

    fireEvent.pointerEnter(row, { clientX: 10, clientY: 20 });

    const preview = container.querySelector(".c500-hover-preview");
    expect(preview!.querySelector("img")).toBeNull();
    expect(preview!.querySelector(".c500-tile__placeholder--unresolved")?.textContent).toBe(
      baseCard.name,
    );
  });
});
