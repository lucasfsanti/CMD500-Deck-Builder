import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { ZoneSection } from "./ZoneSection";
import type { DeckCard } from "../../lib/deck/types";

function card(): DeckCard {
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
  };
}

function renderZone(viewMode?: "list" | "visual", onQuantityChange = vi.fn()) {
  return {
    onQuantityChange,
    ...render(
      <DndContext>
        <ZoneSection
          zone="mainDeck"
          cards={[card()]}
          viewMode={viewMode}
          onQuantityChange={onQuantityChange}
        />
      </DndContext>,
    ),
  };
}

function basicLandCard(): DeckCard {
  return { ...card(), name: "Island", enrichment: { ...card().enrichment!, name: "Island" } };
}

function coloredCard(id: string, colorIdentity: string[]): DeckCard {
  return {
    ...card(),
    id,
    name: id,
    enrichment: { ...card().enrichment!, name: id, colorIdentity },
  };
}

describe("ZoneSection view-mode switching (task 4.4)", () => {
  it("defaults to List view, rendering CardRow (a name/price row, no artwork)", () => {
    const { container } = renderZone();
    expect(container.querySelector(".c500-card")).not.toBeNull();
    expect(container.querySelector(".c500-tile")).toBeNull();
  });

  it("renders CardVisualTile artwork tiles when switched to Visual", () => {
    const { container } = renderZone("visual");
    expect(container.querySelector(".c500-tile")).not.toBeNull();
    expect(container.querySelector(".c500-card")).toBeNull();
    expect(screen.getByAltText("Sol Ring")).toBeTruthy();
  });

  it("passes onQuantityChange through correctly in Visual mode", () => {
    const onQuantityChange = vi.fn();
    render(
      <DndContext>
        <ZoneSection
          zone="mainDeck"
          cards={[basicLandCard()]}
          viewMode="visual"
          onQuantityChange={onQuantityChange}
        />
      </DndContext>,
    );
    const input = screen.getByLabelText("quantidade de Island");
    fireEvent.change(input, { target: { value: "3" } });
    expect(onQuantityChange).toHaveBeenCalledWith("a", 3);
  });

  it("still marks the drop target for drag-and-drop in Visual mode", () => {
    const { container } = renderZone("visual");
    expect(container.querySelector(".c500-zone__dropzone")).not.toBeNull();
  });

  it("passes onRemoveCard through to the rendered card", () => {
    const onRemoveCard = vi.fn();
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} onRemoveCard={onRemoveCard} />
      </DndContext>,
    );
    fireEvent.click(screen.getByLabelText("remover Sol Ring do deck"));
    expect(onRemoveCard).toHaveBeenCalledWith("a");
  });
});

describe("ZoneSection grouping-axis switching (task 4.2)", () => {
  const cards = [coloredCard("Red Card", ["R"]), coloredCard("Blue Card", ["U"])];

  it("groups by Type by default", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} />
      </DndContext>,
    );
    expect(screen.getByText("Artefato")).toBeTruthy();
  });

  it("re-renders grouped by Color when the axis switches", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} groupingAxis="color" />
      </DndContext>,
    );
    expect(screen.getByText("Vermelho")).toBeTruthy();
    expect(screen.getByText("Azul")).toBeTruthy();
    expect(screen.queryByText("Artefato")).toBeNull();
  });

  it("re-renders grouped by Mana Cost when the axis switches", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} groupingAxis="cmc" />
      </DndContext>,
    );
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.queryByText("Artefato")).toBeNull();
  });
});
