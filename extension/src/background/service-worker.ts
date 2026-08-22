import { ScryfallClient } from "../lib/scryfall/client";
import { ChromeLocalStore } from "../lib/scryfall/cache";
import { lookupCommander500DuelCategory } from "../lib/banlist/commander-500-duel";
import type { BackgroundRequest, BackgroundResponse } from "../lib/messaging/protocol";

const scryfall = new ScryfallClient({ store: new ChromeLocalStore() });

export async function handleRequest(request: BackgroundRequest): Promise<BackgroundResponse> {
  switch (request.type) {
    case "lookupCard":
      return { type: "lookupCard", result: await scryfall.lookupCard(request.name) };
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
  }
}

// Guarded so this module can be imported under test without a real MV3 runtime.
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message: BackgroundRequest, _sender, sendResponse) => {
    handleRequest(message).then(sendResponse);
    return true; // keep the message channel open for the async response
  });
}
