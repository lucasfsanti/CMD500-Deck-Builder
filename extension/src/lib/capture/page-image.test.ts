import { describe, expect, it } from "vitest";
import { extractPageImageUrl } from "./page-image";

function parseFragment(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("extractPageImageUrl (task 3.1)", () => {
  it("resolves a card's artwork URL from its matching sticky-tooltip image", () => {
    const doc = parseFragment(`
      <a data-lc-id="82777">Thranduil, the Elvenking</a>
      <div id="sticky_82777_"><img lazy-src="//repositorio.sbrauble.com/arquivos/in/magic/481001/example.jpg"></div>
    `);
    const cardEl = doc.querySelector("a")!;

    expect(extractPageImageUrl(cardEl)).toBe(
      "https://repositorio.sbrauble.com/arquivos/in/magic/481001/example.jpg",
    );
  });

  it("returns undefined when the card link has no data-lc-id", () => {
    const doc = parseFragment(`<a>Some Card</a>`);
    const cardEl = doc.querySelector("a")!;

    expect(extractPageImageUrl(cardEl)).toBeUndefined();
  });

  it("returns undefined when no matching sticky-tooltip element exists", () => {
    const doc = parseFragment(`<a data-lc-id="99999">Untracked Card</a>`);
    const cardEl = doc.querySelector("a")!;

    expect(extractPageImageUrl(cardEl)).toBeUndefined();
  });

  it("returns undefined when the sticky element has no image src", () => {
    const doc = parseFragment(`
      <a data-lc-id="123">Card</a>
      <div id="sticky_123_"><img></div>
    `);
    const cardEl = doc.querySelector("a")!;

    expect(extractPageImageUrl(cardEl)).toBeUndefined();
  });
});
