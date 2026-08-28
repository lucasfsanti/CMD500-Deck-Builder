export const ZONES = ["comandante", "comandanteParceiro", "mainDeck", "maybeboard"] as const;

export type Zone = (typeof ZONES)[number];

export const FORMATS = ["commander500", "commander500Duel"] as const;
export type Format = (typeof FORMATS)[number];

export interface CapturedCard {
  id: string;
  name: string;
  quantity: number;
  zone: Zone;
  /** Lowest price shown on the LigaMagic page, in BRL. Undefined when the page did not show one. */
  pageLowestPrice: number | undefined;
  /** Artwork URL embedded directly in LigaMagic's own page DOM. Always available for a real card; no Scryfall dependency. */
  pageImageUrl: string | undefined;
  /** Ordered mana-symbol codes (e.g. ["2", "G", "U", "R"]) decoded from LigaMagic's own page DOM. Undefined for cards with no shown cost (e.g. lands) or an unrecognized symbol; no Scryfall dependency. */
  pageManaCostSymbols: string[] | undefined;
}

export type CardLayout =
  | "normal"
  | "split"
  | "flip"
  | "transform"
  | "modal_dfc"
  | "meld"
  | "adventure"
  | "leveler"
  | "saga"
  | "class"
  | "other";

export interface CardEnrichment {
  name: string;
  typeLine: string;
  colorIdentity: string[];
  cmc: number;
  layout: CardLayout;
  legalInCommander: boolean;
  /** Scryfall id of this specific printing; used only for the printings lookup. */
  scryfallId: string;
  /** Card artwork for card-visual-view. Undefined when Scryfall has no image for this card. */
  imageUrl: string | undefined;
  /**
   * Each face's own canonical mana-symbol codes (e.g. [["2","G","U"], ["1","G","U"]]),
   * for a card with more than one face carrying a real printed cost (double-faced,
   * split, adventure). Undefined for a card with zero or one real per-face cost —
   * including a transform card's blank-cost back face, or a meld card.
   */
  faceManaCosts: string[][] | undefined;
}

export type EnrichmentResult =
  | { status: "ok"; card: CardEnrichment }
  | { status: "not-found" }
  | { status: "unavailable" };

export interface DeckCard extends CapturedCard {
  enrichment: CardEnrichment | undefined;
  enrichmentStatus: "pending" | "ok" | "not-found" | "unavailable";
}

export interface Deck {
  format: Format;
  cards: DeckCard[];
}

export function isBasicLand(name: string): boolean {
  const basics = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"]);
  return basics.has(name.trim());
}
