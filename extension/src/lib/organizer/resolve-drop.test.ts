import { describe, expect, it } from "vitest";
import { resolveDropZone, resolveDragOutcome } from "./resolve-drop";
import type { DeckCard } from "../deck/types";

describe("resolveDropZone (verification finding #4a: drop outside any zone)", () => {
  it("resolves a recognized zone id", () => {
    expect(resolveDropZone({ over: { id: "maybeboard" } })).toBe("maybeboard");
  });

  it("returns undefined when dropped outside any droppable (over is null)", () => {
    expect(resolveDropZone({ over: null })).toBeUndefined();
  });

  it("returns undefined when the drop target's id isn't a recognized zone", () => {
    expect(resolveDropZone({ over: { id: "not-a-zone" } })).toBeUndefined();
  });
});

function card(id: string, typeLine: string, zone: DeckCard["zone"] = "mainDeck", cmc = 1): DeckCard {
  return {
    id,
    name: id,
    quantity: 1,
    zone,
    pageLowestPrice: 1,
    pageImageUrl: undefined,
    pageManaCostSymbols: undefined,
    pageNamePt: undefined,
    enrichmentStatus: "ok",
    enrichment: {
      name: id,
      typeLine,
      colorIdentity: [],
      cmc,
      layout: "normal",
      legalInCommander: true,
      scryfallId: id,
      imageUrl: undefined,
      faceManaCosts: undefined,
    },
  };
}

describe("resolveDragOutcome (custom-group-order)", () => {
  it("resolves a drop onto a recognized zone id as a move, unchanged from resolveDropZone", () => {
    const cards = [card("a", "Creature", "mainDeck")];
    const outcome = resolveDragOutcome(
      { active: { id: "a" }, over: { id: "maybeboard" } },
      cards,
      "type",
      "cmc",
      "en",
    );
    expect(outcome).toEqual({ kind: "move", cardId: "a", toZone: "maybeboard" });
  });

  it("resolves a no-op when dropped outside any recognized target", () => {
    const cards = [card("a", "Creature", "mainDeck")];
    const outcome = resolveDragOutcome({ active: { id: "a" }, over: null }, cards, "type", "cmc", "en");
    expect(outcome).toEqual({ kind: "noop" });
  });

  it("resolves a drop onto a card in a different zone as a plain zone move (append semantics)", () => {
    const cards = [card("a", "Creature", "maybeboard"), card("b", "Creature", "mainDeck")];
    const outcome = resolveDragOutcome({ active: { id: "a" }, over: { id: "b" } }, cards, "type", "cmc", "en");
    expect(outcome).toEqual({ kind: "move", cardId: "a", toZone: "mainDeck" });
  });

  it("resolves a drop onto another card in the same zone and same group as a reorder", () => {
    const cards = [
      card("a", "Creature", "mainDeck", 1),
      card("b", "Creature", "mainDeck", 2),
      card("c", "Creature", "mainDeck", 3),
    ];
    // Dragging "a" (currently first, by ascending CMC) onto "c" (currently last).
    const outcome = resolveDragOutcome({ active: { id: "a" }, over: { id: "c" } }, cards, "type", "cmc", "en");
    expect(outcome).toEqual({
      kind: "reorder",
      groupingAxis: "type",
      groupKey: "Creature",
      orderedCardIds: ["b", "c", "a"],
    });
  });

  it("resolves a no-op when dropped onto a card in the same zone but a different group", () => {
    const cards = [card("a", "Creature", "mainDeck"), card("b", "Instant", "mainDeck")];
    const outcome = resolveDragOutcome({ active: { id: "a" }, over: { id: "b" } }, cards, "type", "cmc", "en");
    expect(outcome).toEqual({ kind: "noop" });
  });

  it("resolves a no-op when dropped onto itself", () => {
    const cards = [card("a", "Creature", "mainDeck")];
    const outcome = resolveDragOutcome({ active: { id: "a" }, over: { id: "a" } }, cards, "type", "cmc", "en");
    expect(outcome).toEqual({ kind: "noop" });
  });

  it("resolves a no-op when the dragged or target card can't be found", () => {
    const cards = [card("a", "Creature", "mainDeck")];
    expect(
      resolveDragOutcome({ active: { id: "a" }, over: { id: "missing" } }, cards, "type", "cmc", "en"),
    ).toEqual({ kind: "noop" });
    expect(
      resolveDragOutcome({ active: { id: "missing" }, over: { id: "a" } }, cards, "type", "cmc", "en"),
    ).toEqual({ kind: "noop" });
  });
});
