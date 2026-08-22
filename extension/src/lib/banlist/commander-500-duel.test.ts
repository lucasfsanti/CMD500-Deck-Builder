import { describe, expect, it } from "vitest";
import {
  lookupCommander500DuelCategory,
  commander500DuelBanlistAsOf,
  commander500DuelBanlistSource,
} from "./commander-500-duel";

describe("Commander 500 Duel bundled banlist (task 1.6 / 1.7)", () => {
  it("exposes an as-of date and source for the bundled snapshot", () => {
    expect(commander500DuelBanlistAsOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(commander500DuelBanlistSource).toContain("duelcommander.org");
  });

  it("reports a banned-in-deck card correctly", () => {
    expect(lookupCommander500DuelCategory("Sol Ring")).toBe("banned-in-deck");
  });

  it("reports a banned-as-commander-only card correctly, distinct from banned-in-deck", () => {
    expect(lookupCommander500DuelCategory("Edgar Markov")).toBe("banned-as-commander");
  });

  it("reports the banned-as-companion card correctly", () => {
    expect(lookupCommander500DuelCategory("Lutri, the Spellchaser")).toBe("banned-as-companion");
  });

  it("folds offensive-content bans into banned-in-deck, since they can't be used anywhere", () => {
    expect(lookupCommander500DuelCategory("Crusade")).toBe("banned-in-deck");
  });

  it("matches a double-faced banned-as-commander card by its front face", () => {
    expect(lookupCommander500DuelCategory("Ajani, Nacatl Pariah")).toBe("banned-as-commander");
  });

  it("is accent- and whitespace-insensitive", () => {
    expect(lookupCommander500DuelCategory("  sol   ring  ")).toBe("banned-in-deck");
  });

  it("reports unrestricted for a card not on any list", () => {
    expect(lookupCommander500DuelCategory("Lightning Bolt")).toBe("unrestricted");
  });

  it("resolves synchronously, with no network round trip, for the bundled-dataset lookup path (task 1.7)", () => {
    const result = lookupCommander500DuelCategory("Sol Ring");
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toBe("banned-in-deck");
  });
});
