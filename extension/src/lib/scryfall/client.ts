import { normalizeCardName } from "./normalize-name";
import { TimedCache, MemoryStore, type KeyValueStore } from "./cache";
import { parseScryfallManaCost } from "./mana-cost";
import type { CardEnrichment, CardLayout, EnrichmentResult } from "../deck/types";

const SCRYFALL_BASE = "https://api.scryfall.com";
const ENRICHMENT_FRESHNESS_MS = 1000 * 60 * 60 * 24 * 7; // 7 days: card attributes rarely change

interface ScryfallImageUris {
  normal?: string;
}

interface ScryfallCardResponse {
  name: string;
  type_line: string;
  color_identity: string[];
  cmc: number;
  layout: string;
  legalities: Record<string, string>;
  id: string;
  prints_search_uri: string;
  /** Present for single-faced cards; absent for double-faced layouts (see card_faces). */
  image_uris?: ScryfallImageUris;
  /**
   * Present for double-faced/split-style layouts; each face may carry its own
   * image_uris and its own mana_cost (empty string when that face has no
   * printed cost, e.g. a transform card's back face or an MDFC land face).
   */
  card_faces?: Array<{ image_uris?: ScryfallImageUris; mana_cost?: string }>;
}

interface ScryfallListResponse<T> {
  object: "list";
  data: T[];
  has_more?: boolean;
  next_page?: string;
}

interface ScryfallCollectionResponse {
  data: ScryfallCardResponse[];
}

/** Scryfall's /cards/collection endpoint accepts at most this many identifiers per request. */
const COLLECTION_BATCH_SIZE = 75;

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

/**
 * Resolves a card's artwork URL. Single-faced cards carry image_uris at the
 * top level; double-faced/split-style layouts have no top-level image_uris
 * at all — the image lives under the first face instead.
 */
function resolveImageUrl(card: ScryfallCardResponse): string | undefined {
  return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal;
}

/**
 * Resolves per-face mana costs for a card with more than one face carrying
 * its own real printed cost (double-faced, split, adventure, ...) — the case
 * where LigaMagic's own page markup concatenates both costs with no way to
 * tell them apart. Undefined for a card with zero or one real per-face cost
 * (including a transform card's blank-cost back face, or a meld card, which
 * carries no card_faces mana_cost data at all), or if any face's cost can't
 * be confidently canonicalized — same "absence over wrong data" rule as the
 * rest of mana-cost handling.
 */
function resolveFaceManaCosts(card: ScryfallCardResponse): string[][] | undefined {
  const realCosts = (card.card_faces ?? [])
    .map((face) => face.mana_cost)
    .filter((cost): cost is string => Boolean(cost));
  if (realCosts.length < 2) return undefined;

  const parsed = realCosts.map(parseScryfallManaCost);
  return parsed.every((cost): cost is string[] => Boolean(cost)) ? parsed : undefined;
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
    imageUrl: resolveImageUrl(card),
    faceManaCosts: resolveFaceManaCosts(card),
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

    const result = await this.fetchByFuzzyName(normalized);

    // Only cache stable outcomes; a transient "unavailable" should be retried next time.
    if (result.status !== "unavailable") {
      await this.cache.set(normalized, result);
    }
    return result;
  }

  /**
   * Resolves enrichment for many cards at once via Scryfall's collection
   * endpoint (batched to its per-request identifier limit), which does exact
   * name matching — falling back to the fuzzy per-card lookup only for names
   * a batch didn't resolve. Cuts a full deck (~90 distinct cards) from ~90
   * individual requests to a handful, per card-data-service's spec.
   */
  async lookupCards(rawNames: string[]): Promise<Map<string, EnrichmentResult>> {
    const results = new Map<string, EnrichmentResult>();
    const uncachedRawNames: string[] = [];

    for (const rawName of rawNames) {
      const normalized = normalizeCardName(rawName);
      const cached = await this.cache.get(normalized);
      if (cached) {
        results.set(rawName, cached);
      } else {
        uncachedRawNames.push(rawName);
      }
    }

    // Multiple raw names can normalize to the same card; fetch each
    // distinct normalized name only once.
    const uniqueNormalized = [...new Set(uncachedRawNames.map(normalizeCardName))];
    const resolvedByNormalized = new Map<string, EnrichmentResult>();
    const unresolvedNormalized: string[] = [];

    for (let i = 0; i < uniqueNormalized.length; i += COLLECTION_BATCH_SIZE) {
      const chunk = uniqueNormalized.slice(i, i + COLLECTION_BATCH_SIZE);
      try {
        const response = await this.fetchImpl(`${SCRYFALL_BASE}/cards/collection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifiers: chunk.map((name) => ({ name })) }),
        });
        if (!response.ok) {
          unresolvedNormalized.push(...chunk);
          continue;
        }
        const body = (await response.json()) as ScryfallCollectionResponse;
        const matched = new Set<string>();
        for (const card of body.data) {
          const identifier =
            chunk.find((name) => name.toLowerCase() === card.name.toLowerCase()) ??
            normalizeCardName(card.name);
          resolvedByNormalized.set(identifier, { status: "ok", card: toEnrichment(card) });
          matched.add(identifier);
        }
        for (const name of chunk) {
          if (!matched.has(name)) unresolvedNormalized.push(name);
        }
      } catch {
        unresolvedNormalized.push(...chunk);
      }
    }

    // Fuzzy fallback, scoped to only what the batch couldn't resolve.
    for (const normalized of unresolvedNormalized) {
      resolvedByNormalized.set(normalized, await this.fetchByFuzzyName(normalized));
    }

    for (const [normalized, result] of resolvedByNormalized) {
      if (result.status !== "unavailable") {
        await this.cache.set(normalized, result);
      }
    }

    for (const rawName of uncachedRawNames) {
      const normalized = normalizeCardName(rawName);
      results.set(rawName, resolvedByNormalized.get(normalized) ?? { status: "unavailable" });
    }

    return results;
  }

  private async fetchByFuzzyName(normalized: string): Promise<EnrichmentResult> {
    try {
      const response = await this.fetchImpl(
        `${SCRYFALL_BASE}/cards/named?fuzzy=${encodeURIComponent(normalized)}`,
      );
      if (response.status === 404) return { status: "not-found" };
      if (!response.ok) return { status: "unavailable" };
      const card = (await response.json()) as ScryfallCardResponse;
      return { status: "ok", card: toEnrichment(card) };
    } catch {
      return { status: "unavailable" };
    }
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
