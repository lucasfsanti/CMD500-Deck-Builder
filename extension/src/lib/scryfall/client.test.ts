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
  image_uris: { normal: "https://cards.scryfall.io/normal/sol-ring.jpg" },
};

const delverOfSecrets = {
  name: "Delver of Secrets // Insectile Aberration",
  type_line: "Creature — Human Wizard // Creature — Human Insect",
  color_identity: ["U"],
  cmc: 1,
  layout: "transform",
  legalities: { commander: "legal" },
  id: "ghi-789",
  prints_search_uri: "https://api.scryfall.com/cards/search?q=delver",
  // Double-faced cards have no top-level image_uris — only per-face.
  card_faces: [
    { image_uris: { normal: "https://cards.scryfall.io/normal/delver-front.jpg" } },
    { image_uris: { normal: "https://cards.scryfall.io/normal/delver-back.jpg" } },
  ],
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
        imageUrl: "https://cards.scryfall.io/normal/sol-ring.jpg",
      },
    });
  });

  it("resolves imageUrl from top-level image_uris for a single-faced card (task 4.1)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(solRing));
    const client = new ScryfallClient({ fetchImpl });

    const result = await client.lookupCard("Sol Ring");

    expect(result.status === "ok" && result.card.imageUrl).toBe(
      "https://cards.scryfall.io/normal/sol-ring.jpg",
    );
  });

  it("falls back to the first face's image_uris for a double-faced card (task 4.1)", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(delverOfSecrets));
    const client = new ScryfallClient({ fetchImpl });

    const result = await client.lookupCard("Delver of Secrets");

    expect(result.status === "ok" && result.card.imageUrl).toBe(
      "https://cards.scryfall.io/normal/delver-front.jpg",
    );
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

const llanowarElves = {
  name: "Llanowar Elves",
  type_line: "Creature — Elf Druid",
  color_identity: ["G"],
  cmc: 1,
  layout: "normal",
  legalities: { commander: "legal" },
  id: "jkl-012",
  prints_search_uri: "https://api.scryfall.com/cards/search?q=llanowar+elves",
};

function collectionResponse(cards: unknown[]): Response {
  return jsonResponse({ data: cards, not_found: [] });
}

describe("ScryfallClient.lookupCards (batched lookup)", () => {
  it("resolves a batch of matched names in one collection request, with no individual fallback calls", async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      return collectionResponse([solRing, llanowarElves]);
    });
    const client = new ScryfallClient({ fetchImpl });

    const results = await client.lookupCards(["Sol Ring", "Llanowar Elves"]);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(results.get("Sol Ring")).toEqual({ status: "ok", card: expect.objectContaining({ name: "Sol Ring" }) });
    expect(results.get("Llanowar Elves")).toEqual({
      status: "ok",
      card: expect.objectContaining({ name: "Llanowar Elves" }),
    });
  });

  it("falls back to a fuzzy per-card lookup only for names the batch didn't resolve", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") {
        // Only Sol Ring comes back from the batch; "Typo'd Card" is left unmatched.
        return collectionResponse([solRing]);
      }
      expect(String(input)).toContain("fuzzy=Typo");
      return jsonResponse(llanowarElves);
    });
    const client = new ScryfallClient({ fetchImpl });

    const results = await client.lookupCards(["Sol Ring", "Typo'd Card"]);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(results.get("Sol Ring")?.status).toBe("ok");
    expect(results.get("Typo'd Card")).toEqual({
      status: "ok",
      card: expect.objectContaining({ name: "Llanowar Elves" }),
    });
  });

  it("skips already-cached cards from the batch request", async () => {
    const store = new MemoryStore();
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "POST") return collectionResponse([llanowarElves]);
      return jsonResponse(solRing);
    });
    const client = new ScryfallClient({ fetchImpl, store });

    await client.lookupCard("Sol Ring"); // primes the cache via the fuzzy path
    fetchImpl.mockClear();

    const results = await client.lookupCards(["Sol Ring", "Llanowar Elves"]);

    expect(fetchImpl).toHaveBeenCalledTimes(1); // only the batch call for Llanowar Elves
    expect(results.get("Sol Ring")?.status).toBe("ok");
    expect(results.get("Llanowar Elves")?.status).toBe("ok");
  });

  it("chunks requests at the collection endpoint's per-request identifier limit", async () => {
    const names = Array.from({ length: 80 }, (_, i) => `Card ${i}`);
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === "POST" ? collectionResponse(names.map((n) => ({ ...llanowarElves, name: n }))) : jsonResponse({}, 404),
    );
    const client = new ScryfallClient({ fetchImpl });

    await client.lookupCards(names);

    const postCalls = fetchImpl.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(postCalls).toHaveLength(2); // 75 + 5, chunked
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
