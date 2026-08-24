import type { DeckCard, Zone } from "../deck/types";

export const TYPE_ORDER = [
  "Creature",
  "Planeswalker",
  "Instant",
  "Sorcery",
  "Artifact",
  "Enchantment",
  "Battle",
  "Land",
  "Other",
] as const;

const COLOR_ORDER = ["W", "U", "B", "R", "G"] as const;
const COLOR_NAMES: Record<(typeof COLOR_ORDER)[number], string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

/**
 * Portuguese display labels for the English classification keys above
 * (primaryType's TYPE_ORDER, colorGroupLabel's color-group names). Kept
 * separate from the keys themselves, which must stay English to match
 * Scryfall's own type-line/color-identity data — only presentation
 * (zone group headers, chart bucket labels) goes through these maps.
 */
export const TYPE_DISPLAY_LABELS: Record<(typeof TYPE_ORDER)[number], string> = {
  Creature: "Criatura",
  Planeswalker: "Planeswalker",
  Instant: "Mágica Instantânea",
  Sorcery: "Feitiço",
  Artifact: "Artefato",
  Enchantment: "Encantamento",
  Battle: "Batalha",
  Land: "Terreno",
  Other: "Outro",
};

export const COLOR_GROUP_DISPLAY_LABELS: Record<string, string> = {
  Colorless: "Incolor",
  White: "Branco",
  Blue: "Azul",
  Black: "Preto",
  Red: "Vermelho",
  Green: "Verde",
  Multicolor: "Multicolor",
};

/**
 * The primary card type used for grouping, taken from the first recognized
 * word in the type line. Exported so deck-analytics's type-distribution
 * chart uses the exact same classification as the organizer's own grouping.
 */
export function primaryType(typeLine: string | undefined): (typeof TYPE_ORDER)[number] {
  if (!typeLine) return "Other";
  for (const type of TYPE_ORDER) {
    if (typeLine.includes(type)) return type;
  }
  return "Other";
}

/** A stable, orderable key for a card's color identity: colorless first, then WUBRG combinations, multicolor last. */
function colorIdentityKey(colors: string[] | undefined): string {
  if (!colors || colors.length === 0) return "0-colorless";
  if (colors.length > 1) return "9-multi";
  const index = COLOR_ORDER.indexOf(colors[0] as (typeof COLOR_ORDER)[number]);
  return `1-${index === -1 ? 9 : index}`;
}

/**
 * A human-readable color-identity group label, built from the exact same
 * WUBRG classification as colorIdentityKey, so deck-analytics's
 * color-distribution chart matches the organizer's own grouping.
 */
export function colorGroupLabel(colors: string[] | undefined): string {
  if (!colors || colors.length === 0) return "Colorless";
  if (colors.length > 1) return "Multicolor";
  return COLOR_NAMES[colors[0] as (typeof COLOR_ORDER)[number]] ?? "Colorless";
}

export interface CardGroup {
  type: string;
  cards: DeckCard[];
}

/** The axis the deck organizer groups a zone's cards by; "type" is the default. */
export type GroupingAxis = "type" | "color" | "cmc";

/**
 * The axis a zone's cards are sorted by *within* a group — user-selectable,
 * independent of the grouping axis. Replaces the previous fixed "sort by
 * the two non-grouping axes, then name" rule (see deck-organizer's
 * "Grouping and sorting within a zone" delta in this change).
 */
export type SortAxis = "cmc" | "name" | "color" | "price";

function typeOf(card: DeckCard): (typeof TYPE_ORDER)[number] {
  return primaryType(card.enrichment?.typeLine);
}

function cmcTiebreak(card: DeckCard): number {
  return card.enrichment?.cmc ?? 0;
}

function compareByColor(a: DeckCard, b: DeckCard): number {
  return colorIdentityKey(a.enrichment?.colorIdentity).localeCompare(
    colorIdentityKey(b.enrichment?.colorIdentity),
  );
}

function compareByName(a: DeckCard, b: DeckCard): number {
  return a.name.localeCompare(b.name);
}

/** Descending (highest first); a card with no resolved price sorts after every priced card. */
function compareByPrice(a: DeckCard, b: DeckCard): number {
  if (a.pageLowestPrice === undefined && b.pageLowestPrice === undefined) return 0;
  if (a.pageLowestPrice === undefined) return 1;
  if (b.pageLowestPrice === undefined) return -1;
  return b.pageLowestPrice - a.pageLowestPrice;
}

function compareBySortAxis(sortAxis: SortAxis): (a: DeckCard, b: DeckCard) => number {
  switch (sortAxis) {
    case "name":
      return compareByName;
    case "color":
      return compareByColor;
    case "price":
      return compareByPrice;
    case "cmc":
      return (a, b) => cmcTiebreak(a) - cmcTiebreak(b);
  }
}

/** Sorts a single group's cards by the active sort axis, with name as the tiebreak. */
function sortWithinGroup(cards: DeckCard[], sortAxis: SortAxis): DeckCard[] {
  const primaryCompare = compareBySortAxis(sortAxis);
  return [...cards].sort((a, b) => primaryCompare(a, b) || compareByName(a, b));
}

function groupByType(cards: DeckCard[], sortAxis: SortAxis): CardGroup[] {
  const byType = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const type = typeOf(card);
    const bucket = byType.get(type) ?? [];
    bucket.push(card);
    byType.set(type, bucket);
  }

  const groups: CardGroup[] = [];
  for (const type of TYPE_ORDER) {
    const bucket = byType.get(type);
    if (!bucket || bucket.length === 0) continue;
    groups.push({ type, cards: sortWithinGroup(bucket, sortAxis) });
  }
  return groups;
}

const COLOR_GROUP_ORDER = ["Colorless", "White", "Blue", "Black", "Red", "Green", "Multicolor"];

function groupByColor(cards: DeckCard[], sortAxis: SortAxis): CardGroup[] {
  const byColor = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const label = colorGroupLabel(card.enrichment?.colorIdentity);
    const bucket = byColor.get(label) ?? [];
    bucket.push(card);
    byColor.set(label, bucket);
  }

  const groups: CardGroup[] = [];
  for (const label of COLOR_GROUP_ORDER) {
    const bucket = byColor.get(label);
    if (!bucket || bucket.length === 0) continue;
    groups.push({ type: label, cards: sortWithinGroup(bucket, sortAxis) });
  }
  return groups;
}

const UNKNOWN_CMC = "unknown";

function groupByCmc(cards: DeckCard[], sortAxis: SortAxis): CardGroup[] {
  const byCmc = new Map<number | typeof UNKNOWN_CMC, DeckCard[]>();
  for (const card of cards) {
    const key = card.enrichment?.cmc ?? UNKNOWN_CMC;
    const bucket = byCmc.get(key) ?? [];
    bucket.push(card);
    byCmc.set(key, bucket);
  }

  const numericKeys = [...byCmc.keys()]
    .filter((key): key is number => typeof key === "number")
    .sort((a, b) => a - b);
  // Cards whose CMC hasn't resolved yet get their own group, last — same
  // "unknown sorts after everything real" convention as type grouping's
  // "Other" bucket.
  const orderedKeys: (number | typeof UNKNOWN_CMC)[] = byCmc.has(UNKNOWN_CMC)
    ? [...numericKeys, UNKNOWN_CMC]
    : numericKeys;

  const groups: CardGroup[] = [];
  for (const key of orderedKeys) {
    const bucket = byCmc.get(key);
    if (!bucket || bucket.length === 0) continue;
    groups.push({ type: key === UNKNOWN_CMC ? "?" : String(key), cards: sortWithinGroup(bucket, sortAxis) });
  }
  return groups;
}

/**
 * Groups and sorts a zone's cards by the given grouping axis (type, color,
 * or mana cost — type is the default), with groups ordered by that axis's
 * own natural order. Cards within a group are ordered by the given sort
 * axis (mana value by default), then by name, per the deck-organizer
 * spec's grouping requirement.
 */
export function groupAndSortZone(
  cards: DeckCard[],
  groupingAxis: GroupingAxis = "type",
  sortAxis: SortAxis = "cmc",
): CardGroup[] {
  if (groupingAxis === "color") return groupByColor(cards, sortAxis);
  if (groupingAxis === "cmc") return groupByCmc(cards, sortAxis);
  return groupByType(cards, sortAxis);
}

export function groupCardsByZone(cards: DeckCard[]): Record<Zone, DeckCard[]> {
  const result: Record<Zone, DeckCard[]> = {
    comandante: [],
    comandanteParceiro: [],
    mainDeck: [],
    maybeboard: [],
  };
  for (const card of cards) {
    result[card.zone].push(card);
  }
  return result;
}
