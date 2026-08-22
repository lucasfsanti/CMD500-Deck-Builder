export type LigaMagicPageKind = "deck" | "collection" | "none";

/**
 * Detects whether the given location is a LigaMagic deck page or collection
 * page. The extension must stay fully inactive (no UI, no scraping) anywhere
 * else, per deck-page-capture's activation requirement.
 *
 * URL shape confirmed against LigaMagic's live site: deck pages live at
 * `?view=dks/deck&id=<n>` and collections at `?view=colecao/colecao`.
 */
export function detectLigaMagicPage(url: URL): LigaMagicPageKind {
  const isLigaMagicHost = /(^|\.)ligamagic\.com\.br$/.test(url.hostname);
  if (!isLigaMagicHost) return "none";

  const view = url.searchParams.get("view") ?? "";
  if (view.startsWith("dks/deck")) return "deck";
  if (view.startsWith("colecao/")) return "collection";
  return "none";
}
