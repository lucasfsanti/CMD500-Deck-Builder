import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useSourceTabStatus, type TabsStatusApi } from "./use-source-tab-status";

function makeTabsApi(getImpl: (id: number) => Promise<chrome.tabs.Tab>) {
  const listeners: Array<(id: number) => void> = [];
  const api: TabsStatusApi = {
    get: getImpl as typeof chrome.tabs.get,
    onRemoved: {
      addListener: ((fn: (id: number) => void) => listeners.push(fn)) as never,
      removeListener: ((fn: (id: number) => void) => {
        const i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      }) as never,
    },
  };
  return { api, fireRemoved: (id: number) => listeners.forEach((fn) => fn(id)) };
}

describe("useSourceTabStatus (task 3.2)", () => {
  it("starts as unknown, then resolves to open when the source tab exists", async () => {
    const { api } = makeTabsApi(async () => ({ id: 1 }) as chrome.tabs.Tab);

    const { result } = renderHook(() => useSourceTabStatus(1, api));

    expect(result.current).toBe("unknown");
    await waitFor(() => expect(result.current).toBe("open"));
  });

  it("resolves to closed when the initial chrome.tabs.get check fails", async () => {
    const { api } = makeTabsApi(async () => {
      throw new Error("No tab with id: 1");
    });

    const { result } = renderHook(() => useSourceTabStatus(1, api));

    await waitFor(() => expect(result.current).toBe("closed"));
  });

  it("transitions from open to closed when tabs.onRemoved fires for the source tab", async () => {
    const { api, fireRemoved } = makeTabsApi(async () => ({ id: 1 }) as chrome.tabs.Tab);

    const { result } = renderHook(() => useSourceTabStatus(1, api));
    await waitFor(() => expect(result.current).toBe("open"));

    act(() => fireRemoved(1));

    expect(result.current).toBe("closed");
  });

  it("ignores onRemoved events for a different tab", async () => {
    const { api, fireRemoved } = makeTabsApi(async () => ({ id: 1 }) as chrome.tabs.Tab);

    const { result } = renderHook(() => useSourceTabStatus(1, api));
    await waitFor(() => expect(result.current).toBe("open"));

    act(() => fireRemoved(999));

    expect(result.current).toBe("open");
  });

  it("stays unknown when there is no source tab id yet", () => {
    const { api } = makeTabsApi(async () => ({ id: 1 }) as chrome.tabs.Tab);
    const { result } = renderHook(() => useSourceTabStatus(undefined, api));
    expect(result.current).toBe("unknown");
  });
});
