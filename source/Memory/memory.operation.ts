import os from "os";
import Logger from "../Helper/Logger.helper";


export interface InMemoryCacheOptions {
  /** When false the cache stores nothing and every lookup misses. Defaults to true. */
  enabled?: boolean;
  /** Minimum entry lifetime in minutes. Defaults to 5. */
  minTTL?: number;
  /** Maximum entry lifetime in minutes. Defaults to 15. */
  maxTTL?: number;
  /** Housekeeping cleanup cadence and search-query retention, in seconds. Defaults to 86400 (24 hours). */
  cacheClearUp?: number;
}

/**
 * Cache entry with random TTL for improved performance
 */
interface CacheEntry {
  value: unknown;
  registeredAt: Date;
  ttl: number;        // Random TTL in milliseconds (minTTL-maxTTL)
  expiresAt: Date;    // Pre-computed expiration timestamp
  documentKeys?: string[]; // "{collectionPath}::{documentId}" entries this result contains, for reverse invalidation
}

/**
 * Caches data in memory with smart TTL management:
 * - Random TTL per entry (5-15 minutes) to prevent cache stampede
 * - Selective cache invalidation by collection/document
 * - Auto-cleanup of expired entries
 */
export class InMemoryCache {
  private readonly enabled: boolean;
  private readonly minTTL: number;
  private readonly maxTTL: number;
  private readonly cacheClearUp: number;
  private cacheObject: Map<string, CacheEntry>;
  private tempSearchQuery: Array<{ queryString: Record<string, unknown>; registeredAt: Date }> = [];
  // Reverse index: "{collectionPath}::{documentId}" -> cache keys whose cached result contains that document.
  // Lets invalidateByDocument(s) evict only the affected entries instead of the whole collection's cache.
  private documentIndex: Map<string, Set<string>> = new Map();

  /**
   * @param TTL - InMemoryCacheOptions, or a legacy numeric/string value treated as `cacheClearUp`.
   */
  constructor(TTL: string | number | InMemoryCacheOptions = {}) {
    const options: InMemoryCacheOptions = typeof TTL === "object" ? TTL : { cacheClearUp: Number(TTL) || undefined };

    const minMinutes = options.minTTL ?? 5;
    const maxMinutes = options.maxTTL ?? 15;
    if (typeof minMinutes !== "number" || typeof maxMinutes !== "number" || minMinutes <= 0 || maxMinutes <= 0 || maxMinutes < minMinutes) {
      throw new Error("Invalid cache TTL: minTTL and maxTTL must be positive minutes and maxTTL must be >= minTTL.");
    }

    this.cacheClearUp = options.cacheClearUp ?? 86400;
    if (typeof this.cacheClearUp !== "number" || this.cacheClearUp <= 0) {
      throw new Error("cacheClearUp must be a positive number of seconds.");
    }

    this.enabled = options.enabled ?? true;
    this.minTTL = minMinutes * 60 * 1000;
    this.maxTTL = maxMinutes * 60 * 1000;
    this.cacheObject = new Map();
    this.tempSearchQuery = [];
    this.autoResetCache();
  }

  /**
   * Generates a random TTL between minTTL and maxTTL
   * This prevents cache stampede (thundering herd problem)
   *
   * @returns Random TTL in milliseconds
   * @private
   */
  private generateRandomTTL(): number {
    return Math.floor(Math.random() * (this.maxTTL - this.minTTL + 1)) + this.minTTL;
  }

  /**
   * Each cache entry gets its own random TTL (5-15 minutes) to prevent cache stampede
   * (synchronized mass-expiration), with expiresAt pre-computed for O(1) validation later.
   *
   * @param collectionPath - When provided and `value` is an array of documents (each with a
   *   `documentId`), the entry is registered in the reverse document index so a future
   *   invalidateByDocument(s) call can evict exactly this entry instead of the whole collection.
   * @example
   * await cache.setCache('user-123', { name: 'John', age: 30 });
   */
  public async setCache(key: string, value: unknown, collectionPath?: string): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }
    const ttl = this.generateRandomTTL();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    let documentKeys: string[] | undefined;
    if (collectionPath && Array.isArray(value)) {
      documentKeys = [];
      for (const doc of value) {
        if (doc && typeof doc === "object" && typeof doc.documentId === "string") {
          const docKey = `${collectionPath}::${doc.documentId}`;
          documentKeys.push(docKey);

          let keysForDoc = this.documentIndex.get(docKey);
          if (!keysForDoc) {
            keysForDoc = new Set();
            this.documentIndex.set(docKey, keysForDoc);
          }
          keysForDoc.add(key);
        }
      }
    }

    this.cacheObject.set(key, {
      value: value,
      registeredAt: now,
      ttl: ttl,
      expiresAt: expiresAt,
      documentKeys: documentKeys,
    });

    return true;
  }

  /**
   * Removes a single cache entry and cleans up any reverse document-index references to it,
   * preventing the index from accumulating stale entries as the cache turns over.
   */
  private evictCacheEntry(key: string): void {
    const entry = this.cacheObject.get(key);
    if (!entry) {
      return;
    }
    this.cacheObject.delete(key);

    if (entry.documentKeys) {
      for (const docKey of entry.documentKeys) {
        const keysForDoc = this.documentIndex.get(docKey);
        if (keysForDoc) {
          keysForDoc.delete(key);
          if (keysForDoc.size === 0) {
            this.documentIndex.delete(docKey);
          }
        }
      }
    }
  }

  /** Tracked for analytics/monitoring only - does not gate or block caching. */
  public async setTempSearchQuery(queryString: Record<string, unknown>): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }
    this.tempSearchQuery.push({
      queryString: queryString,
      registeredAt: new Date(),
    });
    return true;
  }

  /**
   * Retrieves a value from the cache using the specified key
   * Validates TTL expiration and auto-deletes expired entries
   *
   * @param key - The unique identifier to lookup in the cache
   * @returns A Promise that resolves to the cached value if found and not expired, false otherwise
   */
  public async getCache(key: string): Promise<unknown | false> {
    if (!this.enabled) {
      return false;
    }
    const cacheItem = this.cacheObject.get(key);
    if (!cacheItem) {
      return false;
    }

    const now = new Date();
    if (now >= cacheItem.expiresAt) {
      // Lazy cleanup on read
      this.evictCacheEntry(key);
      return false;
    }

    return cacheItem.value;
  }

  public async clearAllCache(): Promise<boolean> {
    this.cacheObject.clear();
    this.documentIndex.clear();
    this.tempSearchQuery = [];
    return true;
  }

  /**
   * Selective invalidation (only this collection's cache entries, others untouched).
   * @example
   * await cache.invalidateByCollection('/db/users');
   * // Only /db/users cache cleared, /db/orders cache remains
   */
  public async invalidateByCollection(collectionPath: string): Promise<boolean> {
    const keysToDelete: string[] = [];

    for (const [key] of this.cacheObject.entries()) {
      // Cache keys format: {collectionPath}::{query}::{limit}::{skip}::{sort}
      if (key.startsWith(`${collectionPath}::`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.evictCacheEntry(key));

    return true;
  }

  /**
   * Evicts only the cache entries that actually contained this document (via the reverse
   * document index), leaving cached results for unrelated documents in the same collection
   * untouched. If the document was never part of any cached result (e.g. it's brand new),
   * this is a no-op - callers inserting a new document should use invalidateByCollection
   * instead, since a cached "list"/filter query could now be missing it.
   *
   * Note: for updates, a cached filtered query that the document's *old* values didn't match
   * won't be invalidated even if the new values would now match it. That staleness is bounded
   * by the existing cache TTL (5-15 min), the same eventual-consistency window already used by
   * the index cache elsewhere in this engine.
   */
  public async invalidateByDocument(collectionPath: string, documentId: string): Promise<boolean> {
    const docKey = `${collectionPath}::${documentId}`;
    const keysForDoc = this.documentIndex.get(docKey);
    if (!keysForDoc) {
      return true;
    }

    // Snapshot before iterating - evictCacheEntry mutates keysForDoc (same Set) as it goes
    for (const key of Array.from(keysForDoc)) {
      this.evictCacheEntry(key);
    }

    return true;
  }

  /** Same targeted strategy as invalidateByDocument, for a batch of documents. */
  public async invalidateByDocuments(collectionPath: string, documentIds: string[]): Promise<boolean> {
    const keysToEvict = new Set<string>();

    for (const documentId of documentIds) {
      const docKey = `${collectionPath}::${documentId}`;
      const keysForDoc = this.documentIndex.get(docKey);
      if (keysForDoc) {
        keysForDoc.forEach(key => keysToEvict.add(key));
      }
    }

    keysToEvict.forEach(key => this.evictCacheEntry(key));

    return true;
  }

  /** Returns estimated cache size/memory stats, or false if calculation fails (logged, not thrown). */
  public async getCacheDetails(): Promise<{ cacheSizeInBytes: number; availableMemoryInBytes: number; cacheItemCount: number; tempQueryCount: number } | false> {
    try {
      let totalCacheSize = 0;

      for (const [key, value] of this.cacheObject.entries()) {
        totalCacheSize += key.length * 2; // JS string chars are ~2 bytes each
        const valueSize = JSON.stringify(value.value).length * 2;
        totalCacheSize += valueSize;

        totalCacheSize += 8; // Date object, ~8 bytes
      }

      totalCacheSize += JSON.stringify(this.tempSearchQuery).length * 2;

      let availableMemory = 0;

      try {
        availableMemory = os.freemem(); // only available in Node.js
      } catch {
        availableMemory = -1; // e.g. running in a browser environment
      }

      return {
        cacheSizeInBytes: totalCacheSize,
        availableMemoryInBytes: availableMemory,
        cacheItemCount: this.cacheObject.size,
        tempQueryCount: this.tempSearchQuery.length,
      };
    } catch (error) {
      Logger.error("Error getting cache details:", error);
      return false;
    }
  }

  /** Periodically evicts expired cache entries and old search-query tracking. */
  private async autoResetCache(): Promise<void> {
    const interval = setInterval(
      () => {
        if (this.cacheObject.size === 0) {
          return;
        }

        const now = new Date();
        const keysToDelete: string[] = [];

        for (const [key, cacheItem] of this.cacheObject.entries()) {
          if (now >= cacheItem.expiresAt) {
            keysToDelete.push(key);
          }
        }

        keysToDelete.forEach(key => this.evictCacheEntry(key));

        // cacheClearUp retention for temp search queries
        this.tempSearchQuery = this.tempSearchQuery.filter((item) => {
          const diff = Math.abs(now.getTime() - item.registeredAt.getTime());
          return diff < this.cacheClearUp * 1000;
        });
      },
      parseInt(String(this.cacheClearUp)),
    );

    // Background housekeeping must never be the reason a short-lived script or CLI
    // tool (a stated core use case) can't exit on its own - same reasoning as
    // IndexCache's cleanup interval.
    if (interval.unref) {
      interval.unref();
    }
  }
}
