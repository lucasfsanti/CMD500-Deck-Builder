import { describe, expect, it } from "vitest";
import { manaRailForColorIdentity, manaVarForColorLabel, MANA_PENDING_VAR } from "./mana-colors";

describe("manaRailForColorIdentity", () => {
  it("maps a mono-color identity to that mana color, no keyline", () => {
    expect(manaRailForColorIdentity(["U"])).toEqual({ colorVar: "var(--c500-mana-u)", keyline: false });
  });

  it("maps a multicolor identity to the gold token", () => {
    expect(manaRailForColorIdentity(["W", "U"])).toEqual({
      colorVar: "var(--c500-mana-gold)",
      keyline: false,
    });
  });

  it("maps an empty (colorless) identity to the colorless token", () => {
    expect(manaRailForColorIdentity([])).toEqual({ colorVar: "var(--c500-mana-c)", keyline: false });
  });

  it("maps an unresolved (undefined) identity to the neutral pending token", () => {
    expect(manaRailForColorIdentity(undefined)).toEqual({ colorVar: MANA_PENDING_VAR, keyline: false });
  });

  it("does not flag the White rail for a keyline (plenty of contrast against the dark background)", () => {
    expect(manaRailForColorIdentity(["W"])).toEqual({ colorVar: "var(--c500-mana-w)", keyline: false });
  });

  it("flags the Black rail for a keyline, since black sits close to the dark background", () => {
    expect(manaRailForColorIdentity(["B"])).toEqual({ colorVar: "var(--c500-mana-b)", keyline: true });
  });
});

describe("manaVarForColorLabel", () => {
  it("maps every colorBuckets() label to its mana token", () => {
    expect(manaVarForColorLabel("Colorless")).toBe("var(--c500-mana-c)");
    expect(manaVarForColorLabel("White")).toBe("var(--c500-mana-w)");
    expect(manaVarForColorLabel("Blue")).toBe("var(--c500-mana-u)");
    expect(manaVarForColorLabel("Black")).toBe("var(--c500-mana-b)");
    expect(manaVarForColorLabel("Red")).toBe("var(--c500-mana-r)");
    expect(manaVarForColorLabel("Green")).toBe("var(--c500-mana-g)");
    expect(manaVarForColorLabel("Multicolor")).toBe("var(--c500-mana-gold)");
  });
});
