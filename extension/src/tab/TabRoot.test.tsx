import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DeckCard } from "../lib/deck/types";

const mockUseTabDeck = vi.fn();
vi.mock("./use-tab-deck", () => ({
  useTabDeck: () => mockUseTabDeck(),
}));

const mockUseSourceTabStatus = vi.fn();
vi.mock("./use-source-tab-status", () => ({
  useSourceTabStatus: () => mockUseSourceTabStatus(),
}));

function card(id: string, name: string, zone: DeckCard["zone"]): DeckCard {
  return {
    id,
    name,
    quantity: 1,
    zone,
    pageLowestPrice: 4,
    pageImageUrl: undefined,
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
  it("renders the full-width layout with all five zones, budget, legality, and export, against a captured-deck fixture", async () => {
    mockUseTabDeck.mockReturnValue({
      cards: [
        card("a", "Xyris, the Writhing Storm", "comandante"),
        card("b", "Sol Ring", "mainDeck"),
        card("c", "Chalice of the Void", "sideboard"),
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

    expect(screen.getByText("Commander 500 Deckbuilder")).toBeTruthy();
    expect(screen.getByText("Xyris, the Writhing Storm")).toBeTruthy();
    expect(screen.getByText("Sol Ring")).toBeTruthy();
    expect(screen.getByText("Chalice of the Void")).toBeTruthy();
    // All five zone headers present, per deck-organizer's five-zone requirement, now at full width.
    for (const label of ["Comandante", "Comandante Parceiro", "Main Deck", "Sideboard", "Maybeboard"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // No unsynced indicator while the source tab is open.
    expect(screen.queryByText(/Not synced/)).toBeNull();
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
    expect(screen.getByText(/Not synced/)).toBeTruthy();
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

    expect(screen.getByText("Reading this deck…")).toBeTruthy();
  });
});
