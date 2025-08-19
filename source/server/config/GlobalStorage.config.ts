/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GlobalStorage Configuration
 * Provides a singleton class for global storage using a Map.
 */
class GlobalStorage<T = any> {
  private storageMap: Map<string, T>;

  constructor() {
    this.storageMap = new Map<string, T>();
  }

  /**
   * Store a value with the specified key
   * @param key The unique identifier for the value
   * @param value The value to store
   * @returns The GlobalStorage instance for chaining
   */
  public set(key: string, value: T): GlobalStorage<T> {
    this.storageMap.set(key, value);
    return this;
  }

  /**
   * Retrieve a value by its key
   * @param key The key to look up
   * @returns The stored value or undefined if not found
   */
  public get(key: string): T | undefined {
    return this.storageMap.get(key);
  }

  /**
   * Get all stored key-value pairs
   * @returns Array of all entries [key, value]
   */
  public getAll(): [string, T][] {
    return Array.from(this.storageMap.entries());
  }

  /**
   * Get all values in the storage
   * @returns Array of all values
   */
  public getAllValues(): T[] {
    return Array.from(this.storageMap.values());
  }

  /**
   * Get all keys in the storage
   * @returns Array of all keys
   */
  public getAllKeys(): string[] {
    return Array.from(this.storageMap.keys());
  }

  /**
   * Update an existing value
   * @param key The key of the value to update
   * @param value The new value
   * @returns Boolean indicating success of operation
   */
  public update(key: string, value: T): boolean {
    if (this.storageMap.has(key)) {
      this.storageMap.set(key, value);
      return true;
    }
    return false;
  }

  /**
   * Delete a value by its key
   * @param key The key to delete
   * @returns Boolean indicating if the item was successfully deleted
   */
  public delete(key: string): boolean {
    return this.storageMap.delete(key);
  }

  /**
   * Check if a key exists in the storage
   * @param key The key to check
   * @returns Boolean indicating if the key exists
   */
  public has(key: string): boolean {
    return this.storageMap.has(key);
  }

  /**
   * Clear all values from the storage
   */
  public clear(): void {
    this.storageMap.clear();
  }

  /**
   * Get the size of the storage
   * @returns Number of key-value pairs in the storage
   */
  public size(): number {
    return this.storageMap.size;
  }
}

export default new GlobalStorage();
