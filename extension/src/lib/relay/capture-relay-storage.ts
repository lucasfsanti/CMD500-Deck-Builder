import type { KeyValueStore } from "../scryfall/cache";
import type { CaptureResult } from "../capture/deck-page-parser";

const KEY_PREFIX = "capture";

/**
 * Stores/reads the latest capture result for a given source tab, relaying it
 * from the content script (which has DOM access but no longer renders any
 * UI) to the deck-tab-view page (which has no DOM access to the source tab
 * at all), per deck-tab-view's relay design.
 */
export async function setCapturedResult(
  sourceTabId: number,
  result: CaptureResult,
  store: KeyValueStore,
): Promise<void> {
  await store.set(`${KEY_PREFIX}:${sourceTabId}`, result);
}

export async function getCapturedResult(
  sourceTabId: number,
  store: KeyValueStore,
): Promise<CaptureResult | undefined> {
  const value = await store.get(`${KEY_PREFIX}:${sourceTabId}`);
  return value as CaptureResult | undefined;
}

/** The storage key a captured result for a given source tab is stored under, for onChanged listeners. */
export function capturedResultKey(sourceTabId: number): string {
  return `${KEY_PREFIX}:${sourceTabId}`;
}
