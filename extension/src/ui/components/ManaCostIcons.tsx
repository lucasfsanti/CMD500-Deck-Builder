import { Fragment } from "react";

const LIGAMAGIC_SYMBOL_BASE = "https://www.ligamagic.com.br/arquivos/img/mtg/symb";

export interface ManaCostIconsProps {
  /** Ordered mana-symbol codes (e.g. ["2", "G", "U", "R"]) — DeckCard's `pageManaCostSymbols`. Ignored when `symbolGroups` is provided. */
  symbols?: string[] | undefined;
  /**
   * Per-face symbol-code groups (e.g. [["2","G","U"], ["1","G","U"]]) for a
   * card with more than one real printed cost — CardEnrichment's
   * `faceManaCosts`. Rendered as each group's icons in order, separated by a
   * `//` divider (matching the same separator LigaMagic's and Scryfall's own
   * names for these cards already use). Takes precedence over `symbols`.
   */
  symbolGroups?: string[][] | undefined;
}

/**
 * Renders a card's mana cost as LigaMagic's own official mana-symbol icons,
 * hotlinked directly from LigaMagic's asset host (same precedent as
 * captured card artwork) rather than a bundled copy of the symbol set.
 * Renders nothing when the card has no captured mana cost. Given
 * `symbolGroups` (more than one real per-face cost), renders each face's
 * icons separated by a `//` divider instead of one flat run of icons.
 */
export function ManaCostIcons({ symbols, symbolGroups }: ManaCostIconsProps) {
  const groups = symbolGroups ?? (symbols ? [symbols] : []);
  if (groups.length === 0) return null;

  return (
    <span className="c500-mana-cost">
      {groups.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          {groupIndex > 0 && <span className="c500-mana-cost__divider">//</span>}
          {group.map((symbol, symbolIndex) => (
            <img
              key={`${symbol}-${symbolIndex}`}
              className="c500-mana-cost__icon"
              src={`${LIGAMAGIC_SYMBOL_BASE}/${encodeURIComponent(symbol)}.svg`}
              alt={symbol}
            />
          ))}
        </Fragment>
      ))}
    </span>
  );
}
