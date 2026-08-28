import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as messagingClient from "../lib/messaging/client";
import { useTabDeck } from "./use-tab-deck";
import { manaCurveBuckets } from "../lib/analytics/bucket-counts";
import type { CaptureResult } from "../lib/capture/deck-page-parser";

let mockCapture: CaptureResult | undefined;
vi.mock("./use-relayed-capture", () => ({
  useRelayedCapture: () => mockCapture,
}));

describe("charts update within the same interaction as a move into Main Deck (task 5.4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.spyOn(messagingClient, "backgroundClient", "get").mockReturnValue({
      lookupCard: vi.fn(),
      lookupCards: vi.fn(async (names: string[]) =>
        Object.fromEntries(
          names.map((name) => [
            name,
            {
              status: "ok" as const,
              card: {
                name,
                typeLine: "Creature",
                colorIdentity: [],
                cmc: 3,
                layout: "normal" as const,
                legalInCommander: true,
                scryfallId: "a",
                imageUrl: undefined,
                faceManaCosts: undefined,
              },
            },
          ]),
        ),
      ),
      lookupEligiblePrintings: vi.fn(),
      lookupDuelCategory: vi.fn(),
    });
    vi.stubGlobal("chrome", {
      storage: { local: { get: async () => ({}), set: async () => {} } },
    });
  });

  it("recomputes the mana curve the moment a card moves into Main Deck", async () => {
    mockCapture = {
      status: "ok",
      cards: [
        { id: "a", name: "Maybeboard Card", quantity: 1, zone: "maybeboard", pageLowestPrice: 1, pageImageUrl: undefined, pageManaCostSymbols: undefined },
      ],
    };

    const { result } = renderHook(() => useTabDeck(1, undefined));
    // Let the real enrichment pipeline resolve the card's CMC via backgroundClient.
    await waitFor(() => expect(result.current.cards[0]?.enrichmentStatus).toBe("ok"));

    // Before the move: card is in Maybeboard, so the Main-Deck-only mana curve is empty.
    expect(manaCurveBuckets(result.current.cards)).toEqual([]);

    act(() => result.current.moveCard("a", "mainDeck"));

    // After the move, within the same render's `cards`, the mana curve
    // immediately reflects it — same pure-function-per-render pattern as
    // budget/legality, now extended to the charts.
    expect(manaCurveBuckets(result.current.cards)).toEqual([{ label: "3", count: 1 }]);
  });
});
