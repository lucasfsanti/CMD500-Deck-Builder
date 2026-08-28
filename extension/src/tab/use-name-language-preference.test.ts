import { describe, expect, it } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { KeyValueStore } from "../lib/scryfall/cache";
import { useNameLanguagePreference } from "./use-name-language-preference";

function makeStore(initial?: "en" | "pt"): KeyValueStore {
  const data = new Map<string, unknown>();
  if (initial) data.set("c500NameLanguagePreference", initial);
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

describe("useNameLanguagePreference (card-name-language spec)", () => {
  it("defaults to English when nothing is stored", () => {
    const store = makeStore();
    const { result } = renderHook(() => useNameLanguagePreference(store));

    expect(result.current.language).toBe("en");
  });

  it("uses a previously stored preference over the default", async () => {
    const store = makeStore("pt");
    const { result } = renderHook(() => useNameLanguagePreference(store));

    await waitFor(() => expect(result.current.language).toBe("pt"));
  });

  it("persists a manual choice via setLanguage", async () => {
    const store = makeStore();
    const { result } = renderHook(() => useNameLanguagePreference(store));

    act(() => result.current.setLanguage("pt"));

    expect(result.current.language).toBe("pt");
    await waitFor(async () => expect(await store.get("c500NameLanguagePreference")).toBe("pt"));
  });

  it("a second hook instance backed by the same store reflects a previously persisted choice", async () => {
    const store = makeStore();
    const { result: first } = renderHook(() => useNameLanguagePreference(store));
    act(() => first.current.setLanguage("pt"));

    const { result: second } = renderHook(() => useNameLanguagePreference(store));

    await waitFor(() => expect(second.current.language).toBe("pt"));
  });
});
