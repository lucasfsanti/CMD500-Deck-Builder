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

  it("wires a lookupCards request through to the Scryfall client's batch method", async () => {
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
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "POST" ? jsonResponse({ data: [solRing], not_found: [] }) : jsonResponse({}, 404),
      ),
    );

    const { handleRequest } = await import("./service-worker");
    const response = await handleRequest({ type: "lookupCards", names: ["Sol Ring"] });

    expect(response.type).toBe("lookupCards");
    expect(response.type === "lookupCards" && response.results["Sol Ring"]).toEqual({
      status: "ok",
      card: expect.objectContaining({ name: "Sol Ring" }),
    });
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

describe("background captureUpdate relay (task 1.1)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("writes a capture result to chrome.storage.session, keyed by the sender's tab id", async () => {
    const memory = new Map<string, unknown>();
    vi.stubGlobal("chrome", {
      runtime: { onMessage: undefined },
      storage: {
        session: {
          get: async (key: string) => ({ [key]: memory.get(key) }),
          set: async (obj: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(obj)) memory.set(k, v);
          },
        },
      },
    });

    const { handleRequest } = await import("./service-worker");
    const captureResult = { status: "ok" as const, cards: [] };
    const response = await handleRequest({ type: "captureUpdate", result: captureResult }, 42);

    expect(response).toEqual({ type: "captureUpdate", ok: true });
    expect(memory.get("capture:42")).toEqual(captureResult);
  });

  it("does not write anything when there is no sender tab id (e.g. a message from an extension page)", async () => {
    const setSpy = vi.fn(async () => {});
    vi.stubGlobal("chrome", {
      runtime: { onMessage: undefined },
      storage: { session: { get: async () => ({}), set: setSpy } },
    });

    const { handleRequest } = await import("./service-worker");
    await handleRequest({ type: "captureUpdate", result: { status: "ok", cards: [] } });

    expect(setSpy).not.toHaveBeenCalled();
  });
});

describe("background action.onClicked handling (task 2.2)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  function stubSessionStorage() {
    const memory = new Map<string, unknown>();
    vi.stubGlobal("chrome", {
      runtime: { onMessage: undefined },
      tabs: { onRemoved: undefined },
      action: { onClicked: undefined },
      storage: {
        session: {
          get: async (key: string) => ({ [key]: memory.get(key) }),
          set: async (obj: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(obj)) memory.set(k, v);
          },
          remove: async (key: string) => {
            memory.delete(key);
          },
        },
      },
    });
    return memory;
  }

  it("does nothing when the active tab is not a LigaMagic deck/collection page", async () => {
    stubSessionStorage();
    const { handleActionClicked } = await import("./service-worker");
    const tabsApi = { get: vi.fn(), create: vi.fn(), update: vi.fn() };
    const windowsApi = { update: vi.fn() };

    await handleActionClicked(
      { id: 1, url: "https://www.ligamagic.com.br/?view=forum/mensagem" },
      tabsApi,
      windowsApi,
    );

    expect(tabsApi.create).not.toHaveBeenCalled();
    expect(tabsApi.update).not.toHaveBeenCalled();
  });

  it("creates a new view tab scoped to the source tab when none exists yet", async () => {
    stubSessionStorage();
    const { handleActionClicked } = await import("./service-worker");
    const tabsApi = {
      get: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 200 }),
      update: vi.fn(),
    };
    const windowsApi = { update: vi.fn() };
    const getURL = vi.fn((path: string) => `chrome-extension://fake-id/${path}`);

    await handleActionClicked(
      { id: 1, url: "https://www.ligamagic.com.br/?view=dks/deck&id=1" },
      tabsApi,
      windowsApi,
      getURL,
    );

    expect(tabsApi.create).toHaveBeenCalledWith({
      url: "chrome-extension://fake-id/tab.html?sourceTabId=1&deckId=1",
    });
  });

  it("omits deckId from the new tab's URL when the source page isn't a deck page (e.g. a collection)", async () => {
    stubSessionStorage();
    const { handleActionClicked } = await import("./service-worker");
    const tabsApi = {
      get: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 200 }),
      update: vi.fn(),
    };
    const windowsApi = { update: vi.fn() };
    const getURL = vi.fn((path: string) => `chrome-extension://fake-id/${path}`);

    await handleActionClicked(
      { id: 1, url: "https://www.ligamagic.com.br/?view=colecao/colecao" },
      tabsApi,
      windowsApi,
      getURL,
    );

    expect(tabsApi.create).toHaveBeenCalledWith({
      url: "chrome-extension://fake-id/tab.html?sourceTabId=1",
    });
  });

  it("focuses the existing view tab (and its window) instead of creating a duplicate", async () => {
    const memory = stubSessionStorage();
    memory.set("view-tab:1", 200);
    memory.set("source-tab:200", 1);
    const { handleActionClicked } = await import("./service-worker");
    const tabsApi = {
      get: vi.fn().mockResolvedValue({ id: 200, windowId: 9 }),
      create: vi.fn(),
      update: vi.fn(),
    };
    const windowsApi = { update: vi.fn() };

    await handleActionClicked(
      { id: 1, url: "https://www.ligamagic.com.br/?view=dks/deck&id=1" },
      tabsApi,
      windowsApi,
    );

    expect(tabsApi.create).not.toHaveBeenCalled();
    expect(tabsApi.update).toHaveBeenCalledWith(200, { active: true });
    expect(windowsApi.update).toHaveBeenCalledWith(9, { focused: true });
  });
});

describe("background tabs.onRemoved handling (task 1.4)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("clears the view-tab mapping when the closed tab was a recorded view tab", async () => {
    const memory = new Map<string, unknown>([
      ["view-tab:1", 100],
      ["source-tab:100", 1],
    ]);
    vi.stubGlobal("chrome", {
      runtime: { onMessage: undefined },
      tabs: { onRemoved: undefined },
      storage: {
        session: {
          get: async (key: string) => ({ [key]: memory.get(key) }),
          set: async (obj: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(obj)) memory.set(k, v);
          },
          remove: async (key: string) => {
            memory.delete(key);
          },
        },
      },
    });

    const { handleTabRemoved } = await import("./service-worker");
    await handleTabRemoved(100);

    expect(memory.has("view-tab:1")).toBe(false);
    expect(memory.has("source-tab:100")).toBe(false);
  });
});
