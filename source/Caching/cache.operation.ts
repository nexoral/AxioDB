/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description This class is responsible for caching data in memory
 * @class InMemoryCache
 * @export InMemoryCache
 * @version 1.0.1
 * @since 24 December 2024
 **/
class InMemoryCache {
  // Properties
  private readonly ttl: number;
  private cacheObject: { [key: string]: { value: any; registeredAt: Date } };
  private tempSearchQuery: Array<{ queryString: any; registeredAt: Date }> = [];
  private readonly autoResetCacheInterval: number = 86400; // 24 hours
  private readonly threshold: number = 10; // 10 times
  /**
   * Creates a new instance of the cache operation class
   * @param TTL - Time to live in seconds for cache entries. Defaults to 86400 seconds (24 hours)
   */
  constructor(TTL: string | number = 86400) {
    this.ttl = typeof TTL === "string" ? parseInt(TTL) : TTL;
    this.cacheObject = {};
    this.tempSearchQuery = [];
    this.autoResetCacheInterval = 86400; // 24 hours
    this.threshold = 10; // 10 times
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
      const cacheItem = this.cacheObject[key];
      if (!cacheItem) {
        this.cacheObject[key] = {
          value: value,
          registeredAt: new Date(),
        };
        return true;
      } else {
        // check if the cache is expired or not
        const now = new Date();
        const diff = Math.abs(now.getTime() - cacheItem.registeredAt.getTime());
        if (diff > this.ttl * 1000) {
          // if the cache is expired, remove it from the cache
          delete this.cacheObject[key];
          this.cacheObject[key] = {
            value: value,
            registeredAt: new Date(),
          };
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
    const cacheItem = this.cacheObject[key];
    if (!cacheItem) {
      return false;
    }
    return cacheItem.value;
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
          const cacheItem = this.cacheObject[key];
          if (cacheItem) {
            const diff = Math.abs(
              now.getTime() - cacheItem.registeredAt.getTime(),
            );
            if (diff > this.autoResetCacheInterval * 1000) {
              delete this.cacheObject[key];
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
