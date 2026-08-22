import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDeck } from "./use-deck";
import * as messagingClient from "../lib/messaging/client";

function stubBackgroundClient() {
  vi.spyOn(messagingClient, "backgroundClient", "get").mockReturnValue({
    lookupCard: vi.fn((): Promise<never> => new Promise(() => {})),
    lookupEligiblePrintings: vi.fn(),
    lookupDuelCategory: vi.fn(),
  });
}

describe("useDeck routes to the correct parser by page kind (verification finding #1)", () => {
  it("uses the deck-page parser (.pdeck-block structure) when pageKind is 'deck'", async () => {
    stubBackgroundClient();
    const root = document.createElement("div");
    root.innerHTML = `<div id="dk-val-1-1"><div class="pdeck-block">
      <div class="deck-line"><div class="deck-type deck-type-first">Criaturas <i>(1)</i></div></div>
      <div class="deck-line">
        <div class="deck-box-left">
          <div class="deck-qty">1&nbsp;&nbsp;</div>
          <div class="deck-card"><a href="/?view=cards/card&card=Sol+Ring">Anel Solar</a></div>
        </div>
        <div class="deck-box-right"><div class="deck-price"><font>4,00</font></div></div>
      </div>
    </div></div>`;

    const { result } = renderHook(() => useDeck(root, "deck"));

    await waitFor(() => expect(result.current.pageStatus).toBe("ok"));
    expect(result.current.cards.map((c) => c.name)).toEqual(["Sol Ring"]);
  });

  it("uses the collection-page parser (.deck-card list structure) when pageKind is 'collection'", async () => {
    stubBackgroundClient();
    const root = document.createElement("div");
    // Deliberately NOT wrapped in a #dk-val-1-* / .pdeck-block container —
    // the deck-page parser would report unrecognized-page on this markup.
    root.innerHTML = `<div class="colecao-list">
      <div class="deck-line">
        <div class="deck-qty">2&nbsp;&nbsp;</div>
        <div class="deck-card"><a href="/?view=cards/card&card=Sol+Ring">Anel Solar</a></div>
        <div class="deck-price"><font>4,00</font></div>
      </div>
    </div>`;

    const { result } = renderHook(() => useDeck(root, "collection"));

    await waitFor(() => expect(result.current.pageStatus).toBe("ok"));
    expect(result.current.cards.map((c) => c.name)).toEqual(["Sol Ring"]);
  });

  it("does not attempt any capture when pageKind is 'none'", () => {
    stubBackgroundClient();
    const root = document.createElement("div");
    root.innerHTML = `<div class="colecao-list">
      <div class="deck-line">
        <div class="deck-qty">2&nbsp;&nbsp;</div>
        <div class="deck-card"><a href="/?view=cards/card&card=Sol+Ring">Anel Solar</a></div>
        <div class="deck-price"><font>4,00</font></div>
      </div>
    </div>`;

    const { result } = renderHook(() => useDeck(root, "none"));

    expect(result.current.pageStatus).toBe("reading");
    expect(result.current.cards).toEqual([]);
  });
});
