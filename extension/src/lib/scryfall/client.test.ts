import { describe, expect, it, vi } from "vitest";
import { ScryfallClient } from "./client";
import { MemoryStore } from "./cache";

const solRing = {
  name: "Sol Ring",
  type_line: "Artifact",
  color_identity: [],
  cmc: 1,
  layout: "normal",
  legalities: { commander: "legal" },
  id: "abc-123",
  prints_search_uri: "https://api.scryfall.com/cards/search?q=sol+ring",
};

const balance = {
  name: "Balance",
  type_line: "Sorcery",
  color_identity: ["W"],
  cmc: 1,
  layout: "normal",
  legalities: { commander: "banned" },
  id: "def-456",
  prints_search_uri: "https://api.scryfall.com/cards/search?q=balance",
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("ScryfallClient default construction", () => {
  it("works end to end with no explicit fetchImpl override", async () => {
    // NOTE: this does NOT catch the "Illegal invocation" class of bug that
    // motivated fetch.bind(globalThis) in the client constructor — jsdom's
    // stubbed fetch has no native `this`-binding restriction, so a bare
    // `options.fetchImpl ?? fetch` would pass here too. That bug was only
    // caught by real-browser verification (scripts/verify-load.mjs against
    // a live page). This test only guards that default construction wires
    // together correctly, not the specific binding fix.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(solRing)),
    );
    try {
      const client = new ScryfallClient();
      const result = await client.lookupCard("Sol Ring");
      expect(result.status).toBe("ok");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("ScryfallClient.lookupCard", () => {
  it("resolves a known card's enrichment (task 1.1)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(solRing));
    const client = new ScryfallClient({ fetchImpl });

    const result = await client.lookupCard("Sol Ring");

    expect(result).toEqual({
      status: "ok",
      card: {
        name: "Sol Ring",
        typeLine: "Artifact",
        colorIdentity: [],
        cmc: 1,
        layout: "normal",
        legalInCommander: true,
        scryfallId: "abc-123",
      },
    });
  });

  it("returns not-found for a name with no Scryfall match, even after fuzzy matching (task 1.4)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ details: "no match" }, 404));
    const client = new ScryfallClient({ fetchImpl });

    const result = await client.lookupCard("Definitely Not A Real Card Xyz");

    expect(result).toEqual({ status: "not-found" });
  });

  it("returns unavailable, not a guessed record, when Scryfall errors", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 500));
    const client = new ScryfallClient({ fetchImpl });

    const result = await client.lookupCard("Sol Ring");

    expect(result).toEqual({ status: "unavailable" });
  });

  it("returns unavailable when the network request itself throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const client = new ScryfallClient({ fetchImpl });

    const result = await client.lookupCard("Sol Ring");

    expect(result).toEqual({ status: "unavailable" });
  });

  it("resolves Commander 500 legality from Scryfall's per-card legality data (task 1.5)", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return url.includes("balance") || url.includes("Balance")
        ? jsonResponse(balance)
        : jsonResponse(solRing);
    });
    const client = new ScryfallClient({ fetchImpl });

    const legal = await client.lookupCard("Sol Ring");
    const banned = await client.lookupCard("Balance");

    expect(legal.status === "ok" && legal.card.legalInCommander).toBe(true);
    expect(banned.status === "ok" && banned.card.legalInCommander).toBe(false);
  });

  it("does not re-query Scryfall for a repeated lookup within the cache's freshness window (task 1.2)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(solRing));
    const client = new ScryfallClient({ fetchImpl, store: new MemoryStore() });

    await client.lookupCard("Sol Ring");
    await client.lookupCard("Sol Ring");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("re-queries Scryfall once the cached entry has expired (task 1.2)", async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn(async () => jsonResponse(solRing));
      const client = new ScryfallClient({
        fetchImpl,
        store: new MemoryStore(),
        enrichmentFreshnessMs: 1000,
      });

      await client.lookupCard("Sol Ring");
      vi.advanceTimersByTime(5000);
      await client.lookupCard("Sol Ring");

      expect(fetchImpl).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("ScryfallClient.lookupEligiblePrintings", () => {
  it("excludes non-tradeable/promo-only and digital-only printings (task 1.8)", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/cards/abc-123")) return jsonResponse(solRing);
      return jsonResponse({
        object: "list",
        data: [
          { set: "c21", collector_number: "263", games: ["paper"], promo: false, digital: false, border_color: "black" },
          { set: "pcmd", collector_number: "1", games: ["paper"], promo: true, digital: false, border_color: "black" },
          { set: "sld", collector_number: "99", games: ["mtgo", "arena"], promo: false, digital: true, border_color: "black" },
        ],
        has_more: false,
      });
    });
    const client = new ScryfallClient({ fetchImpl });

    const printings = await client.lookupEligiblePrintings("abc-123");

    expect(printings).toEqual([{ set: "c21", collectorNumber: "263" }]);
  });
});
