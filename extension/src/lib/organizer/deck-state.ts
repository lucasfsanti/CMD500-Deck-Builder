import type { DeckCard, GroupingAxis, Zone } from "../deck/types";

export interface MoveResult {
  cards: DeckCard[];
  error?: string;
}

const COMMANDER_ZONES: ReadonlySet<Zone> = new Set(["comandante", "comandanteParceiro"]);
const COMMANDER_ZONE_LABEL: Record<string, string> = {
  comandante: "Comandante",
  comandanteParceiro: "Comandante Parceiro",
};

/**
 * Moves a card to a new zone, per deck-organizer's drag-and-drop and
 * commander-cardinality requirements. Comandante and Comandante Parceiro
 * each accept at most one card; a drop that would exceed that is rejected
 * with an explanatory message and the deck is returned unchanged.
 */
export function moveCard(cards: DeckCard[], cardId: string, toZone: Zone): MoveResult {
  const card = cards.find((c) => c.id === cardId);
  if (!card) return { cards, error: "Carta não encontrada." };
  if (card.zone === toZone) return { cards };

  if (COMMANDER_ZONES.has(toZone)) {
    const occupant = cards.find((c) => c.zone === toZone && c.id !== cardId);
    if (occupant) {
      return {
        cards,
        error: `${COMMANDER_ZONE_LABEL[toZone]} já tem um comandante. Apenas um comandante parceiro pode ser adicionado, e somente no slot Comandante Parceiro.`,
      };
    }
  }

  return {
    cards: cards.map((c) => (c.id === cardId ? { ...c, zone: toZone } : c)),
  };
}

/** Updates a card's quantity, per deck-organizer's manual-quantity-edit requirement. */
export function setCardQuantity(cards: DeckCard[], cardId: string, quantity: number): DeckCard[] {
  const safeQuantity = Math.max(0, Math.floor(quantity));
  return cards.map((c) => (c.id === cardId ? { ...c, quantity: safeQuantity } : c));
}

/**
 * Updates a card's price, per deck-organizer's manual-price-edit requirement.
 * A negative or NaN value is rejected outright, leaving the deck unchanged,
 * rather than clamped like setCardQuantity does — there's no sensible
 * "closest valid price" to fall back to.
 */
export function setCardPrice(cards: DeckCard[], cardId: string, price: number | undefined): DeckCard[] {
  if (price !== undefined && (Number.isNaN(price) || price < 0)) return cards;
  return cards.map((c) => (c.id === cardId ? { ...c, pageLowestPrice: price } : c));
}

/** Removes a card from the deck entirely, per deck-organizer's explicit-card-removal requirement. */
export function removeCard(cards: DeckCard[], cardId: string): DeckCard[] {
  return cards.filter((c) => c.id !== cardId);
}

/**
 * Stamps a fresh custom order onto a group, per deck-organizer's
 * custom-group-order requirement: every card whose id appears in
 * `orderedCardIds` is given a `customOrder` matching its index there, scoped
 * to `groupingAxis`/`groupKey` so it only takes effect while that exact
 * group is being rendered (see group-sort.ts's sortWithinGroup). Cards not
 * named in `orderedCardIds` are left untouched. Calling this again for the
 * same group overwrites its previous ranks with the new sequence.
 */
export function reorderWithinGroup(
  cards: DeckCard[],
  groupingAxis: GroupingAxis,
  groupKey: string,
  orderedCardIds: string[],
): DeckCard[] {
  const rankById = new Map(orderedCardIds.map((id, index) => [id, index]));
  return cards.map((c) => {
    const rank = rankById.get(c.id);
    if (rank === undefined) return c;
    return { ...c, customOrder: { axis: groupingAxis, groupKey, rank } };
  });
}

/**
 * Clears every card's custom order deck-wide, per deck-organizer's
 * custom-group-order requirement: reverts every group to being sorted by
 * the active sort axis, regardless of which grouping axis or group each
 * card's order was stamped under.
 */
export function clearCustomOrder(cards: DeckCard[]): DeckCard[] {
  return cards.map((c) => {
    if (c.customOrder === undefined) return c;
    const { customOrder: _customOrder, ...rest } = c;
    return rest;
  });
}
