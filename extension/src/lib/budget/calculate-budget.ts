import { isBasicLand, type DeckCard } from "../deck/types";

export const BUDGET_CAP = 500;

export interface BudgetResult {
  total: number;
  isOverCap: boolean;
  overAmount: number;
  isComplete: boolean;
  cardsMissingPrice: DeckCard[];
}

const COMMANDER_ZONES = new Set(["comandante", "comandanteParceiro"]);

/** Whether a card counts toward the Commander 500 budget total at all. */
export function isBudgetCounted(card: DeckCard): boolean {
  return !COMMANDER_ZONES.has(card.zone) && !isBasicLand(card.name);
}

/**
 * Computes the deck's Commander 500 budget total, per budget-tracking's
 * spec: excludes commander zones and basic lands, sums the lowest LigaMagic
 * price across remaining cards, and flags the total as incomplete rather
 * than silently treating an unresolved price as R$0.
 */
export function calculateBudget(cards: DeckCard[]): BudgetResult {
  let total = 0;
  const cardsMissingPrice: DeckCard[] = [];

  for (const card of cards) {
    if (!isBudgetCounted(card)) continue;

    if (card.pageLowestPrice === undefined) {
      cardsMissingPrice.push(card);
      continue;
    }
    total += card.pageLowestPrice * card.quantity;
  }

  const isOverCap = total > BUDGET_CAP;
  return {
    total,
    isOverCap,
    overAmount: isOverCap ? total - BUDGET_CAP : 0,
    isComplete: cardsMissingPrice.length === 0,
    cardsMissingPrice,
  };
}
