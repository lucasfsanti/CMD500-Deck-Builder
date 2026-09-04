import type { DeckCard, CardEnrichment, Zone } from "../lib/deck/types";

/**
 * Static, offline demo decklist for the public GitHub Pages demo — no real
 * LigaMagic page, no Scryfall network calls. Every card is already fully
 * "enriched" here, and artwork/mana-symbol URLs point at Scryfall's own
 * public image API (hotlinking supported, no key required) so the demo
 * looks exactly like a real captured deck without bundling any images.
 */

let nextId = 1;

function scryfallArt(name: string): string {
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&format=image&version=normal`;
}

interface MockCardSpec {
  name: string;
  zone: Zone;
  quantity?: number;
  price: number | undefined;
  manaSymbols?: string[];
  typeLine: string;
  colorIdentity: string[];
  cmc: number;
  legalInCommander?: boolean;
}

const SPECS: MockCardSpec[] = [
  // Comandante — Comandante Parceiro deliberately left empty, to show the
  // hero column's compact "drop a partner here" state (design.md).
  {
    name: "Atraxa, Grand Unifier",
    zone: "comandante",
    price: 45,
    manaSymbols: ["3", "G", "W", "U", "B"],
    typeLine: "Legendary Creature — Phyrexian Angel",
    colorIdentity: ["W", "U", "B", "G"],
    cmc: 7,
  },

  // Deck Principal — creatures
  { name: "Solemn Simulacrum", zone: "mainDeck", price: 8, manaSymbols: ["4"], typeLine: "Artifact Creature — Golem", colorIdentity: [], cmc: 4 },
  { name: "Eternal Witness", zone: "mainDeck", price: 6.5, manaSymbols: ["1", "G", "G"], typeLine: "Creature — Elf Shaman", colorIdentity: ["G"], cmc: 3 },
  { name: "Reclamation Sage", zone: "mainDeck", price: 3, manaSymbols: ["2", "G"], typeLine: "Creature — Elf Shaman", colorIdentity: ["G"], cmc: 3 },
  { name: "Farhaven Elf", zone: "mainDeck", price: 2.5, manaSymbols: ["2", "G"], typeLine: "Creature — Elf Druid", colorIdentity: ["G"], cmc: 3 },
  { name: "Acidic Slime", zone: "mainDeck", price: 4, manaSymbols: ["3", "G", "G"], typeLine: "Creature — Ooze", colorIdentity: ["G"], cmc: 5 },
  { name: "Mulldrifter", zone: "mainDeck", price: 3.5, manaSymbols: ["4", "U"], typeLine: "Creature — Elemental", colorIdentity: ["U"], cmc: 5 },
  { name: "Sun Titan", zone: "mainDeck", price: 5, manaSymbols: ["4", "W", "W"], typeLine: "Creature — Giant", colorIdentity: ["W"], cmc: 6 },

  // Deck Principal — instants / sorceries
  { name: "Swords to Plowshares", zone: "mainDeck", price: 1.5, manaSymbols: ["W"], typeLine: "Instant", colorIdentity: ["W"], cmc: 1 },
  { name: "Beast Within", zone: "mainDeck", price: 3.5, manaSymbols: ["2", "G"], typeLine: "Instant", colorIdentity: ["G"], cmc: 3 },
  { name: "Cultivate", zone: "mainDeck", price: 2, manaSymbols: ["2", "G"], typeLine: "Sorcery", colorIdentity: ["G"], cmc: 3 },
  { name: "Praetor's Grasp", zone: "mainDeck", price: 3, manaSymbols: ["2", "B"], typeLine: "Sorcery", colorIdentity: ["B"], cmc: 3 },

  // Deck Principal — artifacts
  { name: "Sol Ring", zone: "mainDeck", price: 12, manaSymbols: ["1"], typeLine: "Artifact", colorIdentity: [], cmc: 1 },
  { name: "Arcane Signet", zone: "mainDeck", price: 5, manaSymbols: ["1"], typeLine: "Artifact", colorIdentity: [], cmc: 1 },
  { name: "Swiftfoot Boots", zone: "mainDeck", price: 6, manaSymbols: ["2"], typeLine: "Artifact", colorIdentity: [], cmc: 2 },
  { name: "Lightning Greaves", zone: "mainDeck", price: 5.5, manaSymbols: ["2"], typeLine: "Artifact", colorIdentity: [], cmc: 2 },

  // Deck Principal — enchantments
  { name: "Rhystic Study", zone: "mainDeck", price: 28, manaSymbols: ["2", "U"], typeLine: "Enchantment", colorIdentity: ["U"], cmc: 3 },
  { name: "Smothering Tithe", zone: "mainDeck", price: 22, manaSymbols: ["3", "W"], typeLine: "Enchantment", colorIdentity: ["W"], cmc: 4 },

  // Deck Principal — terrenos
  { name: "Command Tower", zone: "mainDeck", price: 3, manaSymbols: undefined, typeLine: "Land", colorIdentity: [], cmc: 0 },
  { name: "Exotic Orchard", zone: "mainDeck", price: 4.5, manaSymbols: undefined, typeLine: "Land", colorIdentity: [], cmc: 0 },
  { name: "Island", zone: "mainDeck", quantity: 6, price: 0.5, manaSymbols: undefined, typeLine: "Basic Land — Island", colorIdentity: ["U"], cmc: 0 },
  { name: "Forest", zone: "mainDeck", quantity: 5, price: 0.5, manaSymbols: undefined, typeLine: "Basic Land — Forest", colorIdentity: ["G"], cmc: 0 },
  { name: "Plains", zone: "mainDeck", quantity: 4, price: 0.5, manaSymbols: undefined, typeLine: "Basic Land — Plains", colorIdentity: ["W"], cmc: 0 },
  { name: "Swamp", zone: "mainDeck", quantity: 3, price: 0.5, manaSymbols: undefined, typeLine: "Basic Land — Swamp", colorIdentity: ["B"], cmc: 0 },

  // Maybeboard — includes one Commander-banned card (Emrakul) so the
  // legality summary has something real to flag in the demo.
  { name: "Cyclonic Rift", zone: "maybeboard", price: 32, manaSymbols: ["1", "U"], typeLine: "Instant", colorIdentity: ["U"], cmc: 2 },
  { name: "Dockside Extortionist", zone: "maybeboard", price: 40, manaSymbols: ["U"], typeLine: "Creature — Goblin Pirate", colorIdentity: ["U"], cmc: 1 },
  { name: "Mystic Remora", zone: "maybeboard", price: 9, manaSymbols: ["U"], typeLine: "Enchantment", colorIdentity: ["U"], cmc: 1 },
  { name: "Emrakul, the Aeons Torn", zone: "maybeboard", price: undefined, manaSymbols: ["15"], typeLine: "Legendary Creature — Eldrazi", colorIdentity: [], cmc: 15, legalInCommander: false },
];

function toDeckCard(spec: MockCardSpec): DeckCard {
  const enrichment: CardEnrichment = {
    name: spec.name,
    typeLine: spec.typeLine,
    colorIdentity: spec.colorIdentity,
    cmc: spec.cmc,
    layout: "normal",
    legalInCommander: spec.legalInCommander ?? true,
    scryfallId: `demo-${spec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    imageUrl: scryfallArt(spec.name),
    faceManaCosts: undefined,
  };

  return {
    id: `demo-card-${nextId++}`,
    name: spec.name,
    quantity: spec.quantity ?? 1,
    zone: spec.zone,
    pageLowestPrice: spec.price,
    pageImageUrl: scryfallArt(spec.name),
    pageManaCostSymbols: spec.manaSymbols,
    pageNamePt: undefined,
    enrichment,
    enrichmentStatus: "ok",
  };
}

export function buildMockDeck(): DeckCard[] {
  nextId = 1;
  return SPECS.map(toDeckCard);
}
