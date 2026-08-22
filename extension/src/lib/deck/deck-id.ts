/** Extracts LigaMagic's deck id from a deck-page URL (?view=dks/deck&id=<n>), if present. */
export function extractDeckId(url: URL): string | undefined {
  if (!url.searchParams.get("view")?.startsWith("dks/deck")) return undefined;
  return url.searchParams.get("id") ?? undefined;
}
