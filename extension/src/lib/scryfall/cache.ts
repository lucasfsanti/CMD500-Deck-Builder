export interface KeyValueStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
}

/** In-memory store, used by default outside a real extension context (tests, SSR-less dev). */
export class MemoryStore implements KeyValueStore {
  private data = new Map<string, unknown>();

  async get(key: string): Promise<unknown> {
    return this.data.get(key);
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, value);
  }
}

/** Adapts chrome.storage.local to the KeyValueStore interface used by the cache. */
export class ChromeLocalStore implements KeyValueStore {
  async get(key: string): Promise<unknown> {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  async set(key: string, value: unknown): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }
}

interface CacheEntry<T> {
  value: T;
  cachedAt: number;
}

/**
 * A simple time-boxed cache: reuses a stored value until it is older than
 * `freshnessMs`, after which a lookup is treated as a miss. Used to keep
 * repeat Scryfall lookups within the same card off the network, per the
 * card-data-service spec's caching requirement.
 */
export class TimedCache<T> {
  constructor(
    private readonly store: KeyValueStore,
    private readonly namespace: string,
    private readonly freshnessMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async get(key: string): Promise<T | undefined> {
    const raw = await this.store.get(this.namespaceKey(key));
    if (!raw) return undefined;
    const entry = raw as CacheEntry<T>;
    if (this.now() - entry.cachedAt > this.freshnessMs) return undefined;
    return entry.value;
  }

  async set(key: string, value: T): Promise<void> {
    const entry: CacheEntry<T> = { value, cachedAt: this.now() };
    await this.store.set(this.namespaceKey(key), entry);
  }

  private namespaceKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}
