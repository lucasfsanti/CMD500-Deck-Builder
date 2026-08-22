import { describe, expect, it, vi, beforeEach } from "vitest";

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

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("background service worker (task 2.3)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("wires a lookupCard request through to the Scryfall client and returns enrichment", async () => {
    const memory = new Map<string, unknown>();
    vi.stubGlobal("chrome", {
      runtime: { onMessage: undefined },
      storage: {
        local: {
          get: async (key: string) => ({ [key]: memory.get(key) }),
          set: async (obj: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(obj)) memory.set(k, v);
          },
        },
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(solRing)),
    );

    const { handleRequest } = await import("./service-worker");
    const response = await handleRequest({ type: "lookupCard", name: "Sol Ring" });

    expect(response).toEqual({
      type: "lookupCard",
      result: {
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
      },
    });
  });

  it("wires a lookupDuelCategory request through to the bundled banlist module", async () => {
    vi.stubGlobal("chrome", { runtime: { onMessage: undefined } });

    const { handleRequest } = await import("./service-worker");
    const response = await handleRequest({ type: "lookupDuelCategory", name: "Sol Ring" });

    expect(response).toEqual({ type: "lookupDuelCategory", result: "banned-in-deck" });
  });
});
