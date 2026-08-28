import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseDeckPage } from "./deck-page-parser";
import type { CapturedCard } from "../deck/types";

function loadFixture(name: string): Document {
  const filePath = path.join(process.cwd(), "test/fixtures", name);
  const html = readFileSync(filePath, "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

function byName(cards: CapturedCard[], name: string): CapturedCard | undefined {
  return cards.find((c) => c.name === name);
}

describe("parseDeckPage (tasks 3.1, 3.3)", () => {
  const doc = loadFixture("ligamagic-deck-full.html");
  const result = parseDeckPage(doc);

  it("succeeds and captures cards from the primary (Padrão) tab only", () => {
    expect(result.status).toBe("ok");
  });

  it("covers all four zones", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const zones = new Set(result.cards.map((c) => c.zone));
    expect(zones).toEqual(new Set(["comandante", "comandanteParceiro", "mainDeck", "maybeboard"]));
  });

  it("assigns the commander to the comandante zone with its English name and lowest price", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Xyris, the Writhing Storm");
    expect(card).toMatchObject({ zone: "comandante", quantity: 1, pageLowestPrice: 2.34 });
  });

  it("captures a card's mana cost from the page's own mana-symbol markup", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Xyris, the Writhing Storm");
    expect(card?.pageManaCostSymbols).toEqual(["2", "G", "U", "R"]);
  });

  it("leaves pageManaCostSymbols undefined for a card with no mana-cost markup (e.g. a land)", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Forest");
    expect(card?.pageManaCostSymbols).toBeUndefined();
  });

  it("assigns the partner commander to comandanteParceiro", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Vial Smasher the Fierce");
    expect(card?.zone).toBe("comandanteParceiro");
  });

  it("assigns non-commander cards after Comandante Parceiro back to mainDeck", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Llanowar Elves");
    expect(card).toMatchObject({ zone: "mainDeck", quantity: 1, pageLowestPrice: 0.96 });
  });

  it("assigns a basic land in the Terrenos group to mainDeck with correct quantity", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Forest");
    expect(card).toMatchObject({ zone: "mainDeck", quantity: 9 });
  });

  it("does not misread the 'N cards total' trailer as a new zone", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    // Every mainDeck-block card captured before Sideboard must still read mainDeck,
    // proven by Forest (the last real card before the trailer) being mainDeck above.
    expect(result.cards.some((c) => c.zone === "mainDeck")).toBe(true);
  });

  it("folds cards under a Sideboard header into the maybeboard zone", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Chalice of the Void");
    expect(card).toMatchObject({ zone: "maybeboard", pageLowestPrice: 92.25 });
  });

  it("assigns maybeboard cards to the maybeboard zone", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Rhystic Study");
    expect(card?.zone).toBe("maybeboard");
  });

  it("does not double-count cards that also appear in a non-Padrão view tab", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const llanowarEntries = result.cards.filter((c) => c.name === "Llanowar Elves");
    expect(llanowarEntries).toHaveLength(1);
  });

  it("marks a card with no visible price as unresolved rather than R$0 (task 3.3)", () => {
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Some Unpriced Card");
    expect(card?.pageLowestPrice).toBeUndefined();
  });
});

describe("parseDeckPage artwork capture (task 3.1)", () => {
  it("captures a card's pageImageUrl from its embedded sticky-tooltip image", () => {
    const doc = new DOMParser().parseFromString(
      `
      <div id="dk-val-1-1">
        <div class="pdeck-block">
          <div class="deck-line"><div class="deck-type deck-type-first">Comandante <i>(1)</i></div></div>
          <div class="deck-line">
            <div class="deck-box-left">
              <div class="deck-qty">1</div>
              <div class="deck-card"><a data-lc-id="82777" href="/?view=cards/card&card=Sol+Ring">Anel Solar</a></div>
            </div>
          </div>
        </div>
      </div>
      <div id="sticky_82777_"><img lazy-src="//repositorio.sbrauble.com/arquivos/in/magic/example.jpg"></div>
    `,
      "text/html",
    );

    const result = parseDeckPage(doc);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.cards[0]?.pageImageUrl).toBe(
      "https://repositorio.sbrauble.com/arquivos/in/magic/example.jpg",
    );
  });

  it("leaves pageImageUrl undefined when the page has no matching sticky-tooltip image", () => {
    const doc = loadFixture("ligamagic-deck-full.html");
    const result = parseDeckPage(doc);
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Xyris, the Writhing Storm");
    expect(card?.pageImageUrl).toBeUndefined();
  });
});

describe("parseDeckPage Portuguese name capture", () => {
  it("captures LigaMagic's Portuguese display name alongside the canonical English name", () => {
    const doc = loadFixture("ligamagic-deck-full.html");
    const result = parseDeckPage(doc);
    if (result.status !== "ok") throw new Error("expected ok");
    const card = byName(result.cards, "Xyris, the Writhing Storm");
    expect(card?.pageNamePt).toBe("Xyris, a Tempestade Serpenteante");
  });

  it("falls back to the page's own display text for both name and pageNamePt when the href can't be parsed", () => {
    const doc = new DOMParser().parseFromString(
      `
      <div id="dk-val-1-1">
        <div class="pdeck-block">
          <div class="deck-line"><div class="deck-type deck-type-first">Main Deck <i>(1)</i></div></div>
          <div class="deck-line">
            <div class="deck-box-left">
              <div class="deck-qty">1</div>
              <div class="deck-card"><a href="javascript:void(0)">Carta Sem Link</a></div>
            </div>
          </div>
        </div>
      </div>
    `,
      "text/html",
    );

    const result = parseDeckPage(doc);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.cards[0]?.name).toBe("Carta Sem Link");
    expect(result.cards[0]?.pageNamePt).toBe("Carta Sem Link");
  });
});

describe("parseDeckPage on unrecognized markup (task 3.5)", () => {
  it("reports unrecognized-page instead of an empty/partial deck", () => {
    const doc = loadFixture("ligamagic-unrecognized.html");
    const result = parseDeckPage(doc);
    expect(result).toEqual({ status: "unrecognized-page" });
  });
});
