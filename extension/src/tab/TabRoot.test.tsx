import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { DeckCard } from "../lib/deck/types";
import type { Theme } from "./use-theme-preference";

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
    enrichment: {
      name,
      typeLine: "Artifact",
      colorIdentity: [],
      cmc: 1,
      layout: "normal",
      legalInCommander: true,
      scryfallId: id,
      imageUrl: undefined,
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
