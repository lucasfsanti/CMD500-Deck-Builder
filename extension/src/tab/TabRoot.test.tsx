import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { DeckCard } from "../lib/deck/types";
import type { Theme } from "./use-theme-preference";
import type { NameLanguage } from "../lib/deck/display-name";

// Captures the real DndContext's onDragEnd handler so tests can simulate a
// drop directly (dnd-kit has no sensor-driven drag simulation helper, and
// this codebase's convention is to test the pure decision logic instead —
// but the collapsed-zone auto-expand behavior lives in TabRoot's own
// handleDragEnd, which isn't exported, so this is the most direct route).
let capturedOnDragEnd: ((event: DragEndEvent) => void) | undefined;
vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>();
  return {
    ...actual,
    DndContext: (props: Parameters<typeof actual.DndContext>[0]) => {
      capturedOnDragEnd = props.onDragEnd;
      return <actual.DndContext {...props} />;
    },
  };
});

const mockUseTabDeck = vi.fn();
vi.mock("./use-tab-deck", () => ({
  useTabDeck: () => mockUseTabDeck(),
}));

const mockUseSourceTabStatus = vi.fn();
vi.mock("./use-source-tab-status", () => ({
  useSourceTabStatus: () => mockUseSourceTabStatus(),
}));

const mockUseThemePreference = vi.fn<() => { theme: Theme; setTheme: (theme: Theme) => void }>(
  () => ({ theme: "dark", setTheme: vi.fn() }),
);
vi.mock("./use-theme-preference", () => ({
  useThemePreference: () => mockUseThemePreference(),
}));

const mockUseNameLanguagePreference = vi.fn<
  () => { language: NameLanguage; setLanguage: (language: NameLanguage) => void }
>(() => ({ language: "en", setLanguage: vi.fn() }));
vi.mock("./use-name-language-preference", () => ({
  useNameLanguagePreference: () => mockUseNameLanguagePreference(),
}));

function card(id: string, name: string, zone: DeckCard["zone"]): DeckCard {
  return {
    id,
    name,
    quantity: 1,
    zone,
    pageLowestPrice: 4,
    // LigaMagic's captured page always embeds artwork for a real card (see
    // card-art.ts) — this fixture matches that invariant so the Commander
    // hero block's forced Visual-mode tile renders an <img>, not a
    // placeholder that would duplicate the card's name alongside its caption.
    pageImageUrl: `https://example.com/${id}.jpg`,
    pageManaCostSymbols: undefined,
    pageNamePt: undefined,
    enrichment: {
      name,
      typeLine: "Artifact",
      colorIdentity: [],
      cmc: 1,
      layout: "normal",
      legalInCommander: true,
      scryfallId: id,
      imageUrl: undefined,
      faceManaCosts: undefined,
    },
    enrichmentStatus: "ok",
  };
}

describe("TabRoot (task 3.1)", () => {
  it("renders the full-width layout with all four zones, budget, legality, and export, against a captured-deck fixture", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [
        card("a", "Xyris, the Writhing Storm", "comandante"),
        card("b", "Sol Ring", "mainDeck"),
        card("c", "Chalice of the Void", "maybeboard"),
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    expect(screen.getByText("Montador de Decks Commander 500")).toBeTruthy();
    expect(screen.getByText("Xyris, the Writhing Storm")).toBeTruthy();
    expect(screen.getByText("Sol Ring")).toBeTruthy();
    expect(screen.getByText("Chalice of the Void")).toBeTruthy();
    // All four zone headers present, per deck-organizer's four-zone requirement, now at full width.
    for (const label of ["Comandante", "Companheiro", "Main Deck", "Maybeboard"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // No unsynced indicator while the source tab is open.
    expect(screen.queryByText(/Não sincronizado/)).toBeNull();
  });

  it("keeps budget, card count, and legality unaffected while a zone's filter narrows what's visible", async () => {
    const illegalCard: DeckCard = {
      ...card("b", "Sol Ring", "mainDeck"),
      enrichment: { ...card("b", "Sol Ring", "mainDeck").enrichment!, legalInCommander: false },
    };
    mockUseTabDeck.mockReturnValue({
      cards: [
        card("a", "Xyris, the Writhing Storm", "comandante"),
        card("z", "Llanowar Elves", "mainDeck"),
        illegalCard,
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    const { container } = render(<TabRoot />);

    const budgetBefore = container.querySelector(".c500-gauge__amount")?.textContent;
    const cardCountBefore = container.querySelectorAll(".c500-gauge__amount")[1]?.textContent;
    const legalityBefore = container.querySelector(".c500-legality")?.textContent;

    fireEvent.change(screen.getByLabelText("filtrar Main Deck por nome"), {
      target: { value: "Llanowar" },
    });

    expect(screen.getByText("Llanowar Elves")).toBeTruthy();
    expect(screen.queryByText("Sol Ring")).toBeNull();
    expect(container.querySelector(".c500-gauge__amount")?.textContent).toBe(budgetBefore);
    expect(container.querySelectorAll(".c500-gauge__amount")[1]?.textContent).toBe(cardCountBefore);
    expect(container.querySelector(".c500-legality")?.textContent).toBe(legalityBefore);
  });

  it("exposes the view-mode toggle as icon buttons with accessible names (task 7.2)", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [card("a", "Sol Ring", "mainDeck")],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    const listButton = screen.getByRole("button", { name: "Ver em lista" });
    const visualButton = screen.getByRole("button", { name: "Ver em modo visual" });
    expect(listButton.getAttribute("aria-pressed")).toBe("true");
    expect(visualButton.getAttribute("aria-pressed")).toBe("false");
    // No leftover "Lista"/"Visual" visible text now that these are icons.
    expect(screen.queryByText("Lista")).toBeNull();
    expect(screen.queryByText("Visual")).toBeNull();
  });

  it("lays out the hero column, Main Deck, and analytics as three siblings in the main row (task 8.5)", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [
        card("a", "Xyris, the Writhing Storm", "comandante"),
        card("b", "Sol Ring", "mainDeck"),
        card("c", "Chalice of the Void", "maybeboard"),
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    const { container } = render(<TabRoot />);

    const heroColumn = container.querySelector(".c500-tab__hero-column");
    expect(heroColumn?.textContent).toContain("Maybeboard");
    expect(heroColumn?.textContent).toContain("Comandante");
    // Main Deck and the analytics band are both siblings of the hero column
    // within the main row — Main Deck is never pushed below a charts row.
    const mainRow = container.querySelector(".c500-tab__main-row");
    const analytics = container.querySelector(".c500-tab__analytics");
    expect(heroColumn?.parentElement).toBe(mainRow);
    expect(analytics?.parentElement).toBe(mainRow);
    expect(mainRow?.textContent).toContain("Main Deck");
  });

  it("wires price edits on the Comandante's own card through to setPrice (editable-card-price)", async () => {
    const setPrice = vi.fn();
    mockUseTabDeck.mockReturnValue({
      cards: [
        card("a", "Xyris, the Writhing Storm", "comandante"),
        { ...card("b", "Sol Ring", "mainDeck"), pageLowestPrice: 7 },
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      setPrice,
      removeCard: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    fireEvent.click(screen.getByText("R$4,00"));
    const input = screen.getByLabelText("editar preço de Xyris, the Writhing Storm");
    fireEvent.change(input, { target: { value: "20" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(setPrice).toHaveBeenCalledWith("a", 20);
  });

  it("routes a basic land's decrement-to-zero through the existing removeCard path (revamp-quantity-price-fields)", async () => {
    const removeCard = vi.fn();
    mockUseTabDeck.mockReturnValue({
      cards: [
        card("a", "Xyris, the Writhing Storm", "comandante"),
        { ...card("b", "Island", "mainDeck"), quantity: 1 },
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      removeCard,
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    fireEvent.click(screen.getByLabelText("diminuir quantidade de Island"));

    expect(removeCard).toHaveBeenCalledWith("b");
  });

  it("shows no removal control for the Comandante's card, unlike other zones (task 8.8)", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [
        card("a", "Xyris, the Writhing Storm", "comandante"),
        card("b", "Vial Smasher the Fierce", "comandanteParceiro"),
        card("c", "Sol Ring", "mainDeck"),
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      removeCard: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    expect(screen.queryByLabelText("remover Xyris, the Writhing Storm do deck")).toBeNull();
    expect(screen.getByLabelText("remover Vial Smasher the Fierce do deck")).toBeTruthy();
    expect(screen.getByLabelText("remover Sol Ring do deck")).toBeTruthy();
  });

  it("re-orders Main Deck cards when the sort axis switches to Price (task 12.3)", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [
        { ...card("a", "Alpha", "mainDeck"), pageLowestPrice: 1 },
        { ...card("b", "Zeta", "mainDeck"), pageLowestPrice: 100 },
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      clearCustomOrder: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    // Default sort axis (Mana Value) ties on CMC, falling back to name: Alpha before Zeta.
    let names = screen.getAllByText(/^(Alpha|Zeta)$/).map((el) => el.textContent);
    expect(names).toEqual(["Alpha", "Zeta"]);

    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "price" } });

    // Price sort is descending (highest first): Zeta (R$100) before Alpha (R$1).
    names = screen.getAllByText(/^(Alpha|Zeta)$/).map((el) => el.textContent);
    expect(names).toEqual(["Zeta", "Alpha"]);
  });

  it("shows the unsynced indicator when the source tab has closed (task 3.2)", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [card("a", "Sol Ring", "mainDeck")],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("closed");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    // The deck's last-known state is still shown...
    expect(screen.getByText("Sol Ring")).toBeTruthy();
    // ...alongside a visible indication that it's no longer synced.
    expect(screen.getByText(/Não sincronizado/)).toBeTruthy();
  });

  it("shows a reading state before the first capture resolves", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [],
      pageStatus: "reading",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("unknown");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    expect(screen.getByText("Lendo este deck…")).toBeTruthy();
  });

  it("renders the vector logo mark in the header, with the title kept as an accessible-only heading (branding)", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [card("a", "Sol Ring", "mainDeck")],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    const { container } = render(<TabRoot />);

    const logo = container.querySelector("header svg.c500-tab__mark");
    expect(logo).toBeTruthy();
    expect(logo?.getAttribute("aria-hidden")).toBe("true");
    // Nothing visible reads the title anymore, but it's still the page's
    // accessible name via a visually-hidden heading.
    expect(screen.getByRole("heading", { name: "Montador de Decks Commander 500" })).toBeTruthy();
  });

  it("shows a footer with the GitHub credit link and the extension's version, in every pageStatus state (branding)", async () => {
    vi.stubGlobal("chrome", {
      runtime: { getManifest: () => ({ version: "0.1.0" }) },
    });

    mockUseTabDeck.mockReturnValue({
      cards: [card("a", "Sol Ring", "mainDeck")],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    const link = screen.getByRole("link", { name: "Feito por Lucas Santiago" });
    expect(link.getAttribute("href")).toBe("https://github.com/lucasfsanti");
    expect(screen.getByText("v0.1.0")).toBeTruthy();

    vi.unstubAllGlobals();
  });

  it("omits the version segment without throwing when chrome.runtime is unavailable (branding)", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [],
      pageStatus: "reading",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("unknown");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    expect(screen.getByRole("link", { name: "Feito por Lucas Santiago" })).toBeTruthy();
    expect(screen.queryByText(/^v\d/)).toBeNull();
  });

  it("shows a theme toggle offering to switch to light while dark, and calls setTheme on click (panel-theming)", async () => {
    const setTheme = vi.fn();
    mockUseThemePreference.mockReturnValue({ theme: "dark", setTheme });
    mockUseTabDeck.mockReturnValue({
      cards: [card("a", "Sol Ring", "mainDeck")],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    const toggle = screen.getByRole("button", { name: "Mudar para tema claro" });
    fireEvent.click(toggle);

    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("shows a theme toggle offering to switch to dark while light, and calls setTheme on click (panel-theming)", async () => {
    const setTheme = vi.fn();
    mockUseThemePreference.mockReturnValue({ theme: "light", setTheme });
    mockUseTabDeck.mockReturnValue({
      cards: [card("a", "Sol Ring", "mainDeck")],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    const toggle = screen.getByRole("button", { name: "Mudar para tema escuro" });
    fireEvent.click(toggle);

    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});

describe("TabRoot name-language toggle (card-name-language spec)", () => {
  it("shows a toggle offering to switch to Portuguese by default, and calls setLanguage on click", async () => {
    const setLanguage = vi.fn();
    mockUseNameLanguagePreference.mockReturnValue({ language: "en", setLanguage });
    mockUseTabDeck.mockReturnValue({
      cards: [card("a", "Sol Ring", "mainDeck")],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    const toggle = screen.getByRole("button", { name: "Mudar nomes das cartas para português" });
    expect(toggle.textContent).toBe("PT");
    fireEvent.click(toggle);

    expect(setLanguage).toHaveBeenCalledWith("pt");
  });

  it("shows a toggle offering to switch to English while Portuguese is active, and displays Portuguese names", async () => {
    const setLanguage = vi.fn();
    mockUseNameLanguagePreference.mockReturnValue({ language: "pt", setLanguage });
    mockUseTabDeck.mockReturnValue({
      cards: [{ ...card("a", "Sol Ring", "mainDeck"), pageNamePt: "Anel Solar" }],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    expect(screen.getByText("Anel Solar")).toBeTruthy();
    expect(screen.queryByText("Sol Ring")).toBeNull();

    const toggle = screen.getByRole("button", { name: "Mudar nomes das cartas para inglês" });
    expect(toggle.textContent).toBe("EN");
    fireEvent.click(toggle);

    expect(setLanguage).toHaveBeenCalledWith("en");
  });
});

describe("TabRoot Name-axis sort snapshot and resync hint (deck-organizer spec)", () => {
  function setup(cards: DeckCard[]) {
    let language: NameLanguage = "en";
    const setLanguage = vi.fn((next: NameLanguage) => {
      language = next;
    });
    mockUseNameLanguagePreference.mockImplementation(() => ({ language, setLanguage }));
    mockUseTabDeck.mockReturnValue({
      cards,
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      clearCustomOrder: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");
  }

  function mainDeckNames(container: HTMLElement): (string | null)[] {
    return [...container.querySelectorAll(".c500-card__name")].map((el) => el.textContent);
  }

  it("sorts by the language active at selection time, ignores a later toggle until resync, then resyncs on click", async () => {
    setup([
      { ...card("a", "Zebra", "mainDeck"), pageNamePt: "Anel Solar" },
      { ...card("b", "Aardvark", "mainDeck"), pageNamePt: "Zoológico" },
    ]);

    const { TabRoot } = await import("./TabRoot");
    const { container, rerender } = render(<TabRoot />);

    // Select the Name sort axis while English is active.
    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "name" } });
    expect(mainDeckNames(container)).toEqual(["Aardvark", "Zebra"]);
    expect(screen.queryByRole("button", { name: "Redefinir ordenação para o eixo ativo" })).toBeNull();

    // Toggle to Portuguese: names redisplay in Portuguese, but the ORDER
    // stays the English-selected one (Aardvark's pt name first, even though
    // it isn't alphabetically first in Portuguese) — proving no auto re-sort.
    fireEvent.click(screen.getByRole("button", { name: "Mudar nomes das cartas para português" }));
    rerender(<TabRoot />);
    expect(mainDeckNames(container)).toEqual(["Zoológico", "Anel Solar"]);
    expect(screen.getByRole("button", { name: "Redefinir ordenação para o eixo ativo" })).toBeTruthy();

    // Clicking the resync hint re-sorts using the now-active Portuguese names.
    fireEvent.click(screen.getByRole("button", { name: "Redefinir ordenação para o eixo ativo" }));
    expect(mainDeckNames(container)).toEqual(["Anel Solar", "Zoológico"]);
    expect(screen.queryByRole("button", { name: "Redefinir ordenação para o eixo ativo" })).toBeNull();
  });

  it("re-snapshots to the current language when Name is re-selected, even though it was already selected", async () => {
    setup([
      { ...card("a", "Zebra", "mainDeck"), pageNamePt: "Anel Solar" },
      { ...card("b", "Aardvark", "mainDeck"), pageNamePt: "Zoológico" },
    ]);

    const { TabRoot } = await import("./TabRoot");
    const { container, rerender } = render(<TabRoot />);
    const sortSelect = screen.getByLabelText("Ordenar por");

    fireEvent.change(sortSelect, { target: { value: "name" } });
    fireEvent.click(screen.getByRole("button", { name: "Mudar nomes das cartas para português" }));
    rerender(<TabRoot />);
    expect(screen.getByRole("button", { name: "Redefinir ordenação para o eixo ativo" })).toBeTruthy();

    // Re-selecting "name" while it's already the active axis is itself a
    // sort-axis interaction, so it re-snapshots without needing the hint.
    fireEvent.change(sortSelect, { target: { value: "name" } });
    expect(mainDeckNames(container)).toEqual(["Anel Solar", "Zoológico"]);
    expect(screen.queryByRole("button", { name: "Redefinir ordenação para o eixo ativo" })).toBeNull();
  });

  it("shows no resync hint when sorted by a non-name axis, even after toggling language", async () => {
    setup([{ ...card("a", "Zebra", "mainDeck"), pageNamePt: "Anel Solar" }]);

    const { TabRoot } = await import("./TabRoot");
    const { rerender } = render(<TabRoot />);

    fireEvent.click(screen.getByRole("button", { name: "Mudar nomes das cartas para português" }));
    rerender(<TabRoot />);

    expect(screen.queryByRole("button", { name: "Redefinir ordenação para o eixo ativo" })).toBeNull();
  });
});

describe("TabRoot custom-group-order resync (custom-group-order spec)", () => {
  it("shows the generalized resync button whenever any card has a custom order, even on a non-Name axis", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [
        { ...card("a", "Sol Ring", "mainDeck"), customOrder: { axis: "type", groupKey: "Artifact", rank: 0 } },
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      clearCustomOrder: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    expect(screen.getByRole("button", { name: "Redefinir ordenação para o eixo ativo" })).toBeTruthy();
  });

  it("calls clearCustomOrder when the resync button is clicked", async () => {
    const clearCustomOrder = vi.fn();
    mockUseTabDeck.mockReturnValue({
      cards: [
        { ...card("a", "Sol Ring", "mainDeck"), customOrder: { axis: "type", groupKey: "Artifact", rank: 0 } },
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      clearCustomOrder,
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    fireEvent.click(screen.getByRole("button", { name: "Redefinir ordenação para o eixo ativo" }));
    expect(clearCustomOrder).toHaveBeenCalled();
  });

  it("calls clearCustomOrder when a genuinely different sort axis is selected and a custom order exists", async () => {
    const clearCustomOrder = vi.fn();
    mockUseTabDeck.mockReturnValue({
      cards: [
        { ...card("a", "Sol Ring", "mainDeck"), customOrder: { axis: "type", groupKey: "Artifact", rank: 0 } },
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      clearCustomOrder,
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "price" } });
    expect(clearCustomOrder).toHaveBeenCalled();
  });

  it("does NOT call clearCustomOrder when changing the sort axis while no card has a custom order (regression: this used to disconnect the tab from re-sync on every ordinary sort change)", async () => {
    const clearCustomOrder = vi.fn();
    mockUseTabDeck.mockReturnValue({
      cards: [card("a", "Sol Ring", "mainDeck")],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      clearCustomOrder,
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "price" } });
    expect(clearCustomOrder).not.toHaveBeenCalled();
  });

  it("does NOT call clearCustomOrder from a pure Name-axis language resync click when no card has a custom order", async () => {
    const clearCustomOrder = vi.fn();
    let language: NameLanguage = "en";
    const setLanguage = vi.fn((next: NameLanguage) => {
      language = next;
    });
    mockUseNameLanguagePreference.mockImplementation(() => ({ language, setLanguage }));
    mockUseTabDeck.mockReturnValue({
      cards: [{ ...card("a", "Zebra", "mainDeck"), pageNamePt: "Anel Solar" }],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
      clearCustomOrder,
    });
    mockUseSourceTabStatus.mockReturnValue("open");

    const { TabRoot } = await import("./TabRoot");
    const { rerender } = render(<TabRoot />);

    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "name" } });
    fireEvent.click(screen.getByRole("button", { name: "Mudar nomes das cartas para português" }));
    rerender(<TabRoot />);

    const resyncButton = screen.getByRole("button", { name: "Redefinir ordenação para o eixo ativo" });
    fireEvent.click(resyncButton);

    expect(clearCustomOrder).not.toHaveBeenCalled();
  });
});

describe("TabRoot zone collapse/expand toggle (zone-collapse-toggle)", () => {
  function setup() {
    mockUseTabDeck.mockReturnValue({
      cards: [
        card("a", "Xyris, the Writhing Storm", "comandante"),
        card("b", "Sol Ring", "mainDeck"),
        card("c", "Chalice of the Void", "maybeboard"),
      ],
      pageStatus: "ok",
      format: "commander500",
      setFormat: vi.fn(),
      zoneError: undefined,
      moveCard: vi.fn(),
      setQuantity: vi.fn(),
    });
    mockUseSourceTabStatus.mockReturnValue("open");
  }

  it("starts every zone expanded on a fresh load", async () => {
    setup();
    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    for (const label of ["Comandante", "Companheiro", "Main Deck", "Maybeboard"]) {
      const toggle = screen.getByRole("button", { name: `recolher ${label}` });
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
    }
    expect(screen.getByText("Sol Ring")).toBeTruthy();
  });

  it("collapsing one zone leaves the others expanded", async () => {
    setup();
    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    fireEvent.click(screen.getByRole("button", { name: "recolher Main Deck" }));

    expect(screen.queryByText("Sol Ring")).toBeNull();
    expect(screen.getByText("Chalice of the Void")).toBeTruthy();
    expect(screen.getByText("Xyris, the Writhing Storm")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "recolher Maybeboard" }).getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("auto-expands a collapsed zone when a drop resolves to a move into it", async () => {
    setup();
    const { TabRoot } = await import("./TabRoot");
    render(<TabRoot />);

    fireEvent.click(screen.getByRole("button", { name: "recolher Maybeboard" }));
    expect(screen.queryByText("Chalice of the Void")).toBeNull();
    expect(screen.getByRole("button", { name: "expandir Maybeboard" })).toBeTruthy();

    act(() => {
      capturedOnDragEnd?.({
        active: { id: "b" },
        over: { id: "maybeboard" },
      } as unknown as DragEndEvent);
    });

    expect(screen.getByRole("button", { name: "recolher Maybeboard" })).toBeTruthy();
    expect(screen.getByText("Chalice of the Void")).toBeTruthy();
  });
});
