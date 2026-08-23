import { describe, expect, it } from "vitest";
import { groupAndSortZone, groupCardsByZone } from "./group-sort";
import type { DeckCard } from "../deck/types";

function card(
  name: string,
  typeLine: string,
  colorIdentity: string[],
  cmc: number,
  zone: DeckCard["zone"] = "mainDeck",
): DeckCard {
  return {
    id: name,
    name,
    quantity: 1,
    zone,
    pageLowestPrice: 1,
    pageImageUrl: undefined,
    enrichmentStatus: "ok",
    enrichment: {
      name,
      typeLine,
      colorIdentity,
      cmc,
      layout: "normal",
      legalInCommander: true,
      scryfallId: name,
      imageUrl: undefined,
    },
  };
}

describe("groupAndSortZone (task 4.2)", () => {
  it("separates creatures and instants into distinct type groups, ordered by color then ascending CMC", () => {
    const cards = [
      card("Bolt", "Instant", ["R"], 1),
      card("Elf", "Creature — Elf", ["G"], 1),
      card("Counterspell", "Instant", ["U"], 2),
      card("Dragon", "Creature — Dragon", ["R"], 5),
    ];

    const groups = groupAndSortZone(cards);

    expect(groups.map((g) => g.type)).toEqual(["Creature", "Instant"]);
    // WUBRG order: Dragon is red (R, index 3) and sorts before Elf, green (G, index 4).
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Dragon", "Elf"]);
    // Bolt is red (R, index 3), Counterspell is blue (U, index 1).
    expect(groups[1]!.cards.map((c) => c.name)).toEqual(["Counterspell", "Bolt"]);
  });

  it("sorts within a color/type group by ascending CMC", () => {
    const cards = [
      card("Big Red", "Creature", ["R"], 6),
      card("Small Red", "Creature", ["R"], 1),
    ];
    const groups = groupAndSortZone(cards);
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Small Red", "Big Red"]);
  });

  it("sorts by name within the same type/color/CMC group", () => {
    const cards = [
      card("Zebra Beast", "Creature", ["G"], 2),
      card("Aardvark", "Creature", ["G"], 2),
    ];
    const groups = groupAndSortZone(cards);
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Aardvark", "Zebra Beast"]);
  });

  it("places colorless before mono-color before multicolor", () => {
    const cards = [
      card("Multi", "Artifact", ["R", "G"], 3),
      card("Colorless", "Artifact", [], 3),
      card("Mono", "Artifact", ["G"], 3),
    ];
    const groups = groupAndSortZone(cards);
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Colorless", "Mono", "Multi"]);
  });
});

describe("groupAndSortZone grouping axis (task 4.1)", () => {
  const cards = [
    card("Bolt", "Instant", ["R"], 1),
    card("Elf", "Creature — Elf", ["G"], 1),
    card("Counterspell", "Instant", ["U"], 2),
    card("Dragon", "Creature — Dragon", ["R"], 5),
  ];

  it("defaults to the Type axis, unchanged (explicit axis omitted)", () => {
    const withDefault = groupAndSortZone(cards);
    const withExplicitType = groupAndSortZone(cards, "type");
    expect(withDefault).toEqual(withExplicitType);
    expect(withDefault.map((g) => g.type)).toEqual(["Creature", "Instant"]);
  });

  it("groups by Color, ordered W/U/B/R/G/multicolor/colorless, sorted within a group by type then CMC then name", () => {
    const groups = groupAndSortZone(cards, "color");
    expect(groups.map((g) => g.type)).toEqual(["Blue", "Red", "Green"]);
    // Both Bolt (Instant) and Dragon (Creature) are red; Instant sorts before
    // Creature in TYPE_ORDER? No — TYPE_ORDER is Creature, ..., Instant, so
    // Dragon (Creature) sorts before Bolt (Instant) within the Red group.
    expect(groups.find((g) => g.type === "Red")?.cards.map((c) => c.name)).toEqual([
      "Dragon",
      "Bolt",
    ]);
  });

  it("groups by Mana Cost, ordered ascending, sorted within a group by type then color then name", () => {
    const groups = groupAndSortZone(cards, "cmc");
    expect(groups.map((g) => g.type)).toEqual(["1", "2", "5"]);
    // Both Bolt and Elf are CMC 1; Elf (Creature) sorts before Bolt (Instant).
    expect(groups.find((g) => g.type === "1")?.cards.map((c) => c.name)).toEqual(["Elf", "Bolt"]);
  });

  it("groups cards with unresolved CMC into their own trailing group when grouping by Mana Cost", () => {
    const unresolved: DeckCard = {
      id: "x",
      name: "Mystery",
      quantity: 1,
      zone: "mainDeck",
      pageLowestPrice: 1,
      pageImageUrl: undefined,
      enrichment: undefined,
      enrichmentStatus: "pending",
    };
    const groups = groupAndSortZone([card("Bolt", "Instant", ["R"], 1), unresolved], "cmc");
    expect(groups.map((g) => g.type)).toEqual(["1", "?"]);
    expect(groups[1]!.cards.map((c) => c.name)).toEqual(["Mystery"]);
  });
});

describe("groupCardsByZone", () => {
  it("splits cards into their four zones", () => {
    const cards = [
      card("Cmd", "Legendary Creature", ["W"], 3, "comandante"),
      card("Main", "Creature", ["W"], 2, "mainDeck"),
      card("Maybe", "Instant", ["U"], 1, "maybeboard"),
    ];
    const byZone = groupCardsByZone(cards);
    expect(byZone.comandante.map((c) => c.name)).toEqual(["Cmd"]);
    expect(byZone.mainDeck.map((c) => c.name)).toEqual(["Main"]);
    expect(byZone.maybeboard.map((c) => c.name)).toEqual(["Maybe"]);
    expect(byZone.comandanteParceiro).toEqual([]);
  });
});
