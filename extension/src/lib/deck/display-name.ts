export type NameLanguage = "en" | "pt";

/**
 * Resolves the card name to render for the active display language, per
 * card-name-language's spec: falls back to the canonical English name
 * whenever no Portuguese name was captured (e.g. stale pre-toggle data).
 */
export function displayName(
  card: { name: string; pageNamePt?: string },
  language: NameLanguage,
): string {
  return language === "pt" ? (card.pageNamePt ?? card.name) : card.name;
}
