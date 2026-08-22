import type { DeckCard, Zone } from "../deck/types";
import { groupCardsByZone } from "../organizer/group-sort";

function formatLine(card: DeckCard): string {
  return `${card.quantity} ${card.name}`;
}

/**
 * LigaMagic-exact export, matching LigaMagic's own confirmed format: the
 * commander zones are merged into the unlabeled main block (LigaMagic's own
 * export does not distinguish the commander from the rest of the deck),
 * followed by a blank line and the Sideboard block (if non-empty), followed
 * by a blank line and the Maybeboard block (if non-empty) — no zone header
 * text anywhere, since LigaMagic's importer neither produces nor expects any.
 */
export function generateLigaMagicExport(cards: DeckCard[]): string {
  const byZone = groupCardsByZone(cards);
  const mainBlock = [
    ...byZone.comandante,
    ...byZone.comandanteParceiro,
    ...byZone.mainDeck,
  ].map(formatLine);
  const sideboardBlock = byZone.sideboard.map(formatLine);
  const maybeboardBlock = byZone.maybeboard.map(formatLine);

  const blocks = [mainBlock, sideboardBlock, maybeboardBlock].filter((b) => b.length > 0);
  return blocks.map((block) => block.join("\n")).join("\n\n");
}

const ZONE_LABELS: Record<Zone, string> = {
  comandante: "Comandante",
  comandanteParceiro: "Comandante Parceiro",
  mainDeck: "Main Deck",
  sideboard: "Sideboard",
  maybeboard: "Maybeboard",
};

const ZONE_ORDER: Zone[] = [
  "comandante",
  "comandanteParceiro",
  "mainDeck",
  "sideboard",
  "maybeboard",
];

/** Human-readable export: each non-empty zone under its own text header. */
export function generateReadableExport(cards: DeckCard[]): string {
  const byZone = groupCardsByZone(cards);
  const sections = ZONE_ORDER.map((zone) => ({ zone, cards: byZone[zone] })).filter(
    (section) => section.cards.length > 0,
  );

  return sections
    .map((section) => `${ZONE_LABELS[section.zone]}\n${section.cards.map(formatLine).join("\n")}`)
    .join("\n\n");
}
