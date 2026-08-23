import type { DeckCard } from "../deck/types";

export const CARD_COUNT_CAP = 99;

const CARD_COUNT_ZONES = new Set(["mainDeck", "comandanteParceiro"]);

/**
 * Whether a card counts toward the 99-card Commander limit: only Main Deck
 * and the partner commander (Comandante Parceiro) count — the primary
 * Comandante and Maybeboard don't occupy a deck slot. Unlike budget, basic
 * lands DO count here, since they occupy real deck slots under Commander's
 * rules.
 */
export function isCardCountCounted(card: DeckCard): boolean {
  return CARD_COUNT_ZONES.has(card.zone);
}

export interface CardCountResult {
  total: number;
  isOverCap: boolean;
  overAmount: number;
}

/**
 * Computes the deck's card count against Commander's 99-card limit, per
 * deck-size-limit's spec: counts only Main Deck and Comandante Parceiro,
 * summing each card's quantity.
 */
export function calculateCardCount(cards: DeckCard[]): CardCountResult {
  let total = 0;
  for (const card of cards) {
    if (!isCardCountCounted(card)) continue;
    total += card.quantity;
  }

  const isOverCap = total > CARD_COUNT_CAP;
  return {
    total,
    isOverCap,
    overAmount: isOverCap ? total - CARD_COUNT_CAP : 0,
  };
}
