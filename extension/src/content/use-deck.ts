import { useEffect, useRef, useState } from "react";
import { watchPage } from "../lib/capture/watch-deck-page";
import { parseDeckPage } from "../lib/capture/deck-page-parser";
import { parseCollectionPage } from "../lib/capture/collection-page-parser";
import { moveCard as moveCardInState, setCardQuantity } from "../lib/organizer/deck-state";
import { backgroundClient } from "../lib/messaging/client";
import { extractDeckId } from "../lib/deck/deck-id";
import { getStoredFormat, setStoredFormat } from "../lib/deck/format-storage";
import { ChromeLocalStore } from "../lib/scryfall/cache";
import type { LigaMagicPageKind } from "./page-detection";
import type { CapturedCard, DeckCard, Format, Zone } from "../lib/deck/types";

const formatStore = new ChromeLocalStore();

export type PageReadStatus = "reading" | "ok" | "unrecognized-page";

function toDeckCard(captured: CapturedCard): DeckCard {
  return { ...captured, enrichment: undefined, enrichmentStatus: "pending" };
}

// Caps how many enrichment lookups run at once. A full deck is ~100 cards;
// firing them all at once against Scryfall risks its fair-use rate limits.
const MAX_CONCURRENT_ENRICHMENT_LOOKUPS = 6;

/**
 * Owns the deck's live state for the panel: seeds it from the captured
 * LigaMagic page (via deck-page-capture), enriches each card from the
 * background service worker (card-data-service), and exposes the
 * organizer's move/quantity operations. Once the user makes a local edit,
 * further page re-captures are no longer applied — our panel becomes the
 * working copy, since nothing writes back to LigaMagic's own page.
 */
export function useDeck(root: (ParentNode & Node) | null, pageKind: LigaMagicPageKind) {
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [pageStatus, setPageStatus] = useState<PageReadStatus>("reading");
  const [format, setFormatState] = useState<Format>("commander500");
  const [zoneError, setZoneError] = useState<{ zone: Zone; message: string } | undefined>();
  const hasLocalEdits = useRef(false);
  const enriching = useRef(new Set<string>());
  const deckId = extractDeckId(new URL(window.location.href));

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
    if (!root || pageKind === "none") return;
    const parse = pageKind === "collection" ? parseCollectionPage : parseDeckPage;
    const stop = watchPage(root, parse, (result) => {
      if (result.status === "unrecognized-page") {
        setPageStatus("unrecognized-page");
        return;
      }
      setPageStatus("ok");
      if (hasLocalEdits.current) return;
      setCards(result.cards.map(toDeckCard));
    });
    return stop;
  }, [root, pageKind]);

  useEffect(() => {
    const pending = cards.filter(
      (c) => c.enrichmentStatus === "pending" && !enriching.current.has(c.id),
    );
    const slotsFree = MAX_CONCURRENT_ENRICHMENT_LOOKUPS - enriching.current.size;
    for (const card of pending.slice(0, Math.max(0, slotsFree))) {
      enriching.current.add(card.id);
      backgroundClient
        .lookupCard(card.name)
        .then((result) => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === card.id
                ? {
                    ...c,
                    enrichment: result.status === "ok" ? result.card : undefined,
                    enrichmentStatus: result.status,
                  }
                : c,
            ),
          );
        })
        .finally(() => enriching.current.delete(card.id));
    }
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

  return { cards, pageStatus, format, setFormat, zoneError, moveCard, setQuantity };
}
