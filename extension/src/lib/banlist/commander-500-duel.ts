import rawData from "./commander-500-duel-data.json";
import { normalizeCardName } from "../scryfall/normalize-name";

export type DuelBanCategory =
  | "banned-in-deck"
  | "banned-as-commander"
  | "banned-as-companion"
  | "banned-for-offensive-content"
  | "unrestricted";

interface DuelBanlistData {
  asOf: string;
  source: string;
  bannedAsCompanion: string[];
  bannedAsCommander: string[];
  bannedInDeck: string[];
  bannedForOffensiveContent: string[];
}

const data = rawData as DuelBanlistData;

function toLookup(names: string[]): ReadonlySet<string> {
  return new Set(names.map((name) => normalizeCardName(name).toLowerCase()));
}

const bannedAsCompanion = toLookup(data.bannedAsCompanion);
const bannedAsCommander = toLookup(data.bannedAsCommander);
// Offensive-content cards can't be used anywhere in the deck, so they fold into
// the in-deck-banned lookup; the source list is kept separately in the bundled
// dataset for transparency about why a given card is banned.
const bannedInDeck = toLookup([...data.bannedInDeck, ...data.bannedForOffensiveContent]);

/** The date (from the bundled dataset) this Commander 500 Duel banlist snapshot reflects. */
export const commander500DuelBanlistAsOf = data.asOf;
export const commander500DuelBanlistSource = data.source;

/**
 * Looks up a card's Commander 500 Duel ban category from the bundled dataset.
 * Purely offline — no network call, per card-data-service's bundled-dataset design.
 */
export function lookupCommander500DuelCategory(cardName: string): DuelBanCategory {
  const key = normalizeCardName(cardName).toLowerCase();
  if (bannedAsCompanion.has(key)) return "banned-as-companion";
  if (bannedInDeck.has(key)) return "banned-in-deck";
  if (bannedAsCommander.has(key)) return "banned-as-commander";
  return "unrestricted";
}
