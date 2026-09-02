export const ZONES = ["comandante", "comandanteParceiro", "mainDeck", "maybeboard"] as const;

export type Zone = (typeof ZONES)[number];

export const FORMATS = ["commander500", "commander500Duel"] as const;
export type Format = (typeof FORMATS)[number];

/**
 * The axis the deck organizer groups a zone's cards by; "type" is the
 * default. Lives here (rather than in organizer/group-sort.ts, which
 * re-exports it) so DeckCard.customOrder can reference it without a reverse
 * dependency from this low-level module onto the organizer's algorithms.
 */
export type GroupingAxis = "type" | "color" | "cmc";

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
  /** LigaMagic's own Portuguese display name for this card, captured from the page's link text. Undefined only if the page's markup could not be parsed at all. */
  pageNamePt: string | undefined;
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
  /**
   * A manually-set position within the group this card fell into the last
   * time the user reordered that group (deck-organizer's custom-group-order
   * requirement). Only meaningful when `axis` matches the zone's *currently
   * active* grouping axis and `groupKey` matches the card's current group
   * (CardGroup.type) under that axis — a mismatch means the card's custom
   * rank is dormant (from a different grouping axis) or stale, and the card
   * falls back to being sorted by the active sort axis instead.
   */
  customOrder?: { axis: GroupingAxis; groupKey: string; rank: number };
}

export interface Deck {
  format: Format;
  cards: DeckCard[];
}

export function isBasicLand(name: string): boolean {
  const basics = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes"]);
  return basics.has(name.trim());
}
