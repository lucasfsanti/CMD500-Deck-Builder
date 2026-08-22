import { describe, expect, it } from "vitest";
import { detectLigaMagicPage } from "./page-detection";

describe("detectLigaMagicPage (task 2.2)", () => {
  it("detects a deck page", () => {
    expect(
      detectLigaMagicPage(new URL("https://www.ligamagic.com.br/?view=dks/deck&id=10174508")),
    ).toBe("deck");
  });

  it("detects a collection page", () => {
    expect(
      detectLigaMagicPage(new URL("https://www.ligamagic.com.br/?view=colecao/colecao")),
    ).toBe("collection");
  });

  it("stays inactive on an unrelated LigaMagic page", () => {
    expect(
      detectLigaMagicPage(new URL("https://www.ligamagic.com.br/?view=forum/mensagem&id=1")),
    ).toBe("none");
  });

  it("stays inactive on a non-LigaMagic host", () => {
    expect(detectLigaMagicPage(new URL("https://example.com/?view=dks/deck&id=1"))).toBe("none");
  });

  it("stays inactive on the bare LigaMagic homepage", () => {
    expect(detectLigaMagicPage(new URL("https://www.ligamagic.com.br/"))).toBe("none");
  });
});
