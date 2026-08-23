import { detectLigaMagicPage } from "./page-detection";
import { watchPage } from "../lib/capture/watch-deck-page";
import { parseDeckPage } from "../lib/capture/deck-page-parser";
import { parseCollectionPage } from "../lib/capture/collection-page-parser";
import type { CaptureResult } from "../lib/capture/deck-page-parser";

/**
 * Capture-only: parses the page and relays each result to the background
 * service worker, which stores it for the deck-tab-view page to read. No UI
 * is mounted here anymore — per deck-tab-view's spec, all deck management
 * lives in the full-tab view opened via the extension's toolbar icon.
 */
export function relayCapture(result: CaptureResult): Promise<unknown> {
  return chrome.runtime.sendMessage({ type: "captureUpdate", result });
}

const pageKind = detectLigaMagicPage(new URL(window.location.href));
export const stopWatching =
  pageKind === "none"
    ? undefined
    : watchPage(document.body, pageKind === "collection" ? parseCollectionPage : parseDeckPage, relayCapture);
