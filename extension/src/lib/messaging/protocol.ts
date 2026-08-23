import type { EnrichmentResult } from "../deck/types";
import type { EligiblePrinting } from "../scryfall/client";
import type { DuelBanCategory } from "../banlist/commander-500-duel";
import type { CaptureResult } from "../capture/deck-page-parser";

export type BackgroundRequest =
  | { type: "lookupCard"; name: string }
  | { type: "lookupCards"; names: string[] }
  | { type: "lookupEligiblePrintings"; scryfallId: string }
  | { type: "lookupDuelCategory"; name: string }
  | { type: "captureUpdate"; result: CaptureResult };

export type BackgroundResponse =
  | { type: "lookupCard"; result: EnrichmentResult }
  | { type: "lookupCards"; results: Record<string, EnrichmentResult> }
  | { type: "lookupEligiblePrintings"; result: EligiblePrinting[] | undefined }
  | { type: "lookupDuelCategory"; result: DuelBanCategory }
  | { type: "captureUpdate"; ok: true };
