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

function typeOf(card: DeckCard): (typeof TYPE_ORDER)[number] {
  return primaryType(card.enrichment?.typeLine);
}

/**
 * CMC tiebreak used when type or color is the grouping axis: unresolved CMC
 * sorts as 0 (first), matching this function's original, pre-generalization
 * behavior exactly, so the default (Type) axis's output stays byte-for-byte
 * unchanged by this generalization.
 */
function cmcTiebreak(card: DeckCard): number {
  return card.enrichment?.cmc ?? 0;
}

function compareByColor(a: DeckCard, b: DeckCard): number {
  return colorIdentityKey(a.enrichment?.colorIdentity).localeCompare(
    colorIdentityKey(b.enrichment?.colorIdentity),
  );
}

function compareByType(a: DeckCard, b: DeckCard): number {
  return TYPE_ORDER.indexOf(typeOf(a)) - TYPE_ORDER.indexOf(typeOf(b));
}

function compareByName(a: DeckCard, b: DeckCard): number {
  return a.name.localeCompare(b.name);
}

function groupByType(cards: DeckCard[]): CardGroup[] {
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
    const sorted = [...bucket].sort((a, b) => {
      const colorCompare = compareByColor(a, b);
      if (colorCompare !== 0) return colorCompare;
      const cmcCompare = cmcTiebreak(a) - cmcTiebreak(b);
      if (cmcCompare !== 0) return cmcCompare;
      return compareByName(a, b);
    });
    groups.push({ type, cards: sorted });
  }
  return groups;
}

const COLOR_GROUP_ORDER = ["Colorless", "White", "Blue", "Black", "Red", "Green", "Multicolor"];

function groupByColor(cards: DeckCard[]): CardGroup[] {
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
    const sorted = [...bucket].sort((a, b) => {
      const typeCompare = compareByType(a, b);
      if (typeCompare !== 0) return typeCompare;
      const cmcCompare = cmcTiebreak(a) - cmcTiebreak(b);
      if (cmcCompare !== 0) return cmcCompare;
      return compareByName(a, b);
    });
    groups.push({ type: label, cards: sorted });
  }
  return groups;
}

const UNKNOWN_CMC = "unknown";

function groupByCmc(cards: DeckCard[]): CardGroup[] {
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
    const sorted = [...bucket].sort((a, b) => {
      const typeCompare = compareByType(a, b);
      if (typeCompare !== 0) return typeCompare;
      const colorCompare = compareByColor(a, b);
      if (colorCompare !== 0) return colorCompare;
      return compareByName(a, b);
    });
    groups.push({ type: key === UNKNOWN_CMC ? "?" : String(key), cards: sorted });
  }
  return groups;
}

/**
 * Groups and sorts a zone's cards by the given axis (type, color, or mana
 * cost — type is the default), with groups ordered by that axis's own
 * natural order and cards within a group sorted by the remaining two axes
 * and then by name, per the deck-organizer spec's grouping requirement.
 */
export function groupAndSortZone(cards: DeckCard[], axis: GroupingAxis = "type"): CardGroup[] {
  if (axis === "color") return groupByColor(cards);
  if (axis === "cmc") return groupByCmc(cards);
  return groupByType(cards);
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
