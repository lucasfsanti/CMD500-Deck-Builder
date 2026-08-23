import { useEffect, useState } from "react";
import { getCapturedResult, capturedResultKey } from "../lib/relay/capture-relay-storage";
import { ChromeSessionStore } from "../lib/scryfall/cache";
import type { CaptureResult } from "../lib/capture/deck-page-parser";

const sessionStore = new ChromeSessionStore();

/** Reads the numeric `sourceTabId` param from the tab-view page's own URL. */
export function getSourceTabIdFromUrl(url: URL): number | undefined {
  const raw = url.searchParams.get("sourceTabId");
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Reads the `deckId` param from the tab-view page's own URL. The tab page's
 * own location is our extension's tab.html, not LigaMagic's, so it can't
 * derive this itself — the background resolves it once (where the real
 * source tab URL is available) and passes it through when opening the tab.
 */
export function getDeckIdFromUrl(url: URL): string | undefined {
  return url.searchParams.get("deckId") ?? undefined;
}

/**
 * Reads the source tab's latest capture result from the relay (populated by
 * the background from the content script's captures) and stays live-synced
 * via chrome.storage.onChanged, per deck-tab-view's live-sync requirement.
 */
export function useRelayedCapture(sourceTabId: number | undefined): CaptureResult | undefined {
  const [result, setResult] = useState<CaptureResult | undefined>(undefined);

  useEffect(() => {
    if (sourceTabId === undefined) return;
    let cancelled = false;

    getCapturedResult(sourceTabId, sessionStore).then((initial) => {
      if (!cancelled) setResult(initial);
    });

    const key = capturedResultKey(sourceTabId);
    function onChanged(
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void {
      if (areaName !== "session") return;
      const change = changes[key];
      if (change) setResult(change.newValue as CaptureResult | undefined);
    }

    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, [sourceTabId]);

  return result;
}
