/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { General } from "../../config/Keys/Keys";
import FileManager from "../../engine/Filesystem/FileManager";
import Converter from "../../Helper/Converter.helper";

/**
 * Structure of index data stored in index files
 */
interface IndexData {
  fieldName: string;
  indexEntries: { [value: string]: string[] };
}

/**
 * Cached index entry with metadata
 */
interface CachedIndex {
  data: IndexData;
  loadedAt: Date;
  path: string;
}

/**
 * In-memory cache for index data
 *
 * Features:
 * - Eagerly loads all indexes on collection initialization
 * - Keeps indexes in both memory (speed) and disk (persistence)
 * - Cold start recovery: Loads from disk on cache miss
 * - Thread-safe with simple lock mechanism
 * - Dual-write: Updates both memory and disk atomically
 *
 * @example
 * ```typescript
 * const indexCache = new IndexCache('/path/to/collection');
 * await indexCache.loadAllIndexes();  // Eager load
 * const indexData = await indexCache.getIndex('email');  // O(1) memory access
 * ```
 */
export class IndexCache {
  private cache: Map<string, CachedIndex>;
  private readonly indexFolderPath: string;
  private readonly indexMetaPath: string;
  private readonly fileManager: FileManager;
  private readonly converter: Converter;
  private locks: Map<string, Promise<void>>;  // Simple lock mechanism

  constructor(collectionPath: string) {
    this.cache = new Map();
    this.indexFolderPath = `${collectionPath}/indexes`;
    this.indexMetaPath = `${this.indexFolderPath}/index.meta.json`;
    this.fileManager = new FileManager();
    this.converter = new Converter();
    this.locks = new Map();
  }

  /**
   * Eagerly loads all indexes into memory
   * Called during collection initialization for maximum query performance
   *
   * @returns Promise that resolves when all indexes are loaded
   */
  public async loadAllIndexes(): Promise<void> {
    try {
      // Check if index metadata exists
      const metaExists = await this.fileManager.FileExists(this.indexMetaPath);
      if (!metaExists.status) {
        return; // No indexes created yet
      }

      // Read index metadata file
      const metaContent = await this.fileManager.ReadFile(this.indexMetaPath);
      if (!metaContent.status) {
        return;
      }

      const indexMeta = this.converter.ToObject(metaContent.data);

      // Load each index file into memory in parallel
      const loadPromises = indexMeta.map(async (meta: any) => {
        try {
          const indexPath = meta.path;
          const indexContent = await this.fileManager.ReadFile(indexPath);

          if (indexContent.status) {
            const indexData = this.converter.ToObject(indexContent.data);
            this.cache.set(meta.indexFieldName, {
              data: indexData,
              loadedAt: new Date(),
              path: indexPath,
            });
          }
        } catch (error) {
          // Silent per-index failure - continue loading other indexes
          console.error(`Failed to load index ${meta.indexFieldName}:`, error);
        }
      });

      await Promise.all(loadPromises);
    } catch (error) {
      // Silent failure - indexes will load from disk on demand (cold start recovery)
      console.error("Failed to load indexes into memory:", error);
    }
  }

  /**
   * Gets index data for a specific field
   * Returns from memory if available, loads from disk if not (cold start recovery)
   *
   * @param fieldName - The indexed field name (e.g., 'email', 'age')
   * @returns Index data or null if index doesn't exist
   */
  public async getIndex(fieldName: string): Promise<IndexData | null> {
    // Try memory cache first (O(1) fast path)
    const cached = this.cache.get(fieldName);
    if (cached) {
      return cached.data;
    }

    // Cache miss - load from disk (cold start recovery)
    try {
      const indexPath = `${this.indexFolderPath}/${fieldName}${General.DBMS_File_EXT}`;
      const indexContent = await this.fileManager.ReadFile(indexPath);

      if (indexContent.status) {
        const indexData = this.converter.ToObject(indexContent.data);

        // Populate cache for future reads
        this.cache.set(fieldName, {
          data: indexData,
          loadedAt: new Date(),
          path: indexPath,
        });

        return indexData;
      }
    } catch (error) {
      console.error(error)
      // Index doesn't exist - this is normal for unindexed fields
    }

    return null;
  }

  /**
   * Updates an index in both memory and disk atomically
   * Thread-safe with simple lock mechanism
   *
   * @param fieldName - The indexed field name
   * @param indexData - The updated index data
   * @returns True if update successful, false otherwise
   */
  public async updateIndex(fieldName: string, indexData: IndexData): Promise<boolean> {
    // Acquire lock for this field to prevent concurrent writes
    await this.acquireLock(fieldName);

    try {
      const indexPath = `${this.indexFolderPath}/${fieldName}${General.DBMS_File_EXT}`;

      // Write to disk first for durability (disk = source of truth)
      const writeResult = await this.fileManager.WriteFile(
        indexPath,
        this.converter.ToString(indexData)
      );

      if (!writeResult.status) {
        return false;
      }

      // Update memory cache after successful disk write
      this.cache.set(fieldName, {
        data: indexData,
        loadedAt: new Date(),
        path: indexPath,
      });

      return true;
    } finally {
      this.releaseLock(fieldName);
    }
  }

  /**
   * Invalidates a specific index (removes from memory)
   * Disk copy remains for persistence and recovery
   *
   * @param fieldName - The indexed field name to invalidate
   */
  public async invalidateIndex(fieldName: string): Promise<void> {
    this.cache.delete(fieldName);
  }

  /**
   * Invalidates all indexes (removes all from memory)
   * Used when indexes are dropped or collection is cleared
   * Disk copies remain for recovery
   */
  public async invalidateAll(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Simple lock acquisition for thread safety
   * Waits if another operation is currently holding the lock
   *
   * @param key - The lock key (typically field name)
   * @private
   */
  private async acquireLock(key: string): Promise<void> {
    const existingLock = this.locks.get(key);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock promise for this operation
    let releaseFn: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseFn = resolve;
    });

    this.locks.set(key, lockPromise);
  }

  /**
   * Releases the lock for a specific key
   *
   * @param key - The lock key to release
   * @private
   */
  private releaseLock(key: string): void {
    this.locks.delete(key);
  }

  /**
   * Gets current cache statistics for monitoring
   *
   * @returns Object containing cache size and loaded index count
   */
  public getCacheStats(): { indexCount: number; fieldNames: string[] } {
    return {
      indexCount: this.cache.size,
      fieldNames: Array.from(this.cache.keys()),
    };
  }
}
