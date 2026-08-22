import { describe, expect, it, vi } from "vitest";
import { ScryfallClient } from "./client";
import { lookupCommander500DuelCategory } from "../banlist/commander-500-duel";

describe("degraded mode when Scryfall is unreachable (task 1.9)", () => {
  it("reports enrichment and Commander 500 legality as unavailable, while Commander 500 Duel legality is unaffected", async () => {
    const offlineFetch = vi.fn(async () => {
      throw new Error("network unreachable");
    });
    const client = new ScryfallClient({ fetchImpl: offlineFetch });

    const enrichment = await client.lookupCard("Sol Ring");
    expect(enrichment).toEqual({ status: "unavailable" });

    // Commander 500 Duel legality comes entirely from the bundled dataset and
    // never touches the network, so the same outage does not affect it.
    const duelCategory = lookupCommander500DuelCategory("Sol Ring");
    expect(duelCategory).toBe("banned-in-deck");
  });
});
