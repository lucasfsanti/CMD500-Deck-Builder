import type { DeckCard, Format } from "../deck/types";
import { lookupCommander500DuelCategory } from "../banlist/commander-500-duel";

const COMMANDER_ZONES = new Set(["comandante", "comandanteParceiro"]);

export interface LegalityResult {
  /** "unknown" only applies to Commander 500, whose legality depends on a live Scryfall lookup. */
  status: "ok" | "unknown";
  illegalCardIds: ReadonlySet<string>;
}

function checkCommander500(cards: DeckCard[]): LegalityResult {
  const illegalCardIds = new Set<string>();
  // "pending" (still loading) counts as unresolved too, not just
  // "unavailable" (gave up) — otherwise the panel could briefly report a
  // confident "no illegal cards" before every card has actually been
  // checked, which is exactly the false-legal-by-default the spec forbids.
  let anyUnresolved = false;

  for (const card of cards) {
    if (card.enrichmentStatus === "pending" || card.enrichmentStatus === "unavailable") {
      anyUnresolved = true;
      continue;
    }
    if (card.enrichment && !card.enrichment.legalInCommander) {
      illegalCardIds.add(card.id);
    }
  }

  return { status: anyUnresolved ? "unknown" : "ok", illegalCardIds };
}

function checkCommander500Duel(cards: DeckCard[]): LegalityResult {
  const illegalCardIds = new Set<string>();

  for (const card of cards) {
    const category = lookupCommander500DuelCategory(card.name);
    const isInCommanderZone = COMMANDER_ZONES.has(card.zone);

    if (category === "banned-in-deck" || category === "banned-as-companion") {
      illegalCardIds.add(card.id);
    } else if (category === "banned-as-commander" && isInCommanderZone) {
      illegalCardIds.add(card.id);
    }
  }

  // Bundled dataset: always available offline, never "unknown".
  return { status: "ok", illegalCardIds };
}

/**
 * Checks every card in the deck against the active format's banlist, per
 * format-legality's spec: Commander 500 reads Scryfall's live per-card
 * Commander legality; Commander 500 Duel reads the bundled offline dataset,
 * including the banned-as-commander-only distinction for the commander zones.
 */
export function checkLegality(cards: DeckCard[], format: Format): LegalityResult {
  return format === "commander500" ? checkCommander500(cards) : checkCommander500Duel(cards);
}
