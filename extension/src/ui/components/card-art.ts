import type { DeckCard } from "../../lib/deck/types";

export interface CardArt {
  imageUrl: string | undefined;
  unresolved: boolean;
}

/**
 * Resolves a card's artwork the same way in every place it's shown — Visual
 * view's tiles and the List-mode hover preview: LigaMagic's own captured
 * page art first (always available for a real card, independent of Scryfall
 * enrichment), falling back to Scryfall's image only when the page had none.
 */
export function resolveCardArt(card: DeckCard): CardArt {
  const imageUrl = card.pageImageUrl ?? card.enrichment?.imageUrl;
  const unresolved =
    !imageUrl && (card.enrichmentStatus === "unavailable" || card.enrichmentStatus === "not-found");
  return { imageUrl, unresolved };
}
