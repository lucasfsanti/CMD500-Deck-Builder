import { describe, expect, it } from "vitest";
import { normalizeCardName } from "./normalize-name";

describe("normalizeCardName", () => {
  it("strips accents introduced by Portuguese LigaMagic listings", () => {
    expect(normalizeCardName("Relíquia da Serra")).toBe("Reliquia da Serra");
  });

  it("collapses repeated internal whitespace", () => {
    expect(normalizeCardName("Sol   Ring")).toBe("Sol Ring");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeCardName("  Sol Ring  ")).toBe("Sol Ring");
  });

  it("takes only the front face name for a double-faced card", () => {
    expect(normalizeCardName("Delver of Secrets // Insectile Aberration")).toBe(
      "Delver of Secrets",
    );
  });

  it("leaves an already-normalized English name unchanged", () => {
    expect(normalizeCardName("Lightning Bolt")).toBe("Lightning Bolt");
  });
});
