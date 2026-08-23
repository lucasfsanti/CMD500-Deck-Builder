import { ScryfallClient } from "../lib/scryfall/client";
import { ChromeLocalStore, ChromeSessionStore } from "../lib/scryfall/cache";
import { lookupCommander500DuelCategory } from "../lib/banlist/commander-500-duel";
import { setCapturedResult } from "../lib/relay/capture-relay-storage";
import { clearMappingByViewTabId, getOpenViewTabId, setViewTabId } from "../lib/relay/view-tab-mapping";
import { detectLigaMagicPage } from "../content/page-detection";
import { extractDeckId } from "../lib/deck/deck-id";
import type { BackgroundRequest, BackgroundResponse } from "../lib/messaging/protocol";

const scryfall = new ScryfallClient({ store: new ChromeLocalStore() });
const sessionStore = new ChromeSessionStore();

export async function handleRequest(
  request: BackgroundRequest,
  senderTabId?: number,
): Promise<BackgroundResponse> {
  switch (request.type) {
    case "lookupCard":
      return { type: "lookupCard", result: await scryfall.lookupCard(request.name) };
    case "lookupCards":
      return {
        type: "lookupCards",
        results: Object.fromEntries(await scryfall.lookupCards(request.names)),
      };
    case "lookupEligiblePrintings":
      return {
        type: "lookupEligiblePrintings",
        result: await scryfall.lookupEligiblePrintings(request.scryfallId),
      };
    case "lookupDuelCategory":
      return {
        type: "lookupDuelCategory",
        result: lookupCommander500DuelCategory(request.name),
      };
    case "captureUpdate":
      // senderTabId is the LigaMagic tab the content script is running in —
      // always present for a message from a content script, never for one
      // sent by an extension page (which has no associated tab).
      if (senderTabId !== undefined) {
        await setCapturedResult(senderTabId, request.result, sessionStore);
      }
      return { type: "captureUpdate", ok: true };
  }
}

/** Clears a source tab's view-tab mapping when that view tab is closed directly by the user. */
export async function handleTabRemoved(closedTabId: number): Promise<void> {
  await clearMappingByViewTabId(closedTabId, sessionStore);
}

export interface ActionClickTabsApi {
  get: typeof chrome.tabs.get;
  create: typeof chrome.tabs.create;
  update: typeof chrome.tabs.update;
}

export interface ActionClickWindowsApi {
  update: typeof chrome.windows.update;
}

/**
 * Handles a toolbar-icon click, per deck-tab-view's spec: no-op unless the
 * active tab is a LigaMagic deck/collection page; otherwise focuses that
 * source tab's existing view tab (and its window) if one is open, or opens
 * a new one scoped to it via a `sourceTabId` URL param.
 */
export async function handleActionClicked(
  tab: { id?: number; url?: string },
  tabsApi: ActionClickTabsApi = chrome.tabs,
  windowsApi: ActionClickWindowsApi = chrome.windows,
  getURL: typeof chrome.runtime.getURL = chrome.runtime.getURL,
): Promise<void> {
  if (tab.id === undefined || tab.url === undefined) return;
  const pageKind = detectLigaMagicPage(new URL(tab.url));
  if (pageKind === "none") return;

  const existingViewTabId = await getOpenViewTabId(tab.id, sessionStore, tabsApi);
  if (existingViewTabId !== undefined) {
    const viewTab = await tabsApi.get(existingViewTabId);
    await tabsApi.update(existingViewTabId, { active: true });
    if (viewTab.windowId !== undefined) {
      await windowsApi.update(viewTab.windowId, { focused: true });
    }
    return;
  }

  // The tab-view page's own URL is our extension's tab.html, not LigaMagic's
  // — it has no way to derive the deck id itself, so it's resolved here
  // (where the real source URL is available) and passed through.
  const deckId = extractDeckId(new URL(tab.url));
  const params = new URLSearchParams({ sourceTabId: String(tab.id) });
  if (deckId) params.set("deckId", deckId);

  const newTab = await tabsApi.create({ url: getURL(`tab.html?${params.toString()}`) });
  if (newTab.id !== undefined) {
    await setViewTabId(tab.id, newTab.id, sessionStore);
  }
}

// Guarded so this module can be imported under test without a real MV3 runtime.
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: BackgroundRequest, sender, sendResponse) => {
    handleRequest(message, sender.tab?.id).then(sendResponse);
    return true; // keep the message channel open for the async response
  });
}

if (typeof chrome !== "undefined" && chrome.tabs?.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    handleTabRemoved(tabId);
  });
}

if (typeof chrome !== "undefined" && chrome.action?.onClicked) {
  chrome.action.onClicked.addListener((tab) => {
    handleActionClicked(tab);
  });
}
