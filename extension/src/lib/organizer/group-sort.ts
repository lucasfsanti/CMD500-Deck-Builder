import type { DeckCard, Zone } from "../deck/types";

const TYPE_ORDER = [
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

/** The primary card type used for grouping, taken from the first recognized word in the type line. */
function primaryType(typeLine: string | undefined): (typeof TYPE_ORDER)[number] {
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

export interface CardGroup {
  type: string;
  cards: DeckCard[];
}

/**
 * Groups and sorts a zone's cards by type, then color identity, then CMC
 * (ascending), with cards within a group sorted by name, per the
 * deck-organizer spec's grouping requirement.
 */
export function groupAndSortZone(cards: DeckCard[]): CardGroup[] {
  const byType = new Map<string, DeckCard[]>();
  for (const card of cards) {
    const type = primaryType(card.enrichment?.typeLine);
    const bucket = byType.get(type) ?? [];
    bucket.push(card);
    byType.set(type, bucket);
  }

  const groups: CardGroup[] = [];
  for (const type of TYPE_ORDER) {
    const bucket = byType.get(type);
    if (!bucket || bucket.length === 0) continue;
    const sorted = [...bucket].sort((a, b) => {
      const colorCompare = colorIdentityKey(a.enrichment?.colorIdentity).localeCompare(
        colorIdentityKey(b.enrichment?.colorIdentity),
      );
      if (colorCompare !== 0) return colorCompare;
      const cmcCompare = (a.enrichment?.cmc ?? 0) - (b.enrichment?.cmc ?? 0);
      if (cmcCompare !== 0) return cmcCompare;
      return a.name.localeCompare(b.name);
    });
    groups.push({ type, cards: sorted });
  }
  return groups;
}

export function groupCardsByZone(cards: DeckCard[]): Record<Zone, DeckCard[]> {
  const result: Record<Zone, DeckCard[]> = {
    comandante: [],
    comandanteParceiro: [],
    mainDeck: [],
    sideboard: [],
    maybeboard: [],
  };
  for (const card of cards) {
    result[card.zone].push(card);
  }
  return result;
}
