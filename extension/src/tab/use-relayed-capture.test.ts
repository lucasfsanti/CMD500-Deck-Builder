import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { getSourceTabIdFromUrl, getDeckIdFromUrl, useRelayedCapture } from "./use-relayed-capture";

describe("getSourceTabIdFromUrl", () => {
  it("parses a numeric sourceTabId param", () => {
    expect(getSourceTabIdFromUrl(new URL("https://x/tab.html?sourceTabId=42"))).toBe(42);
  });

  it("returns undefined when the param is missing", () => {
    expect(getSourceTabIdFromUrl(new URL("https://x/tab.html"))).toBeUndefined();
  });

  it("returns undefined when the param isn't a valid number", () => {
    expect(getSourceTabIdFromUrl(new URL("https://x/tab.html?sourceTabId=abc"))).toBeUndefined();
  });
});

describe("getDeckIdFromUrl (task 2.5 support)", () => {
  it("reads the deckId param passed through by the background", () => {
    expect(getDeckIdFromUrl(new URL("https://x/tab.html?sourceTabId=1&deckId=42"))).toBe("42");
  });

  it("returns undefined when there is no deckId (e.g. a collection page)", () => {
    expect(getDeckIdFromUrl(new URL("https://x/tab.html?sourceTabId=1"))).toBeUndefined();
  });
});

describe("useRelayedCapture (task 2.4)", () => {
  let changeListeners: Array<(changes: unknown, areaName: string) => void>;

  beforeEach(() => {
    vi.unstubAllGlobals();
    changeListeners = [];
  });

  function stubChromeStorage(initial: Record<string, unknown>) {
    vi.stubGlobal("chrome", {
      storage: {
        session: {
          get: async (key: string) => ({ [key]: initial[key] }),
        },
        onChanged: {
          addListener: (fn: (changes: unknown, areaName: string) => void) => {
            changeListeners.push(fn);
          },
          removeListener: (fn: (changes: unknown, areaName: string) => void) => {
            changeListeners = changeListeners.filter((l) => l !== fn);
          },
        },
      },
    });
  }

  it("does the initial read from chrome.storage.session for the given source tab", async () => {
    const captured = { status: "ok" as const, cards: [] };
    stubChromeStorage({ "capture:7": captured });

    const { result } = renderHook(() => useRelayedCapture(7));

    await waitFor(() => expect(result.current).toEqual(captured));
  });

  it("returns undefined while no sourceTabId is known yet", () => {
    stubChromeStorage({});
    const { result } = renderHook(() => useRelayedCapture(undefined));
    expect(result.current).toBeUndefined();
  });

  it("updates live when chrome.storage.onChanged fires for this tab's key", async () => {
    stubChromeStorage({ "capture:7": { status: "ok", cards: [] } });
    const { result } = renderHook(() => useRelayedCapture(7));
    await waitFor(() => expect(result.current).toBeDefined());

    const updated = { status: "ok" as const, cards: [{ id: "a" }] };
    act(() => {
      changeListeners.forEach((fn) =>
        fn({ "capture:7": { newValue: updated } }, "session"),
      );
    });

    await waitFor(() => expect(result.current).toEqual(updated));
  });

  it("ignores onChanged events from a different storage area or a different tab's key", async () => {
    stubChromeStorage({ "capture:7": { status: "ok", cards: [] } });
    const { result } = renderHook(() => useRelayedCapture(7));
    await waitFor(() => expect(result.current).toBeDefined());
    const before = result.current;

    act(() => {
      changeListeners.forEach((fn) =>
        fn({ "capture:7": { newValue: { status: "ok", cards: [{ id: "x" }] } } }, "local"),
      );
      changeListeners.forEach((fn) =>
        fn({ "capture:999": { newValue: { status: "ok", cards: [{ id: "y" }] } } }, "session"),
      );
    });

    expect(result.current).toEqual(before);
  });
});
