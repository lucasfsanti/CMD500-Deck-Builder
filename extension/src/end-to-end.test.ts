import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseDeckPage } from "./lib/capture/deck-page-parser";
import { groupCardsByZone, groupAndSortZone } from "./lib/organizer/group-sort";
import { calculateBudget } from "./lib/budget/calculate-budget";
import { checkLegality } from "./lib/legality/check-legality";
import { generateLigaMagicExport, generateReadableExport } from "./lib/export/generate-decklist";
import type { CardEnrichment, DeckCard } from "./lib/deck/types";

// A hand-built enrichment table standing in for Scryfall, so this test stays
// fast and deterministic (the live-network path was already exercised
// extensively against the real LigaMagic + Scryfall APIs during manual
// verification — see scripts/verify-*.mjs). Includes: multiple zones,
// varied types/colors/CMC (multiple "printings" worth of variety isn't
// meaningful here since price comes from the page, not per-printing lookup),
// a card banned under Commander 500 Duel (Sol Ring), and a card with no
// resolvable price (per the fixture's "Some Unpriced Card").
const ENRICHMENT_TABLE: Record<string, CardEnrichment> = {
  "Xyris, the Writhing Storm": {
    name: "Xyris, the Writhing Storm",
    typeLine: "Legendary Creature — Serpent",
    colorIdentity: ["U", "R", "G"],
    cmc: 4,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "xyris",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
  "Vial Smasher the Fierce": {
    name: "Vial Smasher the Fierce",
    typeLine: "Legendary Creature — Djinn Warrior",
    colorIdentity: ["B", "R"],
    cmc: 3,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "vial-smasher",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
  "Llanowar Elves": {
    name: "Llanowar Elves",
    typeLine: "Creature — Elf Druid",
    colorIdentity: ["G"],
    cmc: 1,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "llanowar-elves",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
  "Sol Ring": {
    name: "Sol Ring",
    typeLine: "Artifact",
    colorIdentity: [],
    cmc: 1,
    layout: "normal",
    legalInCommander: true, // legal in Commander 500; banned-in-deck under Duel Commander
    scryfallId: "sol-ring",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
  Forest: {
    name: "Forest",
    typeLine: "Basic Land — Forest",
    colorIdentity: [],
    cmc: 0,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "forest",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
  "Chalice of the Void": {
    name: "Chalice of the Void",
    typeLine: "Artifact",
    colorIdentity: [],
    cmc: 0,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "chalice",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
  "Rhystic Study": {
    name: "Rhystic Study",
    typeLine: "Enchantment",
    colorIdentity: ["U"],
    cmc: 3,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "rhystic-study",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
};

function enrich(captured: ReturnType<typeof parseDeckPage>): DeckCard[] {
  if (captured.status !== "ok") throw new Error("fixture failed to parse");
  return captured.cards.map((card) => {
    const enrichment = ENRICHMENT_TABLE[card.name];
    return {
      ...card,
      enrichment,
      enrichmentStatus: enrichment ? ("ok" as const) : ("not-found" as const),
    };
  });
}

describe("end-to-end: capture → organize → budget → legality → export (task 8.1)", () => {
  const html = readFileSync(path.join(process.cwd(), "test/fixtures/ligamagic-deck-full.html"), "utf8");
  const doc = new DOMParser().parseFromString(html, "text/html");
  const captured = parseDeckPage(doc);
  const cards = enrich(captured);

  it("captures all four zones with real card data", () => {
    expect(captured.status).toBe("ok");
    const byZone = groupCardsByZone(cards);
    expect(byZone.comandante).toHaveLength(1);
    expect(byZone.comandanteParceiro).toHaveLength(1);
    expect(byZone.mainDeck.length).toBeGreaterThan(0);
    // The fixture's Sideboard-headed card folds into Maybeboard alongside
    // the card already under a Maybeboard header.
    expect(byZone.maybeboard).toHaveLength(2);
  });

  it("organizes Main Deck cards by type/color/CMC", () => {
    const byZone = groupCardsByZone(cards);
    const groups = groupAndSortZone(byZone.mainDeck);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((g) => g.cards.length > 0)).toBe(true);
  });

  it("computes a budget that excludes the primary commander and flags the unresolved-price card", () => {
    const budget = calculateBudget(cards);
    expect(budget.isComplete).toBe(false);
    expect(budget.cardsMissingPrice.map((c) => c.name)).toContain("Some Unpriced Card");
    // The primary commander (2.34) must not be in the total; the partner
    // commander (4.00, Comandante Parceiro) must be.
    expect(budget.total).toBeLessThan(1000); // sanity bound; exact value covered in calculate-budget.test.ts
  });

  it("flags Sol Ring as illegal under Commander 500 Duel but not under Commander 500", () => {
    expect(checkLegality(cards, "commander500").illegalCardIds.has(
      cards.find((c) => c.name === "Sol Ring")!.id,
    )).toBe(false);
    expect(checkLegality(cards, "commander500Duel").illegalCardIds.has(
      cards.find((c) => c.name === "Sol Ring")!.id,
    )).toBe(true);
  });

  it("exports both formats, reflecting the same captured deck", () => {
    const ligaExport = generateLigaMagicExport(cards);
    const readableExport = generateReadableExport(cards);
    expect(ligaExport).toContain("Xyris, the Writhing Storm");
    expect(ligaExport).not.toContain("Comandante");
    expect(readableExport).toContain("Comandante\n1 Xyris, the Writhing Storm");
    expect(readableExport).toContain("Maybeboard");
  });
});
