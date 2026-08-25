import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { KeyValueStore } from "../lib/scryfall/cache";
import { useThemePreference } from "./use-theme-preference";

function makeStore(initial?: "light" | "dark"): KeyValueStore {
  const data = new Map<string, unknown>();
  if (initial) data.set("c500ThemePreference", initial);
  return {
    async get(key) {
      return data.get(key);
    },
    async set(key, value) {
      data.set(key, value);
    },
    async remove(key) {
      data.delete(key);
    },
  };
}

function stubMatchMedia(initialMatches: boolean) {
  const listeners: Array<(event: MediaQueryListEvent) => void> = [];
  const mql = {
    matches: initialMatches,
    addEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) => listeners.push(fn),
    removeEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    },
  } as unknown as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql));
  return { fireChange: (matches: boolean) => listeners.forEach((fn) => fn({ matches } as MediaQueryListEvent)) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

describe("useThemePreference (task 2.1/2.2)", () => {
  it("uses the stored preference over the OS preference", async () => {
    stubMatchMedia(false); // OS prefers dark
    const store = makeStore("light");

    const { result } = renderHook(() => useThemePreference(store));

    await waitFor(() => expect(result.current.theme).toBe("light"));
  });

  it("falls back to the OS preference when nothing is stored (OS prefers light)", () => {
    stubMatchMedia(true); // OS prefers light
    const store = makeStore();

    const { result } = renderHook(() => useThemePreference(store));

    expect(result.current.theme).toBe("light");
  });

  it("falls back to the OS preference when nothing is stored (OS prefers dark)", () => {
    stubMatchMedia(false); // OS prefers dark
    const store = makeStore();

    const { result } = renderHook(() => useThemePreference(store));

    expect(result.current.theme).toBe("dark");
  });

  it("falls back to dark when neither a stored preference nor matchMedia is available", () => {
    vi.stubGlobal("matchMedia", undefined);
    const store = makeStore();

    const { result } = renderHook(() => useThemePreference(store));

    expect(result.current.theme).toBe("dark");
  });

  it("updates document.documentElement.dataset.theme synchronously when setTheme is called", () => {
    stubMatchMedia(false);
    const store = makeStore();
    const { result } = renderHook(() => useThemePreference(store));

    act(() => result.current.setTheme("light"));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(result.current.theme).toBe("light");
  });

  it("stops tracking OS changes once a manual choice has been made", () => {
    const { fireChange } = stubMatchMedia(false);
    const store = makeStore();
    const { result } = renderHook(() => useThemePreference(store));

    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");

    act(() => fireChange(true)); // OS switches to light after the manual choice
    expect(result.current.theme).toBe("dark");
  });
});
