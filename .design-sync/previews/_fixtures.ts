// Shared sample data for every preview in this directory — not itself a
// component preview (no PascalCase-matching filename), so the converter
// ignores it as a build artifact and only ever imports it as a helper.
//
// One small, internally-consistent "sample deck" so every card's price,
// legality, and mana identity make sense together across every component's
// stories, the way a real Commander 500 deck would.
import type { DeckCard } from "cmd500-design-system";

function card(partial: Partial<DeckCard> & Pick<DeckCard, "id" | "name" | "zone" | "quantity">): DeckCard {
  return {
    pageLowestPrice: undefined,
    pageImageUrl: undefined,
    pageManaCostSymbols: undefined,
    pageNamePt: undefined,
    enrichment: undefined,
    enrichmentStatus: "ok",
    ...partial,
  };
}

export const commander = card({
  id: "muldrotha",
  name: "Muldrotha, the Gravetide",
  pageNamePt: "Muldrotha, a Maré Sepulcral",
  zone: "comandante",
  quantity: 1,
  pageLowestPrice: 12.5,
  pageManaCostSymbols: ["3", "B", "G", "U"],
  enrichment: {
    name: "Muldrotha, the Gravetide",
    typeLine: "Legendary Creature — Elf Shaman",
    colorIdentity: ["B", "G", "U"],
    cmc: 6,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "sample-muldrotha",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

export const solRing = card({
  id: "sol-ring",
  name: "Sol Ring",
  pageNamePt: "Anel de Sol",
  zone: "mainDeck",
  quantity: 1,
  pageLowestPrice: 4,
  pageManaCostSymbols: ["1"],
  enrichment: {
    name: "Sol Ring",
    typeLine: "Artifact",
    colorIdentity: [],
    cmc: 1,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "sample-sol-ring",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

export const swordsToPlowshares = card({
  id: "swords",
  name: "Swords to Plowshares",
  pageNamePt: "Espadas em Arados",
  zone: "mainDeck",
  quantity: 1,
  pageLowestPrice: 1.5,
  pageManaCostSymbols: ["W"],
  enrichment: {
    name: "Swords to Plowshares",
    typeLine: "Instant",
    colorIdentity: ["W"],
    cmc: 1,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "sample-swords",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

export const counterspell = card({
  id: "counterspell",
  name: "Counterspell",
  pageNamePt: "Contramágica",
  zone: "mainDeck",
  quantity: 1,
  pageLowestPrice: 3,
  pageManaCostSymbols: ["U", "U"],
  enrichment: {
    name: "Counterspell",
    typeLine: "Instant",
    colorIdentity: ["U"],
    cmc: 2,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "sample-counterspell",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

export const beastWithin = card({
  id: "beast-within",
  name: "Beast Within",
  pageNamePt: "Fera Interior",
  zone: "mainDeck",
  quantity: 1,
  pageLowestPrice: 1,
  pageManaCostSymbols: ["2", "G"],
  enrichment: {
    name: "Beast Within",
    typeLine: "Instant",
    colorIdentity: ["G"],
    cmc: 3,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "sample-beast-within",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

export const eternalWitness = card({
  id: "eternal-witness",
  name: "Eternal Witness",
  pageNamePt: "Testemunha Eterna",
  zone: "mainDeck",
  quantity: 1,
  pageLowestPrice: 2.5,
  pageManaCostSymbols: ["2", "G"],
  enrichment: {
    name: "Eternal Witness",
    typeLine: "Creature — Elf Shaman",
    colorIdentity: ["G"],
    cmc: 3,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "sample-eternal-witness",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

/** Enrichment still pending — demonstrates the "no price yet" / incomplete-budget state. */
export const mysticConfluence = card({
  id: "mystic-confluence",
  name: "Mystic Confluence",
  pageNamePt: "Confluência Mística",
  zone: "mainDeck",
  quantity: 1,
  pageLowestPrice: undefined,
  pageManaCostSymbols: ["3", "U", "U"],
  enrichmentStatus: "pending",
  enrichment: undefined,
});

/** A real Commander-banned card — demonstrates the illegal-card badge/state. */
export const timeWalk = card({
  id: "time-walk",
  name: "Time Walk",
  pageNamePt: "Caminhada no Tempo",
  zone: "mainDeck",
  quantity: 1,
  pageLowestPrice: 40,
  pageManaCostSymbols: ["1", "U"],
  enrichment: {
    name: "Time Walk",
    typeLine: "Sorcery",
    colorIdentity: ["U"],
    cmc: 2,
    layout: "normal",
    legalInCommander: false,
    scryfallId: "sample-time-walk",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

export const forest = card({
  id: "forest",
  name: "Forest",
  pageNamePt: "Floresta",
  zone: "mainDeck",
  quantity: 8,
  pageLowestPrice: undefined,
  pageManaCostSymbols: undefined,
  enrichment: {
    name: "Forest",
    typeLine: "Basic Land — Forest",
    colorIdentity: [],
    cmc: 0,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "sample-forest",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

export const demonicTutor = card({
  id: "demonic-tutor",
  name: "Demonic Tutor",
  pageNamePt: "Tutor Demoníaco",
  zone: "maybeboard",
  quantity: 1,
  pageLowestPrice: 15,
  pageManaCostSymbols: ["1", "B"],
  enrichment: {
    name: "Demonic Tutor",
    typeLine: "Sorcery",
    colorIdentity: ["B"],
    cmc: 2,
    layout: "normal",
    legalInCommander: true,
    scryfallId: "sample-demonic-tutor",
    imageUrl: undefined,
    faceManaCosts: undefined,
  },
});

/** A double-faced card — demonstrates ManaCostIcons' faceManaCosts "//" divider. */
export const invasionOfIkoria = card({
  id: "invasion-ikoria",
  name: "Invasion of Ikoria",
  pageNamePt: "Invasão de Ikoria",
  zone: "mainDeck",
  quantity: 1,
  pageLowestPrice: 1.2,
  pageManaCostSymbols: ["2", "G"],
  enrichment: {
    name: "Invasion of Ikoria",
    typeLine: "Battle — Siege // Creature — Beast",
    colorIdentity: ["G"],
    cmc: 3,
    layout: "transform",
    legalInCommander: true,
    scryfallId: "sample-invasion-ikoria",
    imageUrl: undefined,
    faceManaCosts: [["2", "G"], ["4", "G"]],
  },
});

export const mainDeckSpells = [solRing, swordsToPlowshares, counterspell, beastWithin, eternalWitness, timeWalk, invasionOfIkoria];
export const mainDeck = [...mainDeckSpells, mysticConfluence, forest];
export const fullDeck = [commander, ...mainDeck, demonicTutor];

export const illegalCardIds = new Set([timeWalk.id]);
