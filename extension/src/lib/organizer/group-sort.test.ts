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
    enrichmentStatus: "ok",
    enrichment: {
      name,
      typeLine,
      colorIdentity,
      cmc,
      layout: "normal",
      legalInCommander: true,
      scryfallId: name,
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

describe("groupCardsByZone", () => {
  it("splits cards into their five zones", () => {
    const cards = [
      card("Cmd", "Legendary Creature", ["W"], 3, "comandante"),
      card("Main", "Creature", ["W"], 2, "mainDeck"),
      card("SB", "Instant", ["U"], 1, "sideboard"),
    ];
    const byZone = groupCardsByZone(cards);
    expect(byZone.comandante.map((c) => c.name)).toEqual(["Cmd"]);
    expect(byZone.mainDeck.map((c) => c.name)).toEqual(["Main"]);
    expect(byZone.sideboard.map((c) => c.name)).toEqual(["SB"]);
    expect(byZone.comandanteParceiro).toEqual([]);
    expect(byZone.maybeboard).toEqual([]);
  });
});
