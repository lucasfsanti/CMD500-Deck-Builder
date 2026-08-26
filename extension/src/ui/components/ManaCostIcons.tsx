const LIGAMAGIC_SYMBOL_BASE = "https://www.ligamagic.com.br/arquivos/img/mtg/symb";

export interface ManaCostIconsProps {
  /** Ordered mana-symbol codes (e.g. ["2", "G", "U", "R"]) — DeckCard's `pageManaCostSymbols`. */
  symbols: string[] | undefined;
}

/**
 * Renders a card's mana cost as LigaMagic's own official mana-symbol icons,
 * hotlinked directly from LigaMagic's asset host (same precedent as
 * captured card artwork) rather than a bundled copy of the symbol set.
 * Renders nothing when the card has no captured mana cost.
 */
export function ManaCostIcons({ symbols }: ManaCostIconsProps) {
  if (!symbols || symbols.length === 0) return null;

  return (
    <span className="c500-mana-cost">
      {symbols.map((symbol, index) => (
        <img
          key={`${symbol}-${index}`}
          className="c500-mana-cost__icon"
          src={`${LIGAMAGIC_SYMBOL_BASE}/${encodeURIComponent(symbol)}.svg`}
          alt={symbol}
        />
      ))}
    </span>
  );
}
