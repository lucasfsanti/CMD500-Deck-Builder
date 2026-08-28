import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as messagingClient from "../lib/messaging/client";
import { useTabDeck } from "./use-tab-deck";
import type { CaptureResult } from "../lib/capture/deck-page-parser";

let mockCapture: CaptureResult | undefined;
vi.mock("./use-relayed-capture", () => ({
  useRelayedCapture: () => mockCapture,
}));

describe("useTabDeck (task 2.5)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    mockCapture = undefined;
    vi.spyOn(messagingClient, "backgroundClient", "get").mockReturnValue({
      lookupCard: vi.fn((): Promise<never> => new Promise(() => {})),
      lookupCards: vi.fn((): Promise<never> => new Promise(() => {})),
      lookupEligiblePrintings: vi.fn(),
      lookupDuelCategory: vi.fn(),
    });
    vi.stubGlobal("chrome", {
      storage: { local: { get: async () => ({}), set: async () => {} } },
    });
  });

  it("seeds cards from the relayed capture once it resolves", async () => {
    mockCapture = {
      status: "ok",
      cards: [{ id: "a", name: "Sol Ring", quantity: 1, zone: "mainDeck", pageLowestPrice: 4, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined }],
    };

    const { result } = renderHook(() => useTabDeck(1, undefined));

    await waitFor(() => expect(result.current.cards).toHaveLength(1));
    expect(result.current.pageStatus).toBe("ok");
  });

  it("shows unrecognized-page status when the relay reports it", async () => {
    mockCapture = { status: "unrecognized-page" };

    const { result } = renderHook(() => useTabDeck(1, undefined));

    await waitFor(() => expect(result.current.pageStatus).toBe("unrecognized-page"));
  });

  it("loads a previously-stored format for the given deck id", async () => {
    const memory = new Map<string, unknown>([["deck-format:42", "commander500Duel"]]);
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: async (key: string) => ({ [key]: memory.get(key) }),
          set: async (obj: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(obj)) memory.set(k, v);
          },
        },
      },
    });

    const { result } = renderHook(() => useTabDeck(1, "42"));

    await waitFor(() => expect(result.current.format).toBe("commander500Duel"));
  });

  it("persists a format change for the given deck id", async () => {
    const memory = new Map<string, unknown>();
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: async (key: string) => ({ [key]: memory.get(key) }),
          set: async (obj: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(obj)) memory.set(k, v);
          },
        },
      },
    });

    const { result } = renderHook(() => useTabDeck(1, "42"));
    act(() => result.current.setFormat("commander500Duel"));

    await waitFor(() => expect(memory.get("deck-format:42")).toBe("commander500Duel"));
  });

  it("moves a card between zones", async () => {
    mockCapture = {
      status: "ok",
      cards: [{ id: "a", name: "Sol Ring", quantity: 1, zone: "mainDeck", pageLowestPrice: 4, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined }],
    };

    const { result } = renderHook(() => useTabDeck(1, undefined));
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    act(() => result.current.moveCard("a", "maybeboard"));

    expect(result.current.cards[0]?.zone).toBe("maybeboard");
  });

  it("requests all pending cards' enrichment in one batched call and applies results back by id (task 2.3)", async () => {
    mockCapture = {
      status: "ok",
      cards: [
        { id: "a", name: "Sol Ring", quantity: 1, zone: "mainDeck", pageLowestPrice: 4, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined },
        { id: "b", name: "Llanowar Elves", quantity: 1, zone: "mainDeck", pageLowestPrice: 1, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined },
      ],
    };
    const lookupCards = vi.fn(async (names: string[]) =>
      Object.fromEntries(
        names.map((name) => [
          name,
          { status: "ok" as const, card: { name, typeLine: "Artifact", colorIdentity: [], cmc: 1, layout: "normal" as const, legalInCommander: true, scryfallId: name, imageUrl: undefined, faceManaCosts: undefined } },
        ]),
      ),
    );
    vi.spyOn(messagingClient, "backgroundClient", "get").mockReturnValue({
      lookupCard: vi.fn(),
      lookupCards,
      lookupEligiblePrintings: vi.fn(),
      lookupDuelCategory: vi.fn(),
    });

    const { result } = renderHook(() => useTabDeck(1, undefined));
    await waitFor(() => expect(result.current.cards).toHaveLength(2));
    await waitFor(() =>
      expect(result.current.cards.every((c) => c.enrichmentStatus === "ok")).toBe(true),
    );

    expect(lookupCards).toHaveBeenCalledTimes(1);
    expect(lookupCards).toHaveBeenCalledWith(["Sol Ring", "Llanowar Elves"]);
    expect(result.current.cards.find((c) => c.id === "a")?.enrichment?.name).toBe("Sol Ring");
    expect(result.current.cards.find((c) => c.id === "b")?.enrichment?.name).toBe("Llanowar Elves");
  });

  it("edits a card's quantity", async () => {
    mockCapture = {
      status: "ok",
      cards: [{ id: "a", name: "Sol Ring", quantity: 1, zone: "mainDeck", pageLowestPrice: 4, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined }],
    };

    const { result } = renderHook(() => useTabDeck(1, undefined));
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    act(() => result.current.setQuantity("a", 4));

    expect(result.current.cards[0]?.quantity).toBe(4);
  });

  it("removes a card from the deck", async () => {
    mockCapture = {
      status: "ok",
      cards: [{ id: "a", name: "Sol Ring", quantity: 1, zone: "mainDeck", pageLowestPrice: 4, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined }],
    };

    const { result } = renderHook(() => useTabDeck(1, undefined));
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    act(() => result.current.removeCard("a"));

    expect(result.current.cards).toHaveLength(0);
  });

  it("normalizes a non-basic card's captured quantity to 1, leaving a basic land's untouched", async () => {
    mockCapture = {
      status: "ok",
      cards: [
        { id: "a", name: "Sol Ring", quantity: 3, zone: "mainDeck", pageLowestPrice: 4, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined },
        { id: "b", name: "Island", quantity: 20, zone: "mainDeck", pageLowestPrice: 1, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined },
      ],
    };

    const { result } = renderHook(() => useTabDeck(1, undefined));

    await waitFor(() => expect(result.current.cards).toHaveLength(2));
    expect(result.current.cards.find((c) => c.id === "a")?.quantity).toBe(1);
    expect(result.current.cards.find((c) => c.id === "b")?.quantity).toBe(20);
  });

  it("re-normalizes a non-basic card's quantity on a relayed re-sync", async () => {
    mockCapture = {
      status: "ok",
      cards: [{ id: "a", name: "Sol Ring", quantity: 1, zone: "mainDeck", pageLowestPrice: 4, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined }],
    };

    const { result, rerender } = renderHook(() => useTabDeck(1, undefined));
    await waitFor(() => expect(result.current.cards).toHaveLength(1));

    mockCapture = {
      status: "ok",
      cards: [{ id: "a", name: "Sol Ring", quantity: 2, zone: "mainDeck", pageLowestPrice: 4, pageImageUrl: undefined, pageManaCostSymbols: undefined, pageNamePt: undefined }],
    };
    rerender();

    await waitFor(() => expect(result.current.cards[0]?.quantity).toBe(1));
  });
});
