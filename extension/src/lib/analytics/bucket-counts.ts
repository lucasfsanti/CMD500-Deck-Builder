import type { DeckCard } from "../deck/types";
import {
  primaryType,
  colorGroupLabel,
  TYPE_ORDER,
  TYPE_DISPLAY_LABELS,
  COLOR_GROUP_DISPLAY_LABELS,
} from "../organizer/group-sort";
import { manaVarForColorLabel } from "../organizer/mana-colors";

export interface Bucket {
  label: string;
  count: number;
  /** Set only for colorBuckets() — the mana-identity CSS var to render this bucket's bar in. Curve/type buckets carry no color-identity meaning, so they're left unset and BarChart falls back to a neutral hue. */
  color?: string;
}

/** Only cards in the Main Deck zone count toward any deck-analytics chart. */
function mainDeckOnly(cards: DeckCard[]): DeckCard[] {
  return cards.filter((c) => c.zone === "mainDeck");
}

/**
 * Mana curve: card count by converted mana cost, counting each card's full
 * quantity (not once per distinct card). Cards whose CMC isn't resolved yet
 * are left out until their enrichment arrives, rather than guessed at 0.
 * Land cards are excluded entirely — a land's 0 CMC isn't the same fact a
 * free spell's 0 CMC is, and mixing them clutters the curve (task 12.6).
 */
export function manaCurveBuckets(cards: DeckCard[]): Bucket[] {
  const counts = new Map<number, number>();
  for (const card of mainDeckOnly(cards)) {
    const cmc = card.enrichment?.cmc;
    if (cmc === undefined) continue;
    if (primaryType(card.enrichment?.typeLine) === "Land") continue;
    counts.set(cmc, (counts.get(cmc) ?? 0) + card.quantity);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([cmc, count]) => ({ label: String(cmc), count }));
}

const LAND_LABEL = "Land";
const LAND_DISPLAY_LABEL = "Terrenos";

/**
 * Color distribution: non-land card count by color-identity group, using
 * the exact same classification as the deck organizer's own grouping, plus
 * a dedicated "Terrenos" bucket for every land card regardless of its own
 * color identity (a dual land's color identity isn't the same kind of fact
 * a spell's is — see design.md's Terrenos decision, task 12.6).
 */
export function colorBuckets(cards: DeckCard[]): Bucket[] {
  const counts = new Map<string, number>();
  for (const card of mainDeckOnly(cards)) {
    if (!card.enrichment) continue;
    const label =
      primaryType(card.enrichment.typeLine) === "Land"
        ? LAND_LABEL
        : colorGroupLabel(card.enrichment.colorIdentity);
    counts.set(label, (counts.get(label) ?? 0) + card.quantity);
  }
  const order = ["Colorless", "White", "Blue", "Black", "Red", "Green", "Multicolor", LAND_LABEL];
  return order
    .filter((label) => counts.has(label))
    .map((label) => ({
      label: label === LAND_LABEL ? LAND_DISPLAY_LABEL : (COLOR_GROUP_DISPLAY_LABELS[label] ?? label),
      count: counts.get(label)!,
      color: label === LAND_LABEL ? "var(--c500-mana-land)" : manaVarForColorLabel(label),
    }));
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
