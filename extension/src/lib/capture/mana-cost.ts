/**
 * Decodes a captured card's mana cost directly from LigaMagic's own page
 * markup — no Scryfall dependency. Each symbol is an `<abbr class="mtg-symbol
 * mtg-symbol-<slug>">` with no title/data attribute; the slug is the only
 * signal available. The obvious alternative (reading the resolved
 * `background-image`, which points at the real symbol code) only resolves
 * for an element attached to `window.document` — it always reports "none"
 * for the detached documents this project's own parser tests parse via
 * `DOMParser().parseFromString(...)`, confirmed empirically. Decoding the
 * slug instead has no such load-order dependency and is testable with a
 * plain HTML fixture like everything else this parser extracts.
 */
const SLUG_TO_SYMBOL: Record<string, string> = {
  zero: "0",
  um: "1",
  dois: "2",
  tres: "3",
  quatro: "4",
  cinco: "5",
  seis: "6",
  sete: "7",
  oito: "8",
  nove: "9",
  dez: "10",
  onze: "11",
  doze: "12",
  treze: "13",
  quatorze: "14",
  quinze: "15",
  dezesseis: "16",
  dezessete: "17",
  dezoito: "18",
  dezenove: "19",
  vinte: "20",
  w: "W",
  u: "U",
  b: "B",
  r: "R",
  g: "G",
  c: "C",
  x: "X",
  y: "Y",
  z: "Z",
  s: "S",
  wp: "WP",
  up: "UP",
  bp: "BP",
  rp: "RP",
  gp: "GP",
};

/**
 * Reads a captured card row's mana-cost pips and decodes them to an ordered
 * list of canonical symbol codes (e.g. ["2", "G", "U", "R"]). Returns
 * `undefined` when the row shows no mana cost (e.g. a land) or when any
 * single pip's slug isn't recognized — a partial/guessed cost would be
 * worse than none, so one unresolved symbol drops the whole card's cost,
 * the same "absence over wrong data" rule price capture already follows.
 */
export function extractManaCost(cardRow: Element): string[] | undefined {
  const abbrs = cardRow.querySelectorAll(".deck-cmc .txt-mana abbr.mtg-symbol");
  if (abbrs.length === 0) return undefined;

  const symbols: string[] = [];
  for (const abbr of abbrs) {
    const slugClass = [...abbr.classList].find((cls) => cls.startsWith("mtg-symbol-"));
    const slug = slugClass?.slice("mtg-symbol-".length);
    const symbol = slug ? SLUG_TO_SYMBOL[slug] : undefined;
    if (!symbol) return undefined;
    symbols.push(symbol);
  }
  return symbols;
}
