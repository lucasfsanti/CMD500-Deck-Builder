import type { CapturedCard } from "../deck/types";
import { parseBrlPrice } from "./price-parsing";
import type { CaptureResult } from "./deck-page-parser";

/**
 * UNVERIFIED AGAINST REAL MARKUP: LigaMagic's collection page
 * (?view=colecao/...) requires a logged-in account to render, so this parser
 * could not be built against a real fetched sample the way deck-page-parser
 * was (see that file / test/fixtures/ligamagic-deck-full.html, both pulled
 * from live, logged-out-accessible deck pages). It assumes LigaMagic reuses
 * the same card-row markup conventions confirmed for deck pages (".deck-card"
 * link, ".deck-qty", ".deck-price font") — a reasonable bet since those
 * classes read as shared site-wide components, not deck-specific ones, but
 * unconfirmed. Collections aren't organized into deck zones at all, so every
 * captured card is placed in "maybeboard" (a pool of consideration) rather
 * than invented zone data. Treat this module as the first thing to correct
 * against a real logged-in collection page.
 */

let nextCardId = 0;

export function parseCollectionPage(root: ParentNode): CaptureResult {
  const rows = root.querySelectorAll(".deck-card");
  if (rows.length === 0) return { status: "unrecognized-page" };

  const cards: CapturedCard[] = [];

  for (const cardEl of rows) {
    const link = cardEl.querySelector("a");
    const href = link?.getAttribute("href") ?? "";
    let name: string | undefined;
    try {
      name = new URL(href, "https://www.ligamagic.com.br").searchParams.get("card") ?? undefined;
    } catch {
      name = undefined;
    }
    name = name ?? link?.textContent?.trim();
    if (!name) continue;

    const row = cardEl.closest(".deck-line") ?? cardEl.parentElement;
    const qtyText = row?.querySelector(".deck-qty")?.textContent ?? "";
    const qtyMatch = qtyText.match(/\d+/);
    const quantity = qtyMatch ? Number.parseInt(qtyMatch[0], 10) : 1;

    let pageLowestPrice: number | undefined;
    for (const font of row?.querySelectorAll(".deck-price font") ?? []) {
      const style = font.getAttribute("style") ?? "";
      if (!/display\s*:\s*none/.test(style)) {
        pageLowestPrice = parseBrlPrice(font.textContent ?? "");
        break;
      }
    }

    cards.push({
      id: `capture-collection-${nextCardId++}`,
      name,
      quantity,
      zone: "maybeboard",
      pageLowestPrice,
    });
  }

  return { status: "ok", cards };
}
