import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import type { SortableContextProps } from "@dnd-kit/sortable";
import { ZoneSection } from "./ZoneSection";
import type { DeckCard } from "../../lib/deck/types";

const { sortableContextSpy } = vi.hoisted(() => ({ sortableContextSpy: vi.fn() }));
vi.mock("@dnd-kit/sortable", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/sortable")>();
  return {
    ...actual,
    SortableContext: (props: SortableContextProps) => {
      sortableContextSpy(props.items);
      return <actual.SortableContext {...props} />;
    },
  };
});

function card(): DeckCard {
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

  it("passes onPriceChange through to the rendered card", () => {
    const onPriceChange = vi.fn();
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} onPriceChange={onPriceChange} />
      </DndContext>,
    );
    fireEvent.click(screen.getByText("R$4,00"));
    const input = screen.getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onPriceChange).toHaveBeenCalledWith("a", 9);
  });

  it("gives each group its own SortableContext, scoped to that group's own card ids (custom-group-order)", () => {
    sortableContextSpy.mockClear();
    const cards = [
      coloredCard("Red Card", ["R"]),
      coloredCard("Blue Card", ["U"]),
      { ...coloredCard("Second Blue Card", ["U"]), id: "Second Blue Card" },
    ];
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} groupingAxis="color" />
      </DndContext>,
    );

    const callsItems = sortableContextSpy.mock.calls.map((call) => call[0]);
    expect(callsItems).toContainEqual(["Red Card"]);
    expect(callsItems).toContainEqual(["Blue Card", "Second Blue Card"]);
    // No call mixes ids across the Red and Blue groups.
    for (const items of callsItems) {
      const hasRed = items.includes("Red Card");
      const hasBlue = items.includes("Blue Card") || items.includes("Second Blue Card");
      expect(hasRed && hasBlue).toBe(false);
    }
  });

  it("gives each group its own SortableContext in Visual mode too (custom-group-order, card-visual-view parity)", () => {
    sortableContextSpy.mockClear();
    const cards = [
      coloredCard("Red Card", ["R"]),
      coloredCard("Blue Card", ["U"]),
      { ...coloredCard("Second Blue Card", ["U"]), id: "Second Blue Card" },
    ];
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} groupingAxis="color" viewMode="visual" />
      </DndContext>,
    );

    const callsItems = sortableContextSpy.mock.calls.map((call) => call[0]);
    expect(callsItems).toContainEqual(["Red Card"]);
    expect(callsItems).toContainEqual(["Blue Card", "Second Blue Card"]);
  });

  it("passes onPriceChange through to the rendered tile in Visual mode", () => {
    const onPriceChange = vi.fn();
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} viewMode="visual" onPriceChange={onPriceChange} />
      </DndContext>,
    );
    fireEvent.click(screen.getByText("R$4,00"));
    const input = screen.getByLabelText("editar preço de Sol Ring");
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onPriceChange).toHaveBeenCalledWith("a", 9);
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

describe("ZoneSection per-zone name filter", () => {
  const cards = [coloredCard("Red Card", ["R"]), coloredCard("Blue Card", ["U"])];

  it("renders no filter input when filterable is not set", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} />
      </DndContext>,
    );
    expect(screen.queryByLabelText("filtrar Main Deck por nome")).toBeNull();
  });

  it("renders a filter input when filterable is set", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} filterable />
      </DndContext>,
    );
    expect(screen.getByLabelText("filtrar Main Deck por nome")).toBeTruthy();
  });

  it("narrows visible cards to substring matches, case-insensitively, and updates the header count", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} filterable />
      </DndContext>,
    );
    expect(screen.getByText("Red Card")).toBeTruthy();
    expect(screen.getByText("Blue Card")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("filtrar Main Deck por nome"), {
      target: { value: "red" },
    });

    expect(screen.getByText("Red Card")).toBeTruthy();
    expect(screen.queryByText("Blue Card")).toBeNull();
    expect(container.querySelector(".c500-zone__count")?.textContent).toBe("(1)");
  });

  it("hides a group left with no matches after filtering", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} groupingAxis="color" filterable />
      </DndContext>,
    );
    expect(screen.getByText("Vermelho")).toBeTruthy();
    expect(screen.getByText("Azul")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("filtrar Main Deck por nome"), {
      target: { value: "red" },
    });

    expect(screen.getByText("Vermelho")).toBeTruthy();
    expect(screen.queryByText("Azul")).toBeNull();
  });

  it("restores every card when the filter is cleared", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={cards} filterable />
      </DndContext>,
    );
    const input = screen.getByLabelText("filtrar Main Deck por nome");

    fireEvent.change(input, { target: { value: "red" } });
    expect(screen.queryByText("Blue Card")).toBeNull();

    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByText("Red Card")).toBeTruthy();
    expect(screen.getByText("Blue Card")).toBeTruthy();
  });

  it("matches a card's Portuguese name even while English names are displayed (nameLanguage defaults to en)", () => {
    const ptCards = [
      { ...coloredCard("Sol Ring", ["R"]), pageNamePt: "Anel Solar" },
      { ...coloredCard("Rhystic Study", ["U"]), pageNamePt: "Estudo Rístico" },
    ];
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={ptCards} filterable />
      </DndContext>,
    );

    fireEvent.change(screen.getByLabelText("filtrar Main Deck por nome"), {
      target: { value: "anel" },
    });

    expect(screen.getByText("Sol Ring")).toBeTruthy();
    expect(screen.queryByText("Rhystic Study")).toBeNull();
  });

  it("matches a card's English name even while Portuguese names are displayed", () => {
    const ptCards = [
      { ...coloredCard("Sol Ring", ["R"]), pageNamePt: "Anel Solar" },
      { ...coloredCard("Rhystic Study", ["U"]), pageNamePt: "Estudo Rístico" },
    ];
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={ptCards} filterable nameLanguage="pt" />
      </DndContext>,
    );

    fireEvent.change(screen.getByLabelText("filtrar Main Deck por nome"), {
      target: { value: "sol ring" },
    });

    expect(screen.getByText("Anel Solar")).toBeTruthy();
    expect(screen.queryByText("Estudo Rístico")).toBeNull();
  });

  it("does not offer a filter in the hero (Comandante) zone", () => {
    render(
      <DndContext>
        <ZoneSection zone="comandante" cards={[card()]} hero filterable={false} />
      </DndContext>,
    );
    expect(screen.queryByLabelText("filtrar Comandante por nome")).toBeNull();
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

describe("ZoneSection collapse/expand toggle (zone-collapse-toggle)", () => {
  it("renders no toggle when onToggleCollapse is not provided", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} />
      </DndContext>,
    );
    expect(screen.queryByRole("button", { name: /recolher|expandir/i })).toBeNull();
  });

  it("shows an expanded toggle (aria-expanded=true) by default", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    const toggle = screen.getByRole("button", { name: "recolher Main Deck" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("shows a collapsed toggle (aria-expanded=false) when collapsed", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} collapsed onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    const toggle = screen.getByRole("button", { name: "expandir Main Deck" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("calls onToggleCollapse when the toggle is clicked", () => {
    const onToggleCollapse = vi.fn();
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} onToggleCollapse={onToggleCollapse} />
      </DndContext>,
    );
    fireEvent.click(screen.getByRole("button", { name: "recolher Main Deck" }));
    expect(onToggleCollapse).toHaveBeenCalled();
  });

  it("hides card rows and the filter input while collapsed", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} filterable collapsed onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    expect(screen.queryByText("Sol Ring")).toBeNull();
    expect(screen.queryByLabelText("filtrar Main Deck por nome")).toBeNull();
    // The count stays visible even while collapsed.
    expect(screen.getByText("(1)")).toBeTruthy();
  });

  it("shows card rows and the filter input while expanded", () => {
    render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} filterable collapsed={false} onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    expect(screen.getByText("Sol Ring")).toBeTruthy();
    expect(screen.getByLabelText("filtrar Main Deck por nome")).toBeTruthy();
  });

  it("keeps the droppable dropzone element mounted while collapsed", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} collapsed onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    const dropzone = container.querySelector(".c500-zone__dropzone");
    expect(dropzone).not.toBeNull();
    expect(dropzone?.classList.contains("c500-zone__dropzone--collapsed")).toBe(true);
  });

  it("re-expands and shows cards again when collapsed flips back to false (round-trip via re-render)", () => {
    const { rerender, container } = render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} collapsed onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    expect(screen.queryByText("Sol Ring")).toBeNull();
    expect(container.querySelector(".c500-zone__dropzone--collapsed")).not.toBeNull();

    rerender(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} collapsed={false} onToggleCollapse={vi.fn()} />
      </DndContext>,
    );

    expect(screen.getByText("Sol Ring")).toBeTruthy();
    expect(container.querySelector(".c500-zone__dropzone--collapsed")).toBeNull();
    expect(screen.getByRole("button", { name: "recolher Main Deck" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("collapses a hero zone that holds a card down to header-only, distinct from the empty-hero slim hint", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="comandanteParceiro" cards={[card()]} hero collapsed onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone--hero")).not.toBeNull();
    expect(container.querySelector(".c500-zone--hero-empty")).toBeNull();
    expect(container.querySelector(".c500-zone__dropzone--collapsed")).not.toBeNull();
    expect(screen.queryByText("Sol Ring")).toBeNull();
  });

  it("keeps the empty-hero slim-hint class on an empty hero zone regardless of collapsed state", () => {
    const { container, rerender } = render(
      <DndContext>
        <ZoneSection zone="comandanteParceiro" cards={[]} hero collapsed={false} onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone--hero-empty")).not.toBeNull();

    rerender(
      <DndContext>
        <ZoneSection zone="comandanteParceiro" cards={[]} hero collapsed onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    expect(container.querySelector(".c500-zone--hero-empty")).not.toBeNull();
  });
});

describe("ZoneSection header layout (zone-header-and-reorder-preview)", () => {
  it("wraps the title and count in their own element, distinct from the toggle and filter", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="mainDeck" cards={[card()]} filterable onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    const header = container.querySelector(".c500-zone__header")!;
    const title = header.querySelector(".c500-zone__title")!;
    expect(title).not.toBeNull();
    expect(title.textContent).toBe("Main Deck(1)");
    // Title, filter, and toggle are three separate, sibling header regions —
    // not the title's own descendants — so each can be assigned its own
    // grid column independently of the others' presence.
    expect(title.querySelector(".c500-zone__filter")).toBeNull();
    expect(title.querySelector(".c500-zone__toggle")).toBeNull();
    expect(header.querySelector(".c500-zone__filter")).not.toBeNull();
    expect(header.querySelector(".c500-zone__toggle")).not.toBeNull();
  });

  it("still places the toggle as its own header region when no filter is present (hero zone)", () => {
    const { container } = render(
      <DndContext>
        <ZoneSection zone="comandante" cards={[card()]} hero onToggleCollapse={vi.fn()} />
      </DndContext>,
    );
    const header = container.querySelector(".c500-zone__header")!;
    expect(header.querySelector(".c500-zone__title")).not.toBeNull();
    expect(header.querySelector(".c500-zone__toggle")).not.toBeNull();
    expect(header.querySelector(".c500-zone__filter")).toBeNull();
  });
});
