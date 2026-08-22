import type { EnrichmentResult } from "../deck/types";
import type { EligiblePrinting } from "../scryfall/client";
import type { DuelBanCategory } from "../banlist/commander-500-duel";

export type BackgroundRequest =
  | { type: "lookupCard"; name: string }
  | { type: "lookupEligiblePrintings"; scryfallId: string }
  | { type: "lookupDuelCategory"; name: string };

export type BackgroundResponse =
  | { type: "lookupCard"; result: EnrichmentResult }
  | { type: "lookupEligiblePrintings"; result: EligiblePrinting[] | undefined }
  | { type: "lookupDuelCategory"; result: DuelBanCategory };
