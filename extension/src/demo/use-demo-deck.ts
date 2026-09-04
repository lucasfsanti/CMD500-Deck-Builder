import { useState } from "react";
import {
  moveCard as moveCardInState,
  setCardQuantity,
  setCardPrice,
  removeCard as removeCardInState,
  reorderWithinGroup as reorderWithinGroupInState,
  clearCustomOrder as clearCustomOrderInState,
} from "../lib/organizer/deck-state";
import type { DeckCard, Format, GroupingAxis, Zone } from "../lib/deck/types";
import { buildMockDeck } from "./mock-deck";

/**
 * Same read/write surface as `useTabDeck` (extension/src/tab/use-tab-deck.ts),
 * but seeded from the static offline mock decklist instead of a relayed
 * LigaMagic capture + Scryfall enrichment — this is what makes the GitHub
 * Pages demo interactive (drag-and-drop, quantity/price edits, format
 * switch) without any chrome.* API or network dependency.
 */
export function useDemoDeck() {
  const [cards, setCards] = useState<DeckCard[]>(() => buildMockDeck());
  const [format, setFormat] = useState<Format>("commander500");
  const [zoneError, setZoneError] = useState<{ zone: Zone; message: string } | undefined>();

  function moveCard(cardId: string, toZone: Zone) {
    const result = moveCardInState(cards, cardId, toZone);
    if (result.error) {
      setZoneError({ zone: toZone, message: result.error });
      return;
    }
    setZoneError(undefined);
    setCards(result.cards);
  }

  function setQuantity(cardId: string, quantity: number) {
    setCards((prev) => setCardQuantity(prev, cardId, quantity));
  }

  function setPrice(cardId: string, price: number | undefined) {
    setCards((prev) => setCardPrice(prev, cardId, price));
  }

  function removeCard(cardId: string) {
    setCards((prev) => removeCardInState(prev, cardId));
  }

  function reorderWithinGroup(groupingAxis: GroupingAxis, groupKey: string, orderedCardIds: string[]) {
    setCards((prev) => reorderWithinGroupInState(prev, groupingAxis, groupKey, orderedCardIds));
  }

  function clearCustomOrder() {
    setCards((prev) => clearCustomOrderInState(prev));
  }

  return {
    cards,
    pageStatus: "ok" as const,
    format,
    setFormat,
    zoneError,
    moveCard,
    setQuantity,
    setPrice,
    removeCard,
    reorderWithinGroup,
    clearCustomOrder,
  };
}
