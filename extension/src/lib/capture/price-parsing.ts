/**
 * Parses a LigaMagic price string (Brazilian format: "." thousands separator,
 * "," decimal separator, e.g. "2.499,90") into a number of BRL.
 */
export function parseBrlPrice(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : undefined;
}
