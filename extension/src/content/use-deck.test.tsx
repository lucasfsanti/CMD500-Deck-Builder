import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDeck } from "./use-deck";
import * as messagingClient from "../lib/messaging/client";

function makeDeckHtml(cardCount: number): string {
  const cards = Array.from({ length: cardCount }, (_, i) => `Card ${i}`);
  const rows = cards
    .map(
      (name) => `
      <div class="deck-line">
        <div class="deck-box-left">
          <div class="deck-qty">1&nbsp;&nbsp;</div>
          <div class="deck-card"><a href="/?view=cards/card&card=${encodeURIComponent(name)}">${name}</a></div>
        </div>
        <div class="deck-box-right"><div class="deck-price"><font>1,00</font></div></div>
      </div>`,
    )
    .join("");
  return `<div id="dk-val-1-1"><div class="pdeck-block">
    <div class="deck-line"><div class="deck-type deck-type-first">Criaturas <i>(${cardCount})</i></div></div>
    ${rows}
  </div></div>`;
}

describe("useDeck enrichment concurrency (surfaced by real-page verification)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("never has more than the concurrency cap of lookups in flight at once", async () => {
    const root = document.createElement("div");
    root.innerHTML = makeDeckHtml(20);
    document.body.appendChild(root);

    let inFlight = 0;
    let maxInFlight = 0;
    const resolvers: Array<() => void> = [];
    vi.spyOn(messagingClient, "backgroundClient", "get").mockReturnValue({
      lookupCard: vi.fn(() => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        return new Promise<{ status: "not-found" }>((resolve) => {
          resolvers.push(() => {
            inFlight--;
            resolve({ status: "not-found" });
          });
        });
      }),
      lookupEligiblePrintings: vi.fn(),
      lookupDuelCategory: vi.fn(),
    });

    const { result } = renderHook(() => useDeck(root, "deck"));

    await waitFor(() => expect(result.current.cards.length).toBe(20));
    await waitFor(() => expect(maxInFlight).toBeGreaterThan(0));

    // Drain everything in flight so far, letting the hook queue up more.
    while (resolvers.length > 0 || maxInFlight < 20) {
      const batch = resolvers.splice(0, resolvers.length);
      if (batch.length === 0) break;
      await act(async () => {
        batch.forEach((r) => r());
        await Promise.resolve();
      });
    }

    expect(maxInFlight).toBeLessThanOrEqual(6);
    document.body.removeChild(root);
  });
});

describe("useDeck format persistence (task 6.1)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/?view=dks/deck&id=42");
  });

  it("loads a previously-stored format for this deck on mount", async () => {
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
    vi.spyOn(messagingClient, "backgroundClient", "get").mockReturnValue({
      lookupCard: vi.fn((): Promise<never> => new Promise(() => {})),
      lookupEligiblePrintings: vi.fn(),
      lookupDuelCategory: vi.fn(),
    });

    const { result } = renderHook(() => useDeck(null, "deck"));
    await waitFor(() => expect(result.current.format).toBe("commander500Duel"));
  });

  it("persists a user's format change for this deck", async () => {
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
    vi.spyOn(messagingClient, "backgroundClient", "get").mockReturnValue({
      lookupCard: vi.fn((): Promise<never> => new Promise(() => {})),
      lookupEligiblePrintings: vi.fn(),
      lookupDuelCategory: vi.fn(),
    });

    const { result } = renderHook(() => useDeck(null, "deck"));
    act(() => result.current.setFormat("commander500Duel"));

    await waitFor(() => expect(memory.get("deck-format:42")).toBe("commander500Duel"));
  });
});
