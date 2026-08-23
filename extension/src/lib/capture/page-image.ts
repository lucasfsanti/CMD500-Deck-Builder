/**
 * Resolves a captured card's artwork URL directly from LigaMagic's own page
 * DOM, via the card link's `data-lc-id` and the sticky-tooltip `<img>`
 * LigaMagic embeds for every card on the page (as `sticky_<lcId>_`,
 * document-wide, one per distinct card) — the image is already present in
 * the DOM under `lazy-src`, just deferred until hover, so this needs no
 * extra network request and has no dependency on Scryfall being reachable.
 */
export function extractPageImageUrl(cardEl: Element): string | undefined {
  const lcId = cardEl.getAttribute("data-lc-id");
  if (!lcId) return undefined;

  const sticky = cardEl.ownerDocument?.getElementById(`sticky_${lcId}_`);
  const img = sticky?.querySelector("img");
  const src = img?.getAttribute("lazy-src") || img?.getAttribute("src");
  if (!src) return undefined;

  return src.startsWith("//") ? `https:${src}` : src;
}
