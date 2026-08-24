import { colorGroupLabel } from "./group-sort";

/**
 * CSS custom property for each color-identity group label colorGroupLabel
 * produces — the same classification deck-organizer's Color grouping and
 * deck-analytics's "Cor" chart already use, so the color-identity rail, the
 * recolored chart, and the Color grouping axis all agree on one mapping.
 */
const MANA_VAR_BY_LABEL: Record<string, string> = {
  Colorless: "var(--c500-mana-c)",
  White: "var(--c500-mana-w)",
  Blue: "var(--c500-mana-u)",
  Black: "var(--c500-mana-b)",
  Red: "var(--c500-mana-r)",
  Green: "var(--c500-mana-g)",
  Multicolor: "var(--c500-mana-gold)",
};

/** Used while a card's color identity hasn't resolved yet, so its rail doesn't flash from neutral to colored once enrichment arrives. */
export const MANA_PENDING_VAR = "var(--c500-line)";

export function manaVarForColorLabel(label: string): string {
  return MANA_VAR_BY_LABEL[label] ?? MANA_PENDING_VAR;
}

export interface ManaRail {
  colorVar: string;
  /**
   * True only for the Black rail: on the dark "Night Ledger" background,
   * black mana sits closest in value to the background itself, so the rail
   * alone can wash out — the caller adds a thin light inner stroke when
   * this is true. (On the earlier light-parchment palette this was White's
   * problem instead — same principle, mirrored to whichever hue is nearest
   * the current background.)
   */
  keyline: boolean;
}

/**
 * colorIdentity is undefined only while a card's Scryfall enrichment hasn't
 * resolved yet (CardEnrichment always provides an array, even an empty one
 * for colorless, once it has).
 */
export function manaRailForColorIdentity(colorIdentity: string[] | undefined): ManaRail {
  if (colorIdentity === undefined) return { colorVar: MANA_PENDING_VAR, keyline: false };
  const label = colorGroupLabel(colorIdentity);
  return { colorVar: manaVarForColorLabel(label), keyline: label === "Black" };
}
