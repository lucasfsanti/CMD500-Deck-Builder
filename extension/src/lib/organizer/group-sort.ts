import type { DeckCard, GroupingAxis, Zone } from "../deck/types";
import { displayName, type NameLanguage } from "../deck/display-name";

export type { GroupingAxis };

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

/**
 * The group key a card falls under for a given grouping axis — the same
 * key `groupAndSortZone` would put it under as `CardGroup.type`. Exported
 * so a caller that isn't rendering a full zone (e.g. TabRoot's drag-end
 * handler, deciding whether a dragged card and its drop target share a
 * group) can classify a single card without re-deriving this logic.
 */
export function groupKeyFor(card: DeckCard, axis: GroupingAxis): string {
  if (axis === "color") return colorGroupLabel(card.enrichment?.colorIdentity);
  if (axis === "cmc") return card.enrichment?.cmc !== undefined ? String(card.enrichment.cmc) : "?";
  return typeOf(card);
}

function cmcTiebreak(card: DeckCard): number {
  return card.enrichment?.cmc ?? 0;
}

function compareByColor(a: DeckCard, b: DeckCard): number {
  return colorIdentityKey(a.enrichment?.colorIdentity).localeCompare(
    colorIdentityKey(b.enrichment?.colorIdentity),
  );
}

/**
 * Compares two cards by name in the given display language — "pt-BR"
 * collation for Portuguese names (so accented letters like "É"/"Í"/"Ç"
 * collate the way a Portuguese speaker expects), the default locale for
 * English. Per deck-organizer's spec, only the primary Name-axis comparison
 * uses a caller-chosen language; every other call site passes "en" fixed.
 */
function compareByName(a: DeckCard, b: DeckCard, language: NameLanguage): number {
  const locale = language === "pt" ? "pt-BR" : undefined;
  return displayName(a, language).localeCompare(displayName(b, language), locale);
}

/** Descending (highest first); a card with no resolved price sorts after every priced card. */
function compareByPrice(a: DeckCard, b: DeckCard): number {
  if (a.pageLowestPrice === undefined && b.pageLowestPrice === undefined) return 0;
  if (a.pageLowestPrice === undefined) return 1;
  if (b.pageLowestPrice === undefined) return -1;
  return b.pageLowestPrice - a.pageLowestPrice;
}

function compareBySortAxis(
  sortAxis: SortAxis,
  sortNameLanguage: NameLanguage,
): (a: DeckCard, b: DeckCard) => number {
  switch (sortAxis) {
    case "name":
      return (a, b) => compareByName(a, b, sortNameLanguage);
    case "color":
      return compareByColor;
    case "price":
      return compareByPrice;
    case "cmc":
      return (a, b) => cmcTiebreak(a) - cmcTiebreak(b);
  }
}

/**
 * Sorts a single group's cards, per custom-group-order: cards whose
 * `customOrder` matches this group's axis+key (i.e. were ranked the last
 * time the user reordered *this exact* group) sort by that rank; every
 * other card — never ranked, or ranked under a different grouping axis or a
 * different group — sorts by the active sort axis (with name as the
 * tiebreak, per the pre-existing rule) and is appended after the ranked
 * ones. A group with no ranked cards at all is therefore sorted exactly as
 * it was before custom ordering existed. `sortNameLanguage` only affects
 * the primary Name-axis comparison — the trailing tiebreak always compares
 * canonical English names, regardless of the active display language
 * (deck-organizer spec).
 */
function sortWithinGroup(
  cards: DeckCard[],
  groupingAxis: GroupingAxis,
  groupKey: string,
  sortAxis: SortAxis,
  sortNameLanguage: NameLanguage,
): DeckCard[] {
  const isRankedHere = (card: DeckCard) =>
    card.customOrder?.axis === groupingAxis && card.customOrder?.groupKey === groupKey;

  const ranked = cards
    .filter(isRankedHere)
    .sort((a, b) => a.customOrder!.rank - b.customOrder!.rank);

  const primaryCompare = compareBySortAxis(sortAxis, sortNameLanguage);
  const unranked = cards
    .filter((card) => !isRankedHere(card))
    .sort((a, b) => primaryCompare(a, b) || compareByName(a, b, "en"));

  return [...ranked, ...unranked];
}

function groupByType(cards: DeckCard[], sortAxis: SortAxis, sortNameLanguage: NameLanguage): CardGroup[] {
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
    groups.push({ type, cards: sortWithinGroup(bucket, "type", type, sortAxis, sortNameLanguage) });
  }
  return groups;
}

const COLOR_GROUP_ORDER = ["Colorless", "White", "Blue", "Black", "Red", "Green", "Multicolor"];

function groupByColor(cards: DeckCard[], sortAxis: SortAxis, sortNameLanguage: NameLanguage): CardGroup[] {
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
    groups.push({ type: label, cards: sortWithinGroup(bucket, "color", label, sortAxis, sortNameLanguage) });
  }
  return groups;
}

const UNKNOWN_CMC = "unknown";

function groupByCmc(cards: DeckCard[], sortAxis: SortAxis, sortNameLanguage: NameLanguage): CardGroup[] {
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
    const groupKey = key === UNKNOWN_CMC ? "?" : String(key);
    groups.push({
      type: groupKey,
      cards: sortWithinGroup(bucket, "cmc", groupKey, sortAxis, sortNameLanguage),
    });
  }
  return groups;
}

/**
 * Groups and sorts a zone's cards by the given grouping axis (type, color,
 * or mana cost — type is the default), with groups ordered by that axis's
 * own natural order. Cards within a group are ordered by the given sort
 * axis (mana value by default), then by name, per the deck-organizer
 * spec's grouping requirement. `sortNameLanguage` is the display language to
 * use only when `sortAxis` is "name" — it is the caller's job to snapshot
 * this at Name-axis selection time rather than pass the live toggle value,
 * per deck-organizer's toggle-snapshot requirement.
 */
export function groupAndSortZone(
  cards: DeckCard[],
  groupingAxis: GroupingAxis = "type",
  sortAxis: SortAxis = "cmc",
  sortNameLanguage: NameLanguage = "en",
): CardGroup[] {
  if (groupingAxis === "color") return groupByColor(cards, sortAxis, sortNameLanguage);
  if (groupingAxis === "cmc") return groupByCmc(cards, sortAxis, sortNameLanguage);
  return groupByType(cards, sortAxis, sortNameLanguage);
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
