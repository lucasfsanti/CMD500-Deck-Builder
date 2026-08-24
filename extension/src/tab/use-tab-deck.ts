import { useEffect, useRef, useState } from "react";
import { useRelayedCapture } from "./use-relayed-capture";
import { moveCard as moveCardInState, setCardQuantity, removeCard as removeCardInState } from "../lib/organizer/deck-state";
import { backgroundClient } from "../lib/messaging/client";
import { getStoredFormat, setStoredFormat } from "../lib/deck/format-storage";
import { ChromeLocalStore } from "../lib/scryfall/cache";
import { isBasicLand, type CapturedCard, type DeckCard, type Format, type Zone } from "../lib/deck/types";

const formatStore = new ChromeLocalStore();

export type PageReadStatus = "reading" | "ok" | "unrecognized-page";

/**
 * Commander is singleton outside basic lands, so a non-basic card's quantity
 * is always 1 regardless of what the source LigaMagic page reports — applied
 * here so it holds on both first capture and any later re-sync.
 */
function toDeckCard(captured: CapturedCard): DeckCard {
  const quantity = isBasicLand(captured.name) ? captured.quantity : 1;
  return { ...captured, quantity, enrichment: undefined, enrichmentStatus: "pending" };
}

/**
 * Owns the deck-tab-view's live state: sources captured deck data from the
 * relay (see use-relayed-capture) instead of watching a local DOM, enriches
 * each card from the background service worker, and exposes the same
 * organizer move/quantity operations and per-deck format persistence the
 * in-page panel used to. Once the user makes a local edit, further relayed
 * captures are no longer applied — the tab becomes the working copy, same
 * as before.
 */
export function useTabDeck(sourceTabId: number | undefined, deckId: string | undefined) {
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [format, setFormatState] = useState<Format>("commander500");
  const [zoneError, setZoneError] = useState<{ zone: Zone; message: string } | undefined>();
  const hasLocalEdits = useRef(false);
  const enriching = useRef(new Set<string>());

  const captured = useRelayedCapture(sourceTabId);
  const pageStatus: PageReadStatus = !captured
    ? "reading"
    : captured.status === "unrecognized-page"
      ? "unrecognized-page"
      : "ok";

  // Format is stored per deck (format-legality spec) so it survives reloads.
  useEffect(() => {
    if (!deckId) return;
    getStoredFormat(deckId, formatStore).then((stored) => {
      if (stored) setFormatState(stored);
    });
  }, [deckId]);

  function setFormat(next: Format) {
    setFormatState(next);
    if (deckId) setStoredFormat(deckId, next, formatStore);
  }

  useEffect(() => {
    if (!captured || captured.status !== "ok") return;
    if (hasLocalEdits.current) return;
    setCards(captured.cards.map(toDeckCard));
  }, [captured]);

  // Requests every pending card's enrichment in one batched call (the
  // Scryfall client chunks internally), rather than a fixed-concurrency
  // streaming loop — a full deck resolves in a handful of requests instead
  // of one per card.
  useEffect(() => {
    const pending = cards.filter(
      (c) => c.enrichmentStatus === "pending" && !enriching.current.has(c.id),
    );
    if (pending.length === 0) return;

    for (const card of pending) enriching.current.add(card.id);

    backgroundClient
      .lookupCards(pending.map((c) => c.name))
      .then((resultsByName) => {
        setCards((prev) =>
          prev.map((c) => {
            const result = resultsByName[c.name];
            if (!result) return c;
            return {
              ...c,
              enrichment: result.status === "ok" ? result.card : undefined,
              enrichmentStatus: result.status,
            };
          }),
        );
      })
      .finally(() => {
        for (const card of pending) enriching.current.delete(card.id);
      });
  }, [cards]);

  function moveCard(cardId: string, toZone: Zone) {
    hasLocalEdits.current = true;
    const result = moveCardInState(cards, cardId, toZone);
    if (result.error) {
      setZoneError({ zone: toZone, message: result.error });
      return;
    }
    setZoneError(undefined);
    setCards(result.cards);
  }

  function setQuantity(cardId: string, quantity: number) {
    hasLocalEdits.current = true;
    setCards((prev) => setCardQuantity(prev, cardId, quantity));
  }

  function removeCard(cardId: string) {
    hasLocalEdits.current = true;
    setCards((prev) => removeCardInState(prev, cardId));
  }

  return { cards, pageStatus, format, setFormat, zoneError, moveCard, setQuantity, removeCard };
}
