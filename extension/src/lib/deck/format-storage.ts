import type { KeyValueStore } from "../scryfall/cache";
import type { Format } from "./types";

const KEY_PREFIX = "deck-format";

/** Persists a deck's chosen format (Commander 500 / Commander 500 Duel) per format-legality's spec. */
export async function getStoredFormat(
  deckId: string,
  store: KeyValueStore,
): Promise<Format | undefined> {
  const value = await store.get(`${KEY_PREFIX}:${deckId}`);
  return value === "commander500" || value === "commander500Duel" ? value : undefined;
}

export async function setStoredFormat(
  deckId: string,
  format: Format,
  store: KeyValueStore,
): Promise<void> {
  await store.set(`${KEY_PREFIX}:${deckId}`, format);
}
