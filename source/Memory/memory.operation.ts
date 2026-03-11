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
 * @description This class is responsible for caching data in memory with smart TTL management
 * @class InMemoryCache
 * @export InMemoryCache
 * @version 2.0.0
 * @since 23 April 2025
 *
 * Features:
 * - Random TTL per entry (5-15 minutes) to prevent cache stampede
 * - Selective cache invalidation by collection/document
 * - Auto-cleanup of expired entries
 **/
export class InMemoryCache {
  // Properties
  private readonly ttl: number;  // Kept for backward compatibility
  private cacheObject: Map<string, CacheEntry>;
  private tempSearchQuery: Array<{ queryString: any; registeredAt: Date }> = [];
  private readonly autoResetCacheInterval: number = 86400; // 24 hours
  /**
   * Creates a new instance of the cache operation class
   * @param TTL - Time to live in seconds for cache entries. Defaults to 86400 seconds (24 hours)
   */
  constructor(TTL: string | number = 86400) {
    this.ttl = typeof TTL === "string" ? parseInt(TTL) : TTL;
    this.cacheObject = new Map();
    this.tempSearchQuery = [];
    // this.autoResetCacheInterval is already initialized to 86400 (24 hours)
    this.autoResetCache(); // Start the auto-reset cache process
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
   * Sets a value in the cache with the specified key.
   * Each cache entry gets a random TTL (5-15 minutes) to prevent cache stampede.
   *
   * OPTIMIZED:
   * - Immediate caching without threshold
   * - Random TTL per entry prevents synchronized expiration
   * - Pre-computed expiration time for O(1) validation
   *
   * @param key - The unique identifier for the cached item
   * @param value - The value to be stored in the cache
   * @returns A Promise that resolves when the value has been cached
   *
   * @example
   * ```typescript
   * await cache.setCache('user-123', { name: 'John', age: 30 });
   * ```
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

  public async setTempSearchQuery(queryString: any): Promise<boolean> {
    // Track query for analytics/monitoring purposes only
    // No longer blocks caching - immediate caching is now enabled
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

    // Check if expired using pre-computed expiresAt
    const now = new Date();
    if (now >= cacheItem.expiresAt) {
      // Lazy cleanup: Remove expired entry
      this.cacheObject.delete(key);
      return false;
    }

    return cacheItem.value;
  }

  /**
   * Clears all cached data stored in memory.
   * Resets the cache object and temporary search query array to their initial empty states.
   *
   * @returns A Promise that resolves to true when the cache has been successfully cleared.
   */
  public async clearAllCache(): Promise<boolean> {
    // clear all cache
    this.cacheObject.clear();
    this.tempSearchQuery = [];
    return true;
  }

  /**
   * Invalidates all cache entries for a specific collection
   * Used for selective cache invalidation to preserve unrelated caches
   *
   * @param collectionPath - The filesystem path to the collection (e.g., "/db/users")
   * @returns A Promise that resolves to true when invalidation is complete
   *
   * @example
   * ```typescript
   * await cache.invalidateByCollection('/db/users');
   * // Only /db/users cache cleared, /db/orders cache remains
   * ```
   */
  public async invalidateByCollection(collectionPath: string): Promise<boolean> {
    const keysToDelete: string[] = [];

    // Find all cache keys belonging to this collection
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
   * Invalidates cache entries that could be affected by a single document update/delete
   *
   * Strategy: Conservative - invalidates entire collection cache because we can't
   * determine which queries matched this specific document without re-executing them.
   *
   * @param collectionPath - The filesystem path to the collection
   * @param documentId - The ID of the document that was modified (used for logging/future optimization)
   * @returns A Promise that resolves to true when invalidation is complete
   *
   * @example
   * ```typescript
   * await cache.invalidateByDocument('/db/users', 'user123');
   * ```
   */
  public async invalidateByDocument(collectionPath: string, documentId: string): Promise<boolean> {
    // Conservative approach: invalidate entire collection
    // Reason: Can't determine which queries matched this document without re-executing
    // Alternative (complex): Maintain reverse index of documentId -> cache keys
    return this.invalidateByCollection(collectionPath);
  }

  /**
   * Invalidates cache entries affected by multiple document updates/deletes
   *
   * @param collectionPath - The filesystem path to the collection
   * @param documentIds - Array of document IDs that were modified
   * @returns A Promise that resolves to true when invalidation is complete
   *
   * @example
   * ```typescript
   * await cache.invalidateByDocuments('/db/users', ['user1', 'user2', 'user3']);
   * ```
   */
  public async invalidateByDocuments(collectionPath: string, documentIds: string[]): Promise<boolean> {
    // Same conservative strategy as single document
    return this.invalidateByCollection(collectionPath);
  }

  /**
   * Retrieves detailed information about the current state of the cache.
   *
   * This method calculates:
   * - Total estimated size of the cache in bytes (including keys, values, and timestamps)
   * - Available system memory (in Node.js environments)
   * - Number of items currently in the cache
   * - Number of temporary search queries stored
   *
   * @returns {Promise<any>} A promise that resolves to an object containing cache details:
   *   - cacheSizeInBytes: Estimated size of the cache in bytes
   *   - availableMemoryInBytes: Available system memory in bytes (or -1 if not in Node.js)
   *   - cacheItemCount: Number of items in the cache
   *   - tempQueryCount: Number of temporary search queries
   *   - Or false if an error occurs during calculation
   *
   * @throws {Error} Logs the error to console but doesn't throw; returns false instead
   */
  public async getCacheDetails(): Promise<any> {
    try {
      // Calculate the total size of cache
      let totalCacheSize = 0;

      // Convert cache map to entries for size calculation
      for (const [key, value] of this.cacheObject.entries()) {
        // Estimate size of key
        totalCacheSize += key.length * 2; // String characters in JS use ~2 bytes

        // Estimate size of value using JSON stringify
        const valueSize = JSON.stringify(value.value).length * 2;
        totalCacheSize += valueSize;

        // Add size of Date object (~8 bytes)
        totalCacheSize += 8;
      }

      // Add size of temp search queries
      totalCacheSize += JSON.stringify(this.tempSearchQuery).length * 2;

      // Get total memory of the machine
      let availableMemory = 0;

      try {
        // Only works in Node.js environment
        availableMemory = os.freemem();
      } catch (error) {
        // If we're in a browser or other environment where os is not available
        availableMemory = -1;
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

  /**
   * Sets up an automatic cache reset mechanism.
   * Periodically cleans up expired cache entries and old search query tracking.
   *
   * OPTIMIZED: Uses pre-computed expiresAt for O(1) expiration checks
   * instead of computing time differences.
   *
   * @private
   * @returns {Promise<void>} A promise that resolves when the interval is set up.
   */
  private async autoResetCache(): Promise<void> {
    setInterval(
      () => {
        // Check if cache is empty
        if (this.cacheObject.size === 0) {
          return;
        }

        const now = new Date();
        const keysToDelete: string[] = [];

        // Collect expired entries using pre-computed expiresAt
        for (const [key, cacheItem] of this.cacheObject.entries()) {
          if (now >= cacheItem.expiresAt) {
            keysToDelete.push(key);
          }
        }

        // Batch delete for performance
        keysToDelete.forEach(key => this.cacheObject.delete(key));

        // Clean up old temp search queries (24-hour retention)
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
