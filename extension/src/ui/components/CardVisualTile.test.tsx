import { describe, expect, it } from "vitest";
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
    enrichment: {
      name: "Sol Ring",
      typeLine: "Artifact",
      colorIdentity: [],
      cmc: 1,
      layout: "normal",
      legalInCommander: true,
      scryfallId: "a",
      imageUrl: "https://cards.scryfall.io/normal/sol-ring.jpg",
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
  it("renders artwork, name, quantity, and price", () => {
    renderTile();
    const img = screen.getByAltText("Sol Ring") as HTMLImageElement;
    expect(img.src).toBe("https://cards.scryfall.io/normal/sol-ring.jpg");
    expect(screen.getAllByText("Sol Ring").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("quantidade de Sol Ring")).toHaveProperty("value", "1");
    expect(screen.getByText("R$4,00")).toBeTruthy();
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

  it("calls onQuantityChange when the quantity input changes", () => {
    let changedTo: number | undefined;
    renderTile({ onQuantityChange: (_id, qty) => (changedTo = qty) });
    const input = screen.getByLabelText("quantidade de Sol Ring");
    fireEvent.change(input, { target: { value: "4" } });
    expect(changedTo).toBe(4);
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
