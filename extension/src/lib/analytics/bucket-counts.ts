import type { DeckCard } from "../deck/types";
import {
  primaryType,
  colorGroupLabel,
  TYPE_ORDER,
  TYPE_DISPLAY_LABELS,
  COLOR_GROUP_DISPLAY_LABELS,
} from "../organizer/group-sort";

export interface Bucket {
  label: string;
  count: number;
}

/** Only cards in the Main Deck zone count toward any deck-analytics chart. */
function mainDeckOnly(cards: DeckCard[]): DeckCard[] {
  return cards.filter((c) => c.zone === "mainDeck");
}

/**
 * Mana curve: card count by converted mana cost, counting each card's full
 * quantity (not once per distinct card). Cards whose CMC isn't resolved yet
 * are left out until their enrichment arrives, rather than guessed at 0.
 */
export function manaCurveBuckets(cards: DeckCard[]): Bucket[] {
  const counts = new Map<number, number>();
  for (const card of mainDeckOnly(cards)) {
    const cmc = card.enrichment?.cmc;
    if (cmc === undefined) continue;
    counts.set(cmc, (counts.get(cmc) ?? 0) + card.quantity);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([cmc, count]) => ({ label: String(cmc), count }));
}

/**
 * Color distribution: card count by color-identity group, using the exact
 * same classification as the deck organizer's own grouping.
 */
export function colorBuckets(cards: DeckCard[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const card of mainDeckOnly(cards)) {
    if (!card.enrichment) continue;
    const label = colorGroupLabel(card.enrichment.colorIdentity);
    counts.set(label, (counts.get(label) ?? 0) + card.quantity);
  }
  const order = ["Colorless", "White", "Blue", "Black", "Red", "Green", "Multicolor"];
  return order
    .filter((label) => counts.has(label))
    .map((label) => ({ label: COLOR_GROUP_DISPLAY_LABELS[label] ?? label, count: counts.get(label)! }));
}

/**
 * Type distribution: card count by primary type, using the exact same
 * classification as the deck organizer's own grouping.
 */
export function typeBuckets(cards: DeckCard[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const card of mainDeckOnly(cards)) {
    // Excluded (not bucketed as "Other") until enrichment resolves, so "Other"
    // stays a meaningful type bucket rather than a stand-in for "unknown yet".
    if (!card.enrichment) continue;
    const label = primaryType(card.enrichment.typeLine);
    counts.set(label, (counts.get(label) ?? 0) + card.quantity);
  }
  return TYPE_ORDER.filter((label) => counts.has(label)).map((label) => ({
    label: TYPE_DISPLAY_LABELS[label],
    count: counts.get(label)!,
  }));
}
