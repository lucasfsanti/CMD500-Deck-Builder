// Matches the Unicode "Combining Diacritical Marks" block (U+0300-U+036F)
// left behind by NFD decomposition, so it can be stripped to de-accent a name.
// Built from explicit char codes (rather than typed glyphs) to keep this
// source file unambiguous regardless of editor/encoding.
const COMBINING_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g",
);

/**
 * Normalizes a card name captured from LigaMagic's HTML into a form suitable
 * for a Scryfall lookup: strips accents, collapses whitespace, and takes only
 * the front-face name for double-faced/split cards (LigaMagic and Scryfall
 * both key printings by the front face for fuzzy lookup purposes).
 */
export function normalizeCardName(rawName: string): string {
  const withoutAccents = rawName.normalize("NFD").replace(COMBINING_DIACRITICS, "");
  const collapsedWhitespace = withoutAccents.replace(/\s+/g, " ").trim();
  const frontFace = collapsedWhitespace.split(/\s*\/\/\s*/)[0];
  return (frontFace ?? collapsedWhitespace).trim();
}
