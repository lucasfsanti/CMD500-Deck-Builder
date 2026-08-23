import type { KeyValueStore } from "../scryfall/cache";

const FORWARD_PREFIX = "view-tab"; // sourceTabId -> viewTabId
const REVERSE_PREFIX = "source-tab"; // viewTabId -> sourceTabId

function forwardKey(sourceTabId: number): string {
  return `${FORWARD_PREFIX}:${sourceTabId}`;
}

function reverseKey(viewTabId: number): string {
  return `${REVERSE_PREFIX}:${viewTabId}`;
}

export async function setViewTabId(
  sourceTabId: number,
  viewTabId: number,
  store: KeyValueStore,
): Promise<void> {
  await store.set(forwardKey(sourceTabId), viewTabId);
  await store.set(reverseKey(viewTabId), sourceTabId);
}

export async function clearViewTabId(sourceTabId: number, store: KeyValueStore): Promise<void> {
  const viewTabId = await store.get(forwardKey(sourceTabId));
  await store.remove(forwardKey(sourceTabId));
  if (typeof viewTabId === "number") {
    await store.remove(reverseKey(viewTabId));
  }
}

/**
 * Returns the source tab's open view-tab id, if one is recorded AND that tab
 * is confirmed still open (via chrome.tabs.get). A stale mapping — recorded
 * but the user closed the view tab directly, without going through
 * chrome.tabs.onRemoved — is treated as absent and cleared, so the icon
 * click handler always makes an accurate focus-vs-create decision even if
 * the service worker was suspended and missed the removal event.
 */
export async function getOpenViewTabId(
  sourceTabId: number,
  store: KeyValueStore,
  tabsApi: Pick<typeof chrome.tabs, "get"> = chrome.tabs,
): Promise<number | undefined> {
  const stored = await store.get(forwardKey(sourceTabId));
  if (typeof stored !== "number") return undefined;

  try {
    await tabsApi.get(stored);
    return stored;
  } catch {
    await clearViewTabId(sourceTabId, store);
    return undefined;
  }
}

/**
 * Clears the mapping entry whose view tab is the given (now-closed) tab id,
 * looked up directly via the reverse index rather than requiring the caller
 * to enumerate every known source tab.
 */
export async function clearMappingByViewTabId(
  closedViewTabId: number,
  store: KeyValueStore,
): Promise<void> {
  const sourceTabId = await store.get(reverseKey(closedViewTabId));
  if (typeof sourceTabId !== "number") return;
  await store.remove(forwardKey(sourceTabId));
  await store.remove(reverseKey(closedViewTabId));
}
