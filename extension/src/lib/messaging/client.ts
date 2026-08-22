import type { EnrichmentResult } from "../deck/types";
import type { EligiblePrinting } from "../scryfall/client";
import type { DuelBanCategory } from "../banlist/commander-500-duel";
import type { BackgroundRequest, BackgroundResponse } from "./protocol";

function send<R extends BackgroundResponse>(request: BackgroundRequest): Promise<R> {
  return chrome.runtime.sendMessage(request) as Promise<R>;
}

/** Content-script-side client for the background service worker's card data access (task 2.3). */
export const backgroundClient = {
  async lookupCard(name: string): Promise<EnrichmentResult> {
    const response = await send<Extract<BackgroundResponse, { type: "lookupCard" }>>({
      type: "lookupCard",
      name,
    });
    return response.result;
  },

  async lookupEligiblePrintings(scryfallId: string): Promise<EligiblePrinting[] | undefined> {
    const response = await send<
      Extract<BackgroundResponse, { type: "lookupEligiblePrintings" }>
    >({ type: "lookupEligiblePrintings", scryfallId });
    return response.result;
  },

  async lookupDuelCategory(name: string): Promise<DuelBanCategory> {
    const response = await send<Extract<BackgroundResponse, { type: "lookupDuelCategory" }>>({
      type: "lookupDuelCategory",
      name,
    });
    return response.result;
  },
};

export type BackgroundClient = typeof backgroundClient;
