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

describe("ZoneSection hero mode (task 5.2)", () => {
  it("forces Visual-mode hero tiles regardless of the passed viewMode", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="comandante" cards={[card()]} viewMode="list" hero />
      </DndContext>,
    );
    expect(container.querySelector(".c500-tile--hero")).not.toBeNull();
    expect(container.querySelector(".c500-card")).toBeNull();
  });

  it("omits the group label in hero mode", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="comandante" cards={[card()]} hero />
      </DndContext>,
    );
    expect(container.querySelector(".c500-group__label")).toBeNull();
  });

  it("still marks the drop target in hero mode", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="comandante" cards={[]} hero />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone__dropzone")).not.toBeNull();
  });

  it("shrinks (task 8.6) when a hero zone holds no card", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="comandanteParceiro" cards={[]} hero />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone--hero-empty")).not.toBeNull();
  });

  it("does not shrink (task 8.6) once a hero zone holds a card", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="comandanteParceiro" cards={[card()]} hero />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone--hero-empty")).toBeNull();
  });
});

describe("ZoneSection multi-column list layout (task 8.7)", () => {
  it("adds the multi-column class in List view when multiColumn is set", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} viewMode="list" multiColumn />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone__dropzone--columns")).not.toBeNull();
  });

  it("does not add the multi-column class when multiColumn is not set", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="maybeboard" cards={[card()]} viewMode="list" />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone__dropzone--columns")).toBeNull();
  });

  it("does not add the multi-column class in Visual view even when multiColumn is set", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} viewMode="visual" multiColumn />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone__dropzone--columns")).toBeNull();
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

describe("ZoneSection group label shows a card count (task 12.5)", () => {
  it("shows the group's total card count next to its label", () => {
    const cards = [coloredCard("Red Card", ["R"]), coloredCard("Blue Card", ["U"])];
    const { container } = render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} />
      </DndContext>,
    );
    const label = container.querySelector(".c500-group__label");
    expect(label?.textContent).toBe("Artefato(2)");
    expect(label?.querySelector(".c500-group__count")?.textContent).toBe("(2)");
  });
});

describe("ZoneSection sort axis (task 12.3)", () => {
  it("orders cards within a group by the active sort axis", () => {
    const cards = [
      { ...card(), id: "a", name: "Zeta" },
      { ...card(), id: "b", name: "Alpha" },
    ];
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} sortAxis="name" />
      </DndContext>,
    );
    const names = screen.getAllByText(/Zeta|Alpha/).map((el) => el.textContent);
    expect(names).toEqual(["Alpha", "Zeta"]);
  });
});
