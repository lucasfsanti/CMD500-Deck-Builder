import * as esbuild from "esbuild";
import { JSDOM } from "jsdom";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * One-off tool (not shipped in the demo bundle) that regenerates
 * extension/src/demo/real-deck-data.json from a real LigaMagic deck page.
 * Reuses the actual production parser (src/lib/capture/deck-page-parser.ts)
 * against a saved copy of the page's HTML, so the demo's captured-card shape
 * (name/quantity/zone/price/art/mana-cost) is exactly what the real
 * extension would have produced — then batch-enriches every unique card via
 * Scryfall's public collection API (type/color identity/cmc/legality/art),
 * the same enrichment source the real extension uses at runtime.
 *
 * Usage: node scripts/generate-demo-deck.mjs <path-to-saved-deck-page.html>
 */

const extensionRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error("Usage: node scripts/generate-demo-deck.mjs <path-to-saved-deck-page.html>");
  process.exit(1);
}

// Bundle the real parser (TS) to a temp ESM file and import it, rather than
// hand-porting its logic here — this is the actual capture code the
// extension ships, not a reimplementation that could drift from it.
const tmpDir = mkdtempSync(path.join(tmpdir(), "cmd500-demo-gen-"));
const bundlePath = path.join(tmpDir, "deck-page-parser.mjs");
await esbuild.build({
  entryPoints: [path.join(extensionRoot, "src/lib/capture/deck-page-parser.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundlePath,
});
const { parseDeckPage } = await import(bundlePath);

const html = readFileSync(htmlPath, "utf-8");
const dom = new JSDOM(html);
const result = parseDeckPage(dom.window.document);
if (result.status !== "ok") {
  console.error("Parser could not recognize the page:", result.status);
  process.exit(1);
}

const captured = result.cards;
console.log(`Parsed ${captured.length} card entries from the page.`);

// Scryfall's collection endpoint takes up to 75 identifiers per request.
const uniqueNames = [...new Set(captured.map((c) => c.name))];
const enrichmentByName = new Map();
for (let i = 0; i < uniqueNames.length; i += 75) {
  const batch = uniqueNames.slice(i, i + 75);
  const res = await fetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      // Scryfall rejects a default HTTP-library User-Agent (400 generic_user_agent).
      "user-agent": "CMD500DeckBuilderDemoGenerator/1.0 (+https://github.com/lucasfsanti/CMD500-Deck-Builder)",
    },
    body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
  });
  const body = await res.json();
  for (const card of body.data ?? []) {
    enrichmentByName.set(card.name, card);
  }
  if (body.not_found?.length) {
    console.warn(
      "Scryfall could not resolve:",
      body.not_found.map((n) => n.name).join(", "),
    );
  }
  // Scryfall asks for ~50-100ms between requests; batches are already few.
  await new Promise((r) => setTimeout(r, 100));
}

// Second pass, one at a time: the collection endpoint only does exact
// matches, but LigaMagic's captured name is sometimes just a modal/adventure
// card's front face (e.g. "Disciple of Freyalise" for the printed
// "Disciple of Freyalise // Garden of Freyalise") — fuzzy /cards/named
// resolves those. Store the enrichment under the *original* captured name
// so the later merge step (keyed by card.name) still finds it.
for (const name of uniqueNames) {
  if (enrichmentByName.has(name)) continue;
  const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`, {
    headers: {
      accept: "application/json",
      "user-agent": "CMD500DeckBuilderDemoGenerator/1.0 (+https://github.com/lucasfsanti/CMD500-Deck-Builder)",
    },
  });
  if (res.ok) {
    enrichmentByName.set(name, await res.json());
  } else {
    console.warn(`Still unresolved after fuzzy lookup: ${name}`);
  }
  await new Promise((r) => setTimeout(r, 100));
}

function cardArtUrl(scryfallCard) {
  if (!scryfallCard) return undefined;
  return scryfallCard.image_uris?.normal ?? scryfallCard.card_faces?.[0]?.image_uris?.normal;
}

let nextId = 1;
const deckCards = captured.map((card) => {
  const sc = enrichmentByName.get(card.name);
  const enrichment = sc
    ? {
        name: sc.name,
        typeLine: sc.type_line,
        colorIdentity: sc.color_identity,
        cmc: sc.cmc,
        layout: sc.layout,
        legalInCommander: sc.legalities?.commander === "legal",
        scryfallId: sc.id,
        imageUrl: cardArtUrl(sc),
        faceManaCosts: undefined,
      }
    : undefined;

  return {
    id: `demo-card-${nextId++}`,
    name: card.name,
    quantity: card.quantity,
    zone: card.zone,
    pageLowestPrice: card.pageLowestPrice,
    // LigaMagic's own art first, exactly like resolveCardArt's real
    // priority (card-art.ts) — Scryfall art is the fallback, not the default.
    pageImageUrl: card.pageImageUrl ?? cardArtUrl(sc),
    pageManaCostSymbols: card.pageManaCostSymbols,
    pageNamePt: card.pageNamePt,
    enrichment,
    enrichmentStatus: sc ? "ok" : "not-found",
  };
});

const outPath = path.join(extensionRoot, "src/demo/real-deck-data.json");
writeFileSync(outPath, JSON.stringify(deckCards, null, 2) + "\n");
console.log(`Wrote ${deckCards.length} cards to ${outPath}`);
console.log(`Unresolved (no Scryfall match): ${deckCards.filter((c) => c.enrichmentStatus !== "ok").length}`);
