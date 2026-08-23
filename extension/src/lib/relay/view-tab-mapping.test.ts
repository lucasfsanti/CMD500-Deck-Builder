import { describe, expect, it, vi } from "vitest";
import { MemoryStore } from "../scryfall/cache";
import {
  setViewTabId,
  clearViewTabId,
  getOpenViewTabId,
  clearMappingByViewTabId,
} from "./view-tab-mapping";

describe("getOpenViewTabId (task 1.3)", () => {
  it("returns undefined when there is no existing mapping", async () => {
    const store = new MemoryStore();
    const tabsApi = { get: vi.fn() };

    const result = await getOpenViewTabId(1, store, tabsApi);

    expect(result).toBeUndefined();
    expect(tabsApi.get).not.toHaveBeenCalled();
  });

  it("returns the view tab id when the mapping exists and the tab is still open", async () => {
    const store = new MemoryStore();
    await setViewTabId(1, 100, store);
    const tabsApi = { get: vi.fn().mockResolvedValue({ id: 100 }) };

    const result = await getOpenViewTabId(1, store, tabsApi);

    expect(result).toBe(100);
    expect(tabsApi.get).toHaveBeenCalledWith(100);
  });

  it("returns undefined and clears the mapping when the recorded tab has been closed", async () => {
    const store = new MemoryStore();
    await setViewTabId(1, 100, store);
    const tabsApi = { get: vi.fn().mockRejectedValue(new Error("No tab with id: 100")) };

    const result = await getOpenViewTabId(1, store, tabsApi);

    expect(result).toBeUndefined();
    // The stale mapping is cleared, so a later lookup with a "still open" tabsApi wouldn't resurrect it.
    const secondLookup = await getOpenViewTabId(1, store, { get: vi.fn().mockResolvedValue({}) });
    expect(secondLookup).toBeUndefined();
  });
});

describe("clearViewTabId", () => {
  it("removes both the forward and reverse mapping entries", async () => {
    const store = new MemoryStore();
    await setViewTabId(1, 100, store);

    await clearViewTabId(1, store);

    expect(await getOpenViewTabId(1, store, { get: vi.fn().mockResolvedValue({}) })).toBeUndefined();
    await clearMappingByViewTabId(100, store); // no-op, but must not throw on an already-cleared entry
  });
});

describe("clearMappingByViewTabId (task 1.4 support)", () => {
  it("clears the source tab's mapping when its view tab closes, via the reverse index", async () => {
    const store = new MemoryStore();
    await setViewTabId(1, 100, store);
    await setViewTabId(2, 200, store);

    await clearMappingByViewTabId(100, store);

    expect(
      await getOpenViewTabId(1, store, { get: vi.fn().mockResolvedValue({}) }),
    ).toBeUndefined();
    // The unrelated mapping (source tab 2) is untouched.
    expect(await getOpenViewTabId(2, store, { get: vi.fn().mockResolvedValue({}) })).toBe(200);
  });

  it("does nothing when the closed tab id has no recorded mapping", async () => {
    const store = new MemoryStore();
    await expect(clearMappingByViewTabId(999, store)).resolves.toBeUndefined();
  });
});
