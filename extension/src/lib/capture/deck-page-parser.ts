import type { CapturedCard, Zone } from "../deck/types";
import { parseBrlPrice } from "./price-parsing";
import { zoneForHeaderLabel } from "./zone-labels";
import { extractPageImageUrl } from "./page-image";
import { extractManaCost } from "./mana-cost";

export type CaptureResult =
  | { status: "ok"; cards: CapturedCard[] }
  | { status: "unrecognized-page" };

/**
 * LigaMagic renders the same 100-card deck multiple times on one page — once
 * per view tab (Padrão/type, Cor/color, Custo/CMC, Raridade/rarity, ...).
 * Only the "Padrão" tab (index 1) is the canonical, zone-labeled rendering;
 * the others are just alternate groupings of the same cards and must not be
 * scraped too, or every card would be captured several times over.
 */
function findPrimaryTabContainer(root: ParentNode): Element | undefined {
  return root.querySelector('[id^="dk-val-1-"]') ?? undefined;
}

function extractCardNameFromHref(href: string): string | undefined {
  try {
    const url = new URL(href, "https://www.ligamagic.com.br");
    const name = url.searchParams.get("card");
    return name ? name.trim() : undefined;
  } catch {
    return undefined;
  }
}

function extractQuantity(qtyElement: Element | null): number {
  const text = qtyElement?.textContent ?? "";
  const match = text.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 1;
}

function extractLowestPrice(cardRow: Element): number | undefined {
  const priceElements = cardRow.querySelectorAll(".deck-price font");
  for (const el of priceElements) {
    const style = el.getAttribute("style") ?? "";
    const isHidden = /display\s*:\s*none/.test(style);
    if (!isHidden) {
      return parseBrlPrice(el.textContent ?? "");
    }
  }
  return undefined;
}

let nextCardId = 0;

/**
 * Parses the "Padrão" tab of a LigaMagic deck page into captured cards, per
 * the deck-page-capture spec: card name (from the card's canonical English
 * href, avoiding the page's Portuguese display name), quantity, zone, and
 * lowest displayed price.
 */
export function parseDeckPage(root: ParentNode): CaptureResult {
  const container = findPrimaryTabContainer(root);
  if (!container) return { status: "unrecognized-page" };

  const blocks = container.querySelectorAll(".pdeck-block");
  if (blocks.length === 0) return { status: "unrecognized-page" };

  const cards: CapturedCard[] = [];

  for (const block of blocks) {
    let fallbackZone: Zone = "mainDeck";
    let currentZone: Zone = fallbackZone;
    let isFirstHeader = true;

    for (const line of block.querySelectorAll(":scope > .deck-line")) {
      const headerEl = line.querySelector(":scope > .deck-type");
      if (headerEl) {
        const label = (headerEl.textContent ?? "").replace(/\(\d+\)\s*$/, "").trim();
        const zone = zoneForHeaderLabel(label);
        if (zone) {
          currentZone = zone;
          // Maybeboard (including cards under a Sideboard header, which
          // folds into Maybeboard — the extension keeps no separate
          // Sideboard zone) fully defines its block's fallback zone, since
          // everything under it (including its own type subheaders, e.g.
          // "Branco (6)") belongs to that zone. Comandante / Comandante
          // Parceiro do not: they only claim the single header that names
          // them, and the block's next generic subheader (e.g. "Criaturas")
          // falls back to Main Deck, not back to the commander zone.
          if (isFirstHeader && zone === "maybeboard") {
            fallbackZone = zone;
          }
        } else {
          currentZone = fallbackZone;
        }
        isFirstHeader = false;
        continue;
      }

      const cardEl = line.querySelector(":scope > .deck-box-left > .deck-card > a");
      if (!cardEl) continue;

      const href = cardEl.getAttribute("href") ?? "";
      const name = extractCardNameFromHref(href) ?? cardEl.textContent?.trim();
      if (!name) continue;

      const qtyEl = line.querySelector(":scope > .deck-box-left > .deck-qty");
      const quantity = extractQuantity(qtyEl);
      const pageLowestPrice = extractLowestPrice(line);
      const pageImageUrl = extractPageImageUrl(cardEl);
      const pageManaCostSymbols = extractManaCost(line);

      cards.push({
        id: `capture-${nextCardId++}`,
        name,
        quantity,
        zone: currentZone,
        pageLowestPrice,
        pageImageUrl,
        pageManaCostSymbols,
      });
    }
  }

  return { status: "ok", cards };
}
