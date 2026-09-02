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
    pageManaCostSymbols: undefined,
    pageNamePt: undefined,
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
      faceManaCosts: undefined,
    },
  };
}

describe("groupAndSortZone (task 4.2)", () => {
  it("separates creatures and instants into distinct type groups, sorted within each by the default (Mana Value) sort axis", () => {
    const cards = [
      card("Bolt", "Instant", ["R"], 1),
      card("Elf", "Creature — Elf", ["G"], 1),
      card("Counterspell", "Instant", ["U"], 2),
      card("Dragon", "Creature — Dragon", ["R"], 5),
    ];

    const groups = groupAndSortZone(cards);

    expect(groups.map((g) => g.type)).toEqual(["Creature", "Instant"]);
    // Ascending mana value: Elf (1) before Dragon (5).
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Elf", "Dragon"]);
    // Ascending mana value: Bolt (1) before Counterspell (2).
    expect(groups[1]!.cards.map((c) => c.name)).toEqual(["Bolt", "Counterspell"]);
  });

  it("sorts within a group by ascending CMC (the default sort axis)", () => {
    const cards = [
      card("Big Red", "Creature", ["R"], 6),
      card("Small Red", "Creature", ["R"], 1),
    ];
    const groups = groupAndSortZone(cards);
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Small Red", "Big Red"]);
  });

  it("sorts by name as the tiebreak when the sort axis does not distinguish two cards", () => {
    const cards = [
      card("Zebra Beast", "Creature", ["G"], 2),
      card("Aardvark", "Creature", ["G"], 2),
    ];
    const groups = groupAndSortZone(cards);
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Aardvark", "Zebra Beast"]);
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

  it("groups by Color, ordered W/U/B/R/G/multicolor/colorless, sorted within a group by the active sort axis", () => {
    const groups = groupAndSortZone(cards, "color");
    expect(groups.map((g) => g.type)).toEqual(["Blue", "Red", "Green"]);
    // Both Bolt and Dragon are red; default sort axis is ascending mana
    // value, so Bolt (1) sorts before Dragon (5).
    expect(groups.find((g) => g.type === "Red")?.cards.map((c) => c.name)).toEqual([
      "Bolt",
      "Dragon",
    ]);
  });

  it("groups by Mana Cost, ordered ascending, sorted within a group by the active sort axis then name", () => {
    const groups = groupAndSortZone(cards, "cmc");
    expect(groups.map((g) => g.type)).toEqual(["1", "2", "5"]);
    // Both Bolt and Elf are CMC 1; the default sort axis (mana value) can't
    // distinguish them within their own group, so name breaks the tie.
    expect(groups.find((g) => g.type === "1")?.cards.map((c) => c.name)).toEqual(["Bolt", "Elf"]);
  });

  it("groups cards with unresolved CMC into their own trailing group when grouping by Mana Cost", () => {
    const unresolved: DeckCard = {
      id: "x",
      name: "Mystery",
      quantity: 1,
      zone: "mainDeck",
      pageLowestPrice: 1,
      pageImageUrl: undefined,
      pageManaCostSymbols: undefined,
      pageNamePt: undefined,
      enrichment: undefined,
      enrichmentStatus: "pending",
    };
    const groups = groupAndSortZone([card("Bolt", "Instant", ["R"], 1), unresolved], "cmc");
    expect(groups.map((g) => g.type)).toEqual(["1", "?"]);
    expect(groups[1]!.cards.map((c) => c.name)).toEqual(["Mystery"]);
  });
});

describe("groupAndSortZone sort axis (task 12.2)", () => {
  it("sorts by Mana Value (ascending) — the default", () => {
    const cards = [
      card("High", "Creature", ["G"], 5),
      card("Low", "Creature", ["G"], 1),
      card("Mid", "Creature", ["G"], 3),
    ];
    const groups = groupAndSortZone(cards, "type", "cmc");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Low", "Mid", "High"]);
  });

  it("sorts by Name (alphabetical)", () => {
    const cards = [
      card("Zeta", "Creature", ["G"], 3),
      card("Alpha", "Creature", ["R"], 1),
      card("Mid", "Creature", ["U"], 2),
    ];
    const groups = groupAndSortZone(cards, "type", "name");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Alpha", "Mid", "Zeta"]);
  });

  it("sorts by Color (colorless, then W/U/B/R/G, then multicolor)", () => {
    const cards = [
      card("Multi", "Creature", ["R", "G"], 4),
      card("Colorless", "Creature", [], 1),
      card("Mono", "Creature", ["G"], 2),
    ];
    const groups = groupAndSortZone(cards, "type", "color");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Colorless", "Mono", "Multi"]);
  });

  it("sorts by Price (descending — highest R$ first), with unresolved prices last", () => {
    const cards = [
      { ...card("Cheap", "Creature", ["G"], 1), pageLowestPrice: 1 },
      { ...card("Expensive", "Creature", ["G"], 1), pageLowestPrice: 100 },
      { ...card("Mid", "Creature", ["G"], 1), pageLowestPrice: 10 },
      { ...card("Unpriced", "Creature", ["G"], 1), pageLowestPrice: undefined },
    ];
    const groups = groupAndSortZone(cards, "type", "price");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Expensive", "Mid", "Cheap", "Unpriced"]);
  });
});

describe("groupAndSortZone name-language sorting (deck-organizer spec, card-name-language)", () => {
  it("sorts by Name using the Portuguese name and pt-BR collation when sortNameLanguage is pt", () => {
    const cards = [
      { ...card("Zebra", "Creature", ["G"], 1), pageNamePt: "Anel Solar" },
      { ...card("Aardvark", "Creature", ["G"], 1), pageNamePt: "Estudo Rístico" },
      { ...card("Middle", "Creature", ["G"], 1), pageNamePt: "Élan Vital" },
    ];
    const groups = groupAndSortZone(cards, "type", "name", "pt");
    // Portuguese names: "Anel Solar", "Élan Vital", "Estudo Rístico" —
    // pt-BR collation orders "É" alongside "E", not after "Z"/ASCII order.
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Zebra", "Middle", "Aardvark"]);
  });

  it("sorts by Name using the English name when sortNameLanguage is en (default, unchanged)", () => {
    const cards = [
      { ...card("Zebra", "Creature", ["G"], 1), pageNamePt: "Anel Solar" },
      { ...card("Aardvark", "Creature", ["G"], 1), pageNamePt: "Estudo Rístico" },
    ];
    const groups = groupAndSortZone(cards, "type", "name", "en");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Aardvark", "Zebra"]);
  });

  it("falls back to the English name for a card with no captured Portuguese name, even when sorting by pt", () => {
    const cards = [
      { ...card("Zebra", "Creature", ["G"], 1), pageNamePt: undefined },
      { ...card("Aardvark", "Creature", ["G"], 1), pageNamePt: "Zoológico" },
    ];
    const groups = groupAndSortZone(cards, "type", "name", "pt");
    // Aardvark's Portuguese name ("Zoológico") sorts after Zebra's English
    // fallback name ("Zebra"), proving the fallback participated in the sort.
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Zebra", "Aardvark"]);
  });

  it("ignores sortNameLanguage for the tiebreak on a non-name sort axis, always comparing English names", () => {
    const cards = [
      { ...card("Zebra", "Creature", ["G"], 1), pageNamePt: "Anel Solar" },
      { ...card("Aardvark", "Creature", ["G"], 1), pageNamePt: "Zoológico" },
    ];
    // Both cards tie on CMC (1), so the tiebreak decides the order. Their
    // Portuguese names sort the *opposite* way ("Anel Solar" before
    // "Zoológico", i.e. Zebra before Aardvark) — asserting English order
    // below proves the tiebreak ignored sortNameLanguage="pt".
    const groups = groupAndSortZone(cards, "type", "cmc", "pt");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Aardvark", "Zebra"]);
  });
});

describe("groupAndSortZone custom order (custom-group-order)", () => {
  it("ignores the sort axis for a fully custom-ordered group", () => {
    const cards = [
      { ...card("Low", "Creature", ["G"], 1), customOrder: { axis: "type" as const, groupKey: "Creature", rank: 1 } },
      { ...card("High", "Creature", ["G"], 5), customOrder: { axis: "type" as const, groupKey: "Creature", rank: 0 } },
    ];
    // By CMC (the default sort axis) this would be Low (1) then High (5) —
    // asserting the reverse proves rank won, not CMC.
    const groups = groupAndSortZone(cards, "type", "cmc");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["High", "Low"]);
  });

  it("leaves a group with no custom order sorted by the active sort axis, unchanged", () => {
    const cards = [
      card("High", "Creature", ["G"], 5),
      card("Low", "Creature", ["G"], 1),
    ];
    const groups = groupAndSortZone(cards, "type", "cmc");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Low", "High"]);
  });

  it("appends a new unranked card after every ranked card in an otherwise custom-ordered group", () => {
    const cards = [
      { ...card("Second", "Creature", ["G"], 5), customOrder: { axis: "type" as const, groupKey: "Creature", rank: 1 } },
      { ...card("First", "Creature", ["G"], 9), customOrder: { axis: "type" as const, groupKey: "Creature", rank: 0 } },
      // Lowest CMC of the three — would sort first under the "cmc" sort
      // axis, but has no rank in this group, so it must land last instead.
      card("Newcomer", "Creature", ["G"], 1),
    ];
    const groups = groupAndSortZone(cards, "type", "cmc");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["First", "Second", "Newcomer"]);
  });

  it("falls back to sort-axis order for a customOrder stamped under a different grouping axis", () => {
    const cards = [
      // Ranked under "color", not the active "type" axis — should be
      // ignored here and sorted by CMC like an unranked card would be.
      { ...card("High", "Creature", ["G"], 5), customOrder: { axis: "color" as const, groupKey: "Green", rank: 0 } },
      card("Low", "Creature", ["G"], 1),
    ];
    const groups = groupAndSortZone(cards, "type", "cmc");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Low", "High"]);
  });

  it("falls back to sort-axis order for a customOrder stamped under a different group key", () => {
    const cards = [
      // Ranked under the "Instant" group key, but this card is actually in
      // the "Creature" group under the active "type" axis — mismatch means
      // the rank is ignored.
      { ...card("High", "Creature", ["G"], 5), customOrder: { axis: "type" as const, groupKey: "Instant", rank: 0 } },
      card("Low", "Creature", ["G"], 1),
    ];
    const groups = groupAndSortZone(cards, "type", "cmc");
    expect(groups[0]!.cards.map((c) => c.name)).toEqual(["Low", "High"]);
  });

  it("reactivates a custom order after switching away from and back to the axis it was stamped under", () => {
    const cards = [
      { ...card("Low", "Creature", ["G"], 1), customOrder: { axis: "type" as const, groupKey: "Creature", rank: 1 } },
      { ...card("High", "Creature", ["G"], 5), customOrder: { axis: "type" as const, groupKey: "Creature", rank: 0 } },
    ];

    // Switch to Color grouping: the custom order goes dormant (different
    // partition), so this group's cards fall back to the sort axis (CMC).
    const colorGroups = groupAndSortZone(cards, "color", "cmc");
    expect(colorGroups[0]!.cards.map((c) => c.name)).toEqual(["Low", "High"]);

    // Switch back to Type grouping: the same underlying cards still carry
    // their "type" customOrder, so it reactivates without needing to be
    // re-created.
    const typeGroups = groupAndSortZone(cards, "type", "cmc");
    expect(typeGroups[0]!.cards.map((c) => c.name)).toEqual(["High", "Low"]);
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
