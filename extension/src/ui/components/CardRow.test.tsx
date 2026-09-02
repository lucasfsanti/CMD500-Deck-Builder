import { afterEach, describe, expect, it, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { CardRow } from "./CardRow";
import type { DeckCard } from "../../lib/deck/types";

// Delegates to the real useSortable for every existing test (mockTransform/
// mockIsDragging stay null), only overriding the specific field a test
// explicitly sets — lets the transform-styling and dragging-visibility
// tests below live alongside the rest without a fully separate mocked file.
// isDragging in particular can't be reached any other way here: it only
// goes true mid a real pointer-driven drag session, which jsdom can't
// simulate.
const { mockTransform, mockIsDragging } = vi.hoisted(() => ({
  mockTransform: { current: null as { x: number; y: number; scaleX: number; scaleY: number } | null },
  mockIsDragging: { current: null as boolean | null },
}));
vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/sortable")>();
  return {
    ...actual,
    useSortable: (...args: Parameters<typeof actual.useSortable>) => {
      const real = actual.useSortable(...args);
      const withTransform = mockTransform.current
        ? { ...real, transform: mockTransform.current, transition: "transform 200ms ease" }
        : real;
      if (mockIsDragging.current === null) return withTransform;
      return { ...withTransform, isDragging: mockIsDragging.current };
    },
  };
});

const baseCard: DeckCard = {
  id: "a",
  name: "Test Card",
  quantity: 1,
  zone: "mainDeck",
  pageLowestPrice: 10,
  pageImageUrl: "https://repositorio.sbrauble.com/example.jpg",
  pageManaCostSymbols: undefined,
  pageNamePt: undefined,
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

  it("shows the quantity stepper and no price for a basic land", () => {
    const { container, queryByText } = renderCard({ card: { ...baseCard, name: "Island" } });
    expect(container.querySelector(".c500-qty-stepper")).not.toBeNull();
    expect(queryByText("R$10,00")).toBeNull();
  });

  it("shows the price and no quantity stepper for a non-basic card", () => {
    const { container, getByText } = renderCard({});
    expect(container.querySelector(".c500-qty-stepper")).toBeNull();
    expect(getByText("R$10,00")).toBeTruthy();
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

describe("CardRow price edit (deck-organizer manual-price-edit)", () => {
  it("commits a new price on click + Enter", () => {
    let changed: [string, number | undefined] | undefined;
    const { getByText, getByLabelText } = renderCard({
      onPriceChange: (id, price) => (changed = [id, price]),
    });

    fireEvent.click(getByText("R$10,00"));
    const input = getByLabelText("editar preço de Test Card");
    fireEvent.change(input, { target: { value: "25" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(changed).toEqual(["a", 25]);
  });

  it("does not trigger a drag when clicking into the price editor", () => {
    const ancestorPointerDown = vi.fn();
    const { getByText } = render(
      <div onPointerDown={ancestorPointerDown}>
        <DndContext>
          <CardRow card={baseCard} onPriceChange={() => {}} />
        </DndContext>
      </div>,
    );

    fireEvent.pointerDown(getByText("R$10,00"));
    expect(ancestorPointerDown).not.toHaveBeenCalled();
  });

  it("stays read-only when onPriceChange is not provided", () => {
    const { getByText, queryByLabelText } = renderCard({});
    fireEvent.click(getByText("R$10,00"));
    expect(queryByLabelText("editar preço de Test Card")).toBeNull();
  });
});

describe("CardRow color-identity rail (task 3.2)", () => {
  it("colors the rail for a mono-color card's identity", () => {
    const { container } = renderCard({
      card: {
        ...baseCard,
        enrichmentStatus: "ok",
        enrichment: {
          name: baseCard.name,
          typeLine: "Instant",
          colorIdentity: ["U"],
          cmc: 1,
          layout: "normal",
          legalInCommander: true,
          scryfallId: "a",
          imageUrl: undefined,
          faceManaCosts: undefined,
        },
      },
    });
    const row = container.querySelector(".c500-card") as HTMLElement;
    expect(row.style.borderLeftColor).toBe("var(--c500-mana-u)");
  });

  it("uses the neutral pending color while enrichment hasn't resolved", () => {
    const { container } = renderCard({});
    const row = container.querySelector(".c500-card") as HTMLElement;
    expect(row.style.borderLeftColor).toBe("var(--c500-line)");
  });
});

describe("CardRow mana cost icons", () => {
  it("shows mana-cost icons between the name and price for a card with a captured cost", () => {
    const { container } = renderCard({ card: { ...baseCard, pageManaCostSymbols: ["2", "G", "U", "R"] } });
    const row = container.querySelector(".c500-card")!;
    const children = [...row.children];
    const nameIndex = children.findIndex((el) => el.classList.contains("c500-card__name"));
    const manaCostIndex = children.findIndex((el) => el.classList.contains("c500-mana-cost"));
    const priceIndex = children.findIndex((el) => el.classList.contains("c500-card__price"));
    expect(manaCostIndex).toBeGreaterThan(nameIndex);
    expect(manaCostIndex).toBeLessThan(priceIndex);
    expect(container.querySelectorAll(".c500-mana-cost__icon")).toHaveLength(4);
  });

  it("shows no mana-cost icons for a card with no captured cost", () => {
    const { container } = renderCard({ card: { ...baseCard, pageManaCostSymbols: undefined } });
    expect(container.querySelector(".c500-mana-cost")).toBeNull();
  });

  const enrichmentWith = (faceManaCosts: string[][] | undefined) => ({
    name: baseCard.name,
    typeLine: "Creature",
    colorIdentity: [],
    cmc: 3,
    layout: "normal" as const,
    legalInCommander: true,
    scryfallId: "a",
    imageUrl: undefined,
    faceManaCosts,
  });

  it("shows each face's icons separated by // when enrichment resolves faceManaCosts (e.g. a split card)", () => {
    const { container } = renderCard({
      card: {
        ...baseCard,
        pageManaCostSymbols: ["1", "R", "1", "U"],
        enrichmentStatus: "ok",
        enrichment: enrichmentWith([
          ["1", "R"],
          ["1", "U"],
        ]),
      },
    });
    expect(container.querySelectorAll(".c500-mana-cost__divider")).toHaveLength(1);
    expect(container.querySelectorAll(".c500-mana-cost__icon")).toHaveLength(4);
  });

  it("falls back to the page-captured cost once enrichment resolves with no faceManaCosts (a normal single-cost card)", () => {
    const { container } = renderCard({
      card: {
        ...baseCard,
        pageManaCostSymbols: ["2", "G", "U", "R"],
        enrichmentStatus: "ok",
        enrichment: enrichmentWith(undefined),
      },
    });
    expect(container.querySelectorAll(".c500-mana-cost__divider")).toHaveLength(0);
    expect(container.querySelectorAll(".c500-mana-cost__icon")).toHaveLength(4);
  });

  it("shows the page-captured cost, not suppressed, while enrichment is still pending", () => {
    const { container } = renderCard({
      card: { ...baseCard, pageManaCostSymbols: ["5", "W", "W"] },
    });
    expect(container.querySelectorAll(".c500-mana-cost__icon")).toHaveLength(3);
  });
});

describe("CardRow name-language toggle (card-name-language spec)", () => {
  const ptCard: DeckCard = { ...baseCard, name: "Sol Ring", pageNamePt: "Anel Solar" };

  it("shows the English name by default", () => {
    const { getByText } = renderCard({ card: ptCard });
    expect(getByText("Sol Ring")).not.toBeNull();
  });

  it("shows the Portuguese name, aria-labels, and hover preview when nameLanguage is pt", () => {
    const { getByText, getByLabelText, container } = renderCard({
      card: ptCard,
      nameLanguage: "pt",
      onRemove: () => {},
    });
    expect(getByText("Anel Solar")).not.toBeNull();
    expect(getByLabelText("remover Anel Solar do deck")).not.toBeNull();

    fireEvent.pointerEnter(container.querySelector(".c500-card")!, { clientX: 10, clientY: 20 });
    const preview = container.querySelector(".c500-hover-preview");
    expect(preview!.querySelector("img")).toHaveProperty("alt", "Anel Solar");
  });

  it("falls back to the English name in Portuguese mode when pageNamePt is undefined", () => {
    const { getByText } = renderCard({ card: baseCard, nameLanguage: "pt" });
    expect(getByText("Test Card")).not.toBeNull();
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

describe("CardRow reorder-preview transform (zone-header-and-reorder-preview)", () => {
  afterEach(() => {
    mockTransform.current = null;
    mockIsDragging.current = null;
  });

  it("keeps the dragging class applied while isDragging is true (now fully hidden via CSS, not just faded)", () => {
    mockIsDragging.current = true;
    const { container } = renderCard({});
    expect(container.querySelector(".c500-card--dragging")).not.toBeNull();
  });

  it("does not apply the dragging class while isDragging is false", () => {
    mockIsDragging.current = false;
    const { container } = renderCard({});
    expect(container.querySelector(".c500-card--dragging")).toBeNull();
  });

  it("applies the transform/transition useSortable reports to the row's own style", () => {
    mockTransform.current = { x: 12, y: -8, scaleX: 1, scaleY: 1 };
    const { container } = renderCard({});
    const row = container.querySelector(".c500-card") as HTMLElement;
    expect(row.style.transform).toBe("translate3d(12px, -8px, 0) scaleX(1) scaleY(1)");
    expect(row.style.transition).toBe("transform 200ms ease");
  });

  it("renders no transform when useSortable reports none (unchanged default behavior)", () => {
    const { container } = renderCard({});
    const row = container.querySelector(".c500-card") as HTMLElement;
    expect(row.style.transform).toBe("");
  });
});
