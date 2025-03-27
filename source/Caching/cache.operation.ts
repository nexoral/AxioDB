/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description This class is responsible for caching data in memory
 * @class InMemoryCache
 * @export InMemoryCache
 * @version 1.0.1
 * @since 24 December 2024
 **/
export default class InMemoryCache {
  // Properties
  private readonly ttl: number | string;
  private cacheObject: { [key: string]: { value: any; expiry: number } };
  private tempSearchQyeury: any[] = [];

  /**
   * Creates a new instance of the cache operation class
   * @param TTL - Time to live in seconds for cache entries. Defaults to 86400 seconds (24 hours)
   */
  constructor(TTL: string | number = 86400) {
    this.ttl = typeof TTL === "string" ? parseInt(TTL) : TTL;
    this.cacheObject = {};
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
  public async setCache(key: string, value: any) {
    this.cacheObject[key] = {
      value: value,
      expiry: Date.now() + parseInt(String(this.ttl)) * 1000,
    };
  }

  /**
   * Retrieves a value from the cache using the specified key
   * @param key - The unique identifier to lookup in the cache
   * @returns A Promise that resolves to the cached value if found and not expired, null otherwise
   */
  public async getCache(key: string) {
    const cacheItem = this.cacheObject[key];
    if (!cacheItem) {
      return null;
    }
    if (cacheItem.expiry < Date.now()) {
      delete this.cacheObject[key];
      return null;
    }
    return cacheItem.value;
  }

  private async autoResetCache() {
    setInterval(() => {
      this.cacheObject = {};
    }, parseInt(String(this.ttl)));
  }
}
