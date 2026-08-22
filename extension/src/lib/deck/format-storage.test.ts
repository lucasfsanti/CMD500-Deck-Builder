import { describe, expect, it } from "vitest";
import { getStoredFormat, setStoredFormat } from "./format-storage";
import { MemoryStore } from "../scryfall/cache";

describe("format-storage (task 6.1 persistence)", () => {
  it("returns undefined when nothing has been stored for a deck yet", async () => {
    const store = new MemoryStore();
    expect(await getStoredFormat("123", store)).toBeUndefined();
  });

  it("round-trips a stored format for a specific deck", async () => {
    const store = new MemoryStore();
    await setStoredFormat("123", "commander500Duel", store);
    expect(await getStoredFormat("123", store)).toBe("commander500Duel");
  });

  it("keeps different decks' stored formats independent", async () => {
    const store = new MemoryStore();
    await setStoredFormat("123", "commander500Duel", store);
    await setStoredFormat("456", "commander500", store);
    expect(await getStoredFormat("123", store)).toBe("commander500Duel");
    expect(await getStoredFormat("456", store)).toBe("commander500");
  });
});
