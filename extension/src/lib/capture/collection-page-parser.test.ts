import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseCollectionPage } from "./collection-page-parser";

function loadFixture(name: string): Document {
  const filePath = path.join(process.cwd(), "test/fixtures", name);
  const html = readFileSync(filePath, "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

describe("parseCollectionPage (task 3.2, best-effort — see file header)", () => {
  it("captures cards with name, quantity, and price from the collection's distinct markup", () => {
    const doc = loadFixture("ligamagic-collection.html");
    const result = parseCollectionPage(doc);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.cards).toHaveLength(2);
    expect(result.cards[0]).toMatchObject({
      name: "Sol Ring",
      quantity: 2,
      pageLowestPrice: 4,
    });
  });

  it("marks a card with no visible price as unresolved", () => {
    const doc = loadFixture("ligamagic-collection.html");
    const result = parseCollectionPage(doc);
    if (result.status !== "ok") throw new Error("expected ok");
    const card = result.cards.find((c) => c.name === "Rhystic Study");
    expect(card?.pageLowestPrice).toBeUndefined();
  });

  it("reports unrecognized-page when no card rows are found", () => {
    const doc = new DOMParser().parseFromString("<div>nothing here</div>", "text/html");
    expect(parseCollectionPage(doc)).toEqual({ status: "unrecognized-page" });
  });

  it("captures a card's pageImageUrl from its embedded sticky-tooltip image (task 3.1)", () => {
    const doc = new DOMParser().parseFromString(
      `
      <div class="deck-line">
        <div class="deck-qty">1</div>
        <div class="deck-card"><a data-lc-id="82777" href="/?view=cards/card&card=Sol+Ring">Anel Solar</a></div>
        <div class="deck-price"></div>
      </div>
      <div id="sticky_82777_"><img lazy-src="//repositorio.sbrauble.com/arquivos/in/magic/example.jpg"></div>
    `,
      "text/html",
    );

    const result = parseCollectionPage(doc);

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.cards[0]?.pageImageUrl).toBe(
      "https://repositorio.sbrauble.com/arquivos/in/magic/example.jpg",
    );
  });
});
