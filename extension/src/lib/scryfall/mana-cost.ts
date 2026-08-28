const COLOR_ORDER = ["B", "G", "R", "U", "W"];

/**
 * Converts one Scryfall symbol's inner text (the part between `{` and `}`,
 * e.g. `"2"`, `"G/U"`, `"B/P"`) to the canonical, slash-free code
 * `mana-cost.ts` already established from live LigaMagic data (e.g. `"2"`,
 * `"GU"`, `"BP"`). Returns undefined for a symbol shape not covered by that
 * table (e.g. generic/color hybrid like `"2/W"`) rather than guess.
 */
function canonicalizeSymbol(inner: string): string | undefined {
  if (!inner.includes("/")) return inner;

  const parts = inner.split("/");
  if (parts.length !== 2) return undefined;
  const [a, b] = parts as [string, string];
  if (a === "P" || b === "P") {
    // Phyrexian mana: Scryfall always writes it color-then-P ("B/P"), matching
    // the existing canonical convention ("BP") directly — no reordering.
    const color = a === "P" ? b : a;
    return `${color}P`;
  }

  // Two-color hybrid: Scryfall's printed order isn't guaranteed alphabetical
  // ("W/B" and "B/W" both exist across different cards), but the canonical
  // table's slugs are always alphabetically ordered (b < g < r < u < w) — sort
  // so both printings collapse to the same code and the same real asset.
  if (COLOR_ORDER.includes(a) && COLOR_ORDER.includes(b)) {
    return [a, b].sort((x, y) => COLOR_ORDER.indexOf(x) - COLOR_ORDER.indexOf(y)).join("");
  }

  return undefined;
}

/**
 * Parses one face's Scryfall mana-cost string (e.g. `"{2}{G/U}{G/U}"`) into
 * the canonical symbol-code array `ManaCostIcons` already renders (e.g.
 * `["2", "GU", "GU"]`). Returns `undefined` for an empty string (a face with
 * no printed cost) or if any symbol can't be confidently canonicalized —
 * consistent with `mana-cost.ts`'s "absence over wrong data" rule.
 */
export function parseScryfallManaCost(cost: string): string[] | undefined {
  if (!cost) return undefined;

  const symbols: string[] = [];
  for (const match of cost.matchAll(/\{([^}]+)\}/g)) {
    const inner = match[1];
    const symbol = inner ? canonicalizeSymbol(inner) : undefined;
    if (!symbol) return undefined;
    symbols.push(symbol);
  }
  return symbols.length > 0 ? symbols : undefined;
}
