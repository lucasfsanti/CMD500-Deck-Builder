import type { DeckCard } from "../lib/deck/types";
import realDeckData from "./real-deck-data.json";

/**
 * The GitHub Pages demo's decklist: a real, published Commander deck
 * ("Thranduil 500" — https://www.ligamagic.com.br/?view=dks/deck&id=10171831),
 * captured once via the actual production parser (see
 * scripts/generate-demo-deck.mjs) and enriched via Scryfall exactly as the
 * real extension would — then frozen to a static JSON snapshot so the demo
 * has no network dependency at runtime. Regenerate with:
 *   node scripts/generate-demo-deck.mjs <path-to-saved-deck-page.html>
 */
export function buildMockDeck(): DeckCard[] {
  return (realDeckData as DeckCard[]).map((card) => ({ ...card }));
}
