/* eslint-disable @typescript-eslint/no-unused-vars */
import os from "os";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Cache entry with random TTL for improved performance
 */
interface CacheEntry {
  value: any;
  registeredAt: Date;
  ttl: number;        // Random TTL in milliseconds (5-15 min)
  expiresAt: Date;    // Pre-computed expiration timestamp
}

/**
 * Caches data in memory with smart TTL management:
 * - Random TTL per entry (5-15 minutes) to prevent cache stampede
 * - Selective cache invalidation by collection/document
 * - Auto-cleanup of expired entries
 */
export class InMemoryCache {
  private readonly ttl: number;  // Kept for backward compatibility
  private cacheObject: Map<string, CacheEntry>;
  private tempSearchQuery: Array<{ queryString: any; registeredAt: Date }> = [];
  private readonly autoResetCacheInterval: number = 86400; // 24 hours

  /** @param TTL - Time to live in seconds for cache entries. Defaults to 86400 seconds (24 hours) */
  constructor(TTL: string | number = 86400) {
    this.ttl = typeof TTL === "string" ? parseInt(TTL) : TTL;
    this.cacheObject = new Map();
    this.tempSearchQuery = [];
    this.autoResetCache();
  }

  /**
   * Generates a random TTL between 5-15 minutes
   * This prevents cache stampede (thundering herd problem)
   *
   * @returns Random TTL in milliseconds
   * @private
   */
  private generateRandomTTL(): number {
    const MIN_TTL = 5 * 60 * 1000;   // 5 minutes in milliseconds
    const MAX_TTL = 15 * 60 * 1000;  // 15 minutes in milliseconds
    return Math.floor(Math.random() * (MAX_TTL - MIN_TTL + 1)) + MIN_TTL;
  }

  /**
   * Each cache entry gets its own random TTL (5-15 minutes) to prevent cache stampede
   * (synchronized mass-expiration), with expiresAt pre-computed for O(1) validation later.
   * @example
   * await cache.setCache('user-123', { name: 'John', age: 30 });
   */
  public async setCache(key: string, value: any): Promise<boolean> {
    const ttl = this.generateRandomTTL();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl);

    this.cacheObject.set(key, {
      value: value,
      registeredAt: now,
      ttl: ttl,
      expiresAt: expiresAt,
    });

    return true;
  }

  /** Tracked for analytics/monitoring only - does not gate or block caching. */
  public async setTempSearchQuery(queryString: any): Promise<boolean> {
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
  public async getCache(key: string): Promise<any | boolean> {
    const cacheItem = this.cacheObject.get(key);
    if (!cacheItem) {
      return false;
    }

    const now = new Date();
    if (now >= cacheItem.expiresAt) {
      // Lazy cleanup on read
      this.cacheObject.delete(key);
      return false;
    }

    return cacheItem.value;
  }

  public async clearAllCache(): Promise<boolean> {
    this.cacheObject.clear();
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

    // Batch delete for performance
    keysToDelete.forEach(key => this.cacheObject.delete(key));

    return true;
  }

  /**
   * Conservative strategy: invalidates the whole collection's cache rather than just this
   * document's entries, since we can't tell which cached queries matched it without
   * re-executing them (would need a reverse index of documentId -> cache keys to do better).
   */
  public async invalidateByDocument(collectionPath: string, documentId: string): Promise<boolean> {
    return this.invalidateByCollection(collectionPath);
  }

  /** Same conservative strategy as invalidateByDocument, for a batch of documents. */
  public async invalidateByDocuments(collectionPath: string, documentIds: string[]): Promise<boolean> {
    return this.invalidateByCollection(collectionPath);
  }

  /** Returns estimated cache size/memory stats, or false if calculation fails (logged, not thrown). */
  public async getCacheDetails(): Promise<any> {
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
      } catch (error) {
        availableMemory = -1; // e.g. running in a browser environment
      }

      return {
        cacheSizeInBytes: totalCacheSize,
        availableMemoryInBytes: availableMemory,
        cacheItemCount: this.cacheObject.size,
        tempQueryCount: this.tempSearchQuery.length,
      };
    } catch (error) {
      console.error("Error getting cache details:", error);
      return false;
    }
  }

  /** Periodically evicts expired cache entries and old search-query tracking. */
  private async autoResetCache(): Promise<void> {
    setInterval(
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

        keysToDelete.forEach(key => this.cacheObject.delete(key));

        // 24-hour retention for temp search queries
        this.tempSearchQuery = this.tempSearchQuery.filter((item) => {
          const diff = Math.abs(now.getTime() - item.registeredAt.getTime());
          return diff < this.autoResetCacheInterval * 1000;
        });
      },
      parseInt(String(this.ttl)),
    );
  }
}
export default new InMemoryCache(86400); // 24 hours
