import type { DeckCard, Zone } from "../deck/types";

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
  if (!card) return { cards, error: "Card not found." };
  if (card.zone === toZone) return { cards };

  if (COMMANDER_ZONES.has(toZone)) {
    const occupant = cards.find((c) => c.zone === toZone && c.id !== cardId);
    if (occupant) {
      return {
        cards,
        error: `${COMMANDER_ZONE_LABEL[toZone]} already has a commander. Only a partner commander may be added, and only in the Comandante Parceiro slot.`,
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
