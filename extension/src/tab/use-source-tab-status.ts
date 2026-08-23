import { useEffect, useState } from "react";

export type SourceTabStatus = "unknown" | "open" | "closed";

export interface TabsStatusApi {
  get: typeof chrome.tabs.get;
  onRemoved: {
    addListener: typeof chrome.tabs.onRemoved.addListener;
    removeListener: typeof chrome.tabs.onRemoved.removeListener;
  };
}

/**
 * Tracks whether the source LigaMagic tab is still open, per deck-tab-view's
 * degrade-gracefully requirement: an initial chrome.tabs.get check, then a
 * live chrome.tabs.onRemoved subscription so the view updates the moment the
 * source tab closes, without polling.
 */
export function useSourceTabStatus(
  sourceTabId: number | undefined,
  tabsApi: TabsStatusApi = chrome.tabs,
): SourceTabStatus {
  const [status, setStatus] = useState<SourceTabStatus>("unknown");

  useEffect(() => {
    if (sourceTabId === undefined) return;
    let cancelled = false;

    tabsApi
      .get(sourceTabId)
      .then(() => {
        if (!cancelled) setStatus("open");
      })
      .catch(() => {
        if (!cancelled) setStatus("closed");
      });

    function onRemoved(closedTabId: number): void {
      if (closedTabId === sourceTabId) setStatus("closed");
    }
    tabsApi.onRemoved.addListener(onRemoved);
    return () => {
      cancelled = true;
      tabsApi.onRemoved.removeListener(onRemoved);
    };
  }, [sourceTabId, tabsApi]);

  return status;
}
