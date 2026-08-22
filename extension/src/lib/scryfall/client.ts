import { normalizeCardName } from "./normalize-name";
import { TimedCache, MemoryStore, type KeyValueStore } from "./cache";
import type { CardEnrichment, CardLayout, EnrichmentResult } from "../deck/types";

const SCRYFALL_BASE = "https://api.scryfall.com";
const ENRICHMENT_FRESHNESS_MS = 1000 * 60 * 60 * 24 * 7; // 7 days: card attributes rarely change

interface ScryfallCardResponse {
  name: string;
  type_line: string;
  color_identity: string[];
  cmc: number;
  layout: string;
  legalities: Record<string, string>;
  id: string;
  prints_search_uri: string;
}

interface ScryfallListResponse<T> {
  object: "list";
  data: T[];
  has_more?: boolean;
  next_page?: string;
}

interface ScryfallPrintResponse {
  set: string;
  collector_number: string;
  games: string[];
  promo: boolean;
  digital: boolean;
  border_color: string;
}

export interface EligiblePrinting {
  set: string;
  collectorNumber: string;
}

const KNOWN_LAYOUTS: ReadonlySet<string> = new Set([
  "normal",
  "split",
  "flip",
  "transform",
  "modal_dfc",
  "meld",
  "adventure",
  "leveler",
  "saga",
  "class",
]);

function toCardLayout(layout: string): CardLayout {
  return KNOWN_LAYOUTS.has(layout) ? (layout as CardLayout) : "other";
}

function toEnrichment(card: ScryfallCardResponse): CardEnrichment {
  return {
    name: card.name,
    typeLine: card.type_line,
    colorIdentity: card.color_identity,
    cmc: card.cmc,
    layout: toCardLayout(card.layout),
    legalInCommander: card.legalities["commander"] === "legal",
    scryfallId: card.id,
  };
}

export interface ScryfallClientOptions {
  fetchImpl?: typeof fetch;
  store?: KeyValueStore;
  enrichmentFreshnessMs?: number;
}

/**
 * Calls Scryfall's public API directly (no project-owned backend, per the
 * card-data-service capability's direct-fetch design) for card enrichment,
 * Commander 500 legality, and lowest-price-eligible printings, caching
 * results locally to respect Scryfall's fair-use rate limits.
 */
export class ScryfallClient {
  private readonly fetchImpl: typeof fetch;
  private readonly cache: TimedCache<EnrichmentResult>;

  constructor(options: ScryfallClientOptions = {}) {
    // fetch is a native method that requires `this` to be the global scope;
    // storing the bare reference and calling it as `this.fetchImpl(...)`
    // rebinds `this` to the class instance and throws "Illegal invocation".
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
    this.cache = new TimedCache<EnrichmentResult>(
      options.store ?? new MemoryStore(),
      "scryfall-enrichment",
      options.enrichmentFreshnessMs ?? ENRICHMENT_FRESHNESS_MS,
    );
  }

  async lookupCard(rawName: string): Promise<EnrichmentResult> {
    const normalized = normalizeCardName(rawName);
    const cached = await this.cache.get(normalized);
    if (cached) return cached;

    let result: EnrichmentResult;
    try {
      const response = await this.fetchImpl(
        `${SCRYFALL_BASE}/cards/named?fuzzy=${encodeURIComponent(normalized)}`,
      );
      if (response.status === 404) {
        result = { status: "not-found" };
      } else if (!response.ok) {
        result = { status: "unavailable" };
      } else {
        const card = (await response.json()) as ScryfallCardResponse;
        result = { status: "ok", card: toEnrichment(card) };
      }
    } catch {
      result = { status: "unavailable" };
    }

    // Only cache stable outcomes; a transient "unavailable" should be retried next time.
    if (result.status !== "unavailable") {
      await this.cache.set(normalized, result);
    }
    return result;
  }

  /**
   * Returns the set of printings eligible for Commander 500's lowest-price
   * comparison: real paper printings with a comparable LigaMagic listing,
   * excluding digital-only and promo-only prints.
   */
  async lookupEligiblePrintings(scryfallId: string): Promise<EligiblePrinting[] | undefined> {
    try {
      const cardResponse = await this.fetchImpl(`${SCRYFALL_BASE}/cards/${scryfallId}`);
      if (!cardResponse.ok) return undefined;
      const card = (await cardResponse.json()) as ScryfallCardResponse;

      const printings: EligiblePrinting[] = [];
      let nextUrl: string | undefined = card.prints_search_uri;
      while (nextUrl) {
        const printsResponse: Response = await this.fetchImpl(nextUrl);
        if (!printsResponse.ok) break;
        const page = (await printsResponse.json()) as ScryfallListResponse<ScryfallPrintResponse>;
        for (const print of page.data) {
          if (print.digital) continue;
          if (print.promo) continue;
          if (!print.games.includes("paper")) continue;
          printings.push({ set: print.set, collectorNumber: print.collector_number });
        }
        nextUrl = page.has_more ? page.next_page : undefined;
      }
      return printings;
    } catch {
      return undefined;
    }
  }
}
