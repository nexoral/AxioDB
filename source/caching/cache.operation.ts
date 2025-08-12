/* eslint-disable @typescript-eslint/no-unused-vars */
import os from 'os';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description This class is responsible for caching data in memory
 * @class InMemoryCache
 * @export InMemoryCache
 * @version 1.0.1
 * @since 23 April 2025
 **/
export class InMemoryCache {
  // Properties
  private readonly ttl: number;
  private cacheObject: Map<string, { value: any; registeredAt: Date }>;
  private tempSearchQuery: Array<{ queryString: any; registeredAt: Date }> = [];
  private readonly autoResetCacheInterval: number = 86400; // 24 hours
  private readonly threshold: number = 2; // 2 times
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
   * Sets a value in the cache with the specified key.
   * The cached item will expire after the TTL (Time To Live) duration set for the cache.
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
    // check the key is already exceed the threshold or not
    const KeyStatus = await this.setTempSearchQuery(key);
    if (KeyStatus === true) {
      // check if the key is already in the cache
      const cacheItem = this.cacheObject.get(key);
      if (!cacheItem) {
        this.cacheObject.set(key, {
          value: value,
          registeredAt: new Date(),
        });
        return true;
      } else {
        // check if the cache is expired or not
        const now = new Date();
        const diff = Math.abs(now.getTime() - cacheItem.registeredAt.getTime());
        if (diff > this.ttl * 1000) {
          // if the cache is expired, remove it from the cache
          this.cacheObject.delete(key);
          this.cacheObject.set(key, {
            value: value,
            registeredAt: new Date(),
          });
          return true;
        } else {
          return true;
        }
      }
    } else {
      return false;
    }
  }

  public async setTempSearchQuery(queryString: any): Promise<boolean> {
    // check if the query string is already in the temp search query for the threshold times
    const existingQuery = this.tempSearchQuery.filter(
      (item) => item.queryString === queryString,
    );
    if (existingQuery?.length >= this.threshold) {
      return true;
    } else {
      // if the query string is not in the temp search query, add it to the temp search query
      this.tempSearchQuery.push({
        queryString: queryString,
        registeredAt: new Date(),
      });
      return false;
    }
  }

  /**
   * Retrieves a value from the cache using the specified key
   * @param key - The unique identifier to lookup in the cache
   * @returns A Promise that resolves to the cached value if found and not expired, null otherwise
   */
  public async getCache(key: string): Promise<any | boolean> {
    const cacheItem = this.cacheObject.get(key);
    if (!cacheItem) {
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
  public async getCacheDetails (): Promise<any> {
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
      tempQueryCount: this.tempSearchQuery.length
      };
    } catch (error) {
      console.error('Error getting cache details:', error);
      return false;
    }
  }

  /**
   * Sets up an automatic cache reset mechanism.
   * This method creates an interval timer that periodically checks and removes expired items from the cache.
   *
   * The method performs the following operations:
   * 1. Checks if the cache is empty, and returns early if it is.
   * 2. Iterates through all cache items and removes those that have expired based on the `autoResetCacheInterval`.
   * 3. Filters out expired temporary search queries based on the same interval.
   *
   * The interval for this automatic reset is determined by the `ttl` (time-to-live) property.
   *
   * @private
   * @returns {Promise<void>} A promise that resolves when the interval is set up.
   */
  private async autoResetCache(): Promise<void> {
    setInterval(
      () => {
        // check if the cache is empty or not
        if (Object.keys(this.cacheObject).length === 0) {
          return;
        }
        // check if the cache is expired or not
        // if the cache is expired, remove it from the cache
        const now = new Date();
        for (const key in this.cacheObject) {
          const cacheItem = this.cacheObject.get(key);
          if (cacheItem) {
            const diff = Math.abs(
              now.getTime() - cacheItem.registeredAt.getTime(),
            );
            if (diff > this.autoResetCacheInterval * 1000) {
              this.cacheObject.delete(key);
            }
          }
        }
        // also remove the expired temp search queries
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
