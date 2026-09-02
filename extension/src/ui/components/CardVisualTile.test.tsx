import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { CardVisualTile } from "./CardVisualTile";
import type { DeckCard } from "../../lib/deck/types";

function card(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "a",
    name: "Sol Ring",
    quantity: 1,
    zone: "mainDeck",
    pageLowestPrice: 4,
    pageImageUrl: undefined,
    pageManaCostSymbols: undefined,
    pageNamePt: undefined,
    enrichment: {
      name: "Sol Ring",
      typeLine: "Artifact",
      colorIdentity: [],
      cmc: 1,
      layout: "normal",
      legalInCommander: true,
      scryfallId: "a",
      imageUrl: "https://cards.scryfall.io/normal/sol-ring.jpg",
      faceManaCosts: undefined,
    },
    enrichmentStatus: "ok",
    ...overrides,
  };
}

function renderTile(props: Partial<Parameters<typeof CardVisualTile>[0]> = {}) {
  return render(
    <DndContext>
      <CardVisualTile card={card()} {...props} />
    </DndContext>,
  );
}

describe("CardVisualTile (task 4.2)", () => {
  it("renders artwork and price, with the name available as the artwork's alt text", () => {
    renderTile();
    const img = screen.getByAltText("Sol Ring") as HTMLImageElement;
    expect(img.src).toBe("https://cards.scryfall.io/normal/sol-ring.jpg");
    expect(screen.getByText("R$4,00")).toBeTruthy();
  });

  it("shows no visible name caption at default (grid) size (task 8.2)", () => {
    const { container } = renderTile();
    expect(container.querySelector(".c500-tile__caption")).toBeNull();
  });

  it("shows the illegal marker on the artwork tile", () => {
    const { container } = renderTile({ illegal: true });
    expect(container.querySelector(".c500-card__badge--illegal")).not.toBeNull();
  });

  it("shows the over-budget marker on the price, distinct from the illegal marker", () => {
    const { container } = renderTile({ illegal: true, overBudget: true });
    expect(container.querySelector(".c500-card__badge--illegal")).not.toBeNull();
    expect(container.querySelector(".c500-card__price--over-budget")).not.toBeNull();
  });
});

describe("CardVisualTile name-language toggle (card-name-language spec)", () => {
  it("shows the English name by default", () => {
    renderTile({ card: card({ pageNamePt: "Anel Solar" }) });
    expect(screen.getByAltText("Sol Ring")).not.toBeNull();
  });

  it("shows the Portuguese name in artwork alt text, caption, and aria-labels when nameLanguage is pt", () => {
    renderTile({
      card: card({ pageNamePt: "Anel Solar" }),
      nameLanguage: "pt",
      size: "hero",
      onRemove: () => {},
    });
    expect(screen.getByAltText("Anel Solar")).not.toBeNull();
    expect(screen.getByLabelText("remover Anel Solar do deck")).not.toBeNull();
    expect(screen.getByText("Anel Solar")).not.toBeNull();
  });

  it("falls back to the English name in Portuguese mode when pageNamePt is undefined", () => {
    renderTile({ card: card({ pageNamePt: undefined }), nameLanguage: "pt" });
    expect(screen.getByAltText("Sol Ring")).not.toBeNull();
  });
});

describe("CardVisualTile quantity field scoped to basic lands", () => {
  it("shows no quantity field for a non-basic card", () => {
    renderTile();
    expect(screen.queryByLabelText("quantidade de Sol Ring")).toBeNull();
  });

  it("shows an editable quantity field for a basic land", () => {
    renderTile({ card: card({ name: "Island", quantity: 20 }) });
    expect(screen.getByLabelText("quantidade de Island")).toHaveProperty("value", "20");
  });

  it("calls onQuantityChange when a basic land's quantity input changes", () => {
    let changedTo: number | undefined;
    renderTile({
      card: card({ name: "Island" }),
      onQuantityChange: (_id, qty) => (changedTo = qty),
    });
    const input = screen.getByLabelText("quantidade de Island");
    fireEvent.change(input, { target: { value: "4" } });
    expect(changedTo).toBe(4);
  });

  it("shows the quantity stepper and no price for a basic land", () => {
    const { container } = renderTile({ card: card({ name: "Island" }) });
    expect(container.querySelector(".c500-qty-stepper")).not.toBeNull();
    expect(screen.queryByText("R$4,00")).toBeNull();
  });

  it("shows the price and no quantity stepper for a non-basic card", () => {
    const { container } = renderTile();
    expect(container.querySelector(".c500-qty-stepper")).toBeNull();
    expect(screen.getByText("R$4,00")).toBeTruthy();
  });
});

describe("CardVisualTile price edit (deck-organizer manual-price-edit)", () => {
  it("commits a new price on click + Enter", () => {
    let changed: [string, number | undefined] | undefined;
    renderTile({ onPriceChange: (id, price) => (changed = [id, price]) });

    fireEvent.click(screen.getByText("R$4,00"));
    const input = screen.getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "15" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(changed).toEqual(["a", 15]);
  });

  it("does not trigger a drag when clicking into the price editor", () => {
    const ancestorPointerDown = vi.fn();
    render(
      <div onPointerDown={ancestorPointerDown}>
        <DndContext>
          <CardVisualTile card={card()} onPriceChange={() => {}} />
        </DndContext>
      </div>,
    );

    fireEvent.pointerDown(screen.getByText("R$4,00"));
    expect(ancestorPointerDown).not.toHaveBeenCalled();
  });
});

describe("CardVisualTile removal control", () => {
  it("calls onRemove with the card's id when clicked", () => {
    let removedId: string | undefined;
    renderTile({ onRemove: (id) => (removedId = id) });
    fireEvent.click(screen.getByLabelText("remover Sol Ring do deck"));
    expect(removedId).toBe("a");
  });

  it("does not render a removal control when onRemove is not provided", () => {
    renderTile();
    expect(screen.queryByLabelText("remover Sol Ring do deck")).toBeNull();
  });

  it("stops the pointerdown from bubbling past it, so the tile's own drag-start listener never sees it", () => {
    // Same reasoning as CardRow's equivalent test: dnd-kit's drag-activation
    // listener is a React onPointerDown prop spread onto the tile, so an
    // ancestor's React onPointerDown stands in for it here.
    const ancestorPointerDown = vi.fn();
    render(
      <div onPointerDown={ancestorPointerDown}>
        <DndContext>
          <CardVisualTile card={card()} onRemove={() => {}} />
        </DndContext>
      </div>,
    );

    fireEvent.pointerDown(screen.getByLabelText("remover Sol Ring do deck"));
    expect(ancestorPointerDown).not.toHaveBeenCalled();
  });
});

describe("CardVisualTile color-identity rail (task 3.2)", () => {
  it("colors the art tile's rail for a multicolor card's identity", () => {
    const { container } = renderTile({ card: card({ enrichment: { ...card().enrichment!, colorIdentity: ["R", "G"] } }) });
    const art = container.querySelector(".c500-tile__art") as HTMLElement;
    expect(art.style.borderLeftColor).toBe("var(--c500-mana-gold)");
  });

  it("uses the neutral pending color while enrichment hasn't resolved", () => {
    const { container } = renderTile({ card: card({ enrichment: undefined, enrichmentStatus: "pending" }) });
    const art = container.querySelector(".c500-tile__art") as HTMLElement;
    expect(art.style.borderLeftColor).toBe("var(--c500-line)");
  });
});

describe("CardVisualTile hero size variant (task 5.1)", () => {
  it("applies the hero modifier class", () => {
    const { container } = renderTile({ size: "hero" });
    expect(container.querySelector(".c500-tile--hero")).not.toBeNull();
  });

  it("still shows the placeholder when artwork is unresolved, at hero size", () => {
    renderTile({ size: "hero", card: card({ enrichment: undefined, enrichmentStatus: "unavailable" }) });
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getAllByText("Sol Ring").length).toBeGreaterThan(0);
  });

  it("shows a visible name caption at hero size (task 8.2)", () => {
    const { container } = renderTile({ size: "hero" });
    expect(container.querySelector(".c500-tile__caption")?.textContent).toBe("Sol Ring");
  });
});

describe("CardVisualTile missing-artwork fallback (task 4.3)", () => {
  it("shows a placeholder tile with the card's name when enrichment is unavailable", () => {
    renderTile({
      card: card({ enrichment: undefined, enrichmentStatus: "unavailable" }),
    });
    expect(screen.queryByRole("img")).toBeNull();
    const placeholders = screen.getAllByText("Sol Ring");
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("shows a placeholder tile with the card's name when the card was not found", () => {
    renderTile({
      card: card({ enrichment: undefined, enrichmentStatus: "not-found" }),
    });
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getAllByText("Sol Ring").length).toBeGreaterThan(0);
  });

  it("shows a placeholder (not a broken image) while enrichment is still pending", () => {
    renderTile({
      card: card({ enrichment: undefined, enrichmentStatus: "pending" }),
    });
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("CardVisualTile artwork source preference (task 3.2)", () => {
  it("shows the page-captured image, not a placeholder, when Scryfall enrichment failed", () => {
    renderTile({
      card: card({
        pageImageUrl: "https://repositorio.sbrauble.com/example.jpg",
        enrichment: undefined,
        enrichmentStatus: "unavailable",
      }),
    });
    const img = screen.getByAltText("Sol Ring") as HTMLImageElement;
    expect(img.src).toBe("https://repositorio.sbrauble.com/example.jpg");
  });

  it("falls back to Scryfall's image when the page didn't have one", () => {
    renderTile({
      card: card({ pageImageUrl: undefined }),
    });
    const img = screen.getByAltText("Sol Ring") as HTMLImageElement;
    expect(img.src).toBe("https://cards.scryfall.io/normal/sol-ring.jpg");
  });

  it("shows a placeholder only when neither source resolves", () => {
    renderTile({
      card: card({ pageImageUrl: undefined, enrichment: undefined, enrichmentStatus: "unavailable" }),
    });
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getAllByText("Sol Ring").length).toBeGreaterThan(0);
  });
});
