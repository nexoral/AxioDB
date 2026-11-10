import { General } from "../../config/Keys/Keys";
import FileManager from "../../engine/Filesystem/FileManager";
import Converter from "../../Helper/Converter.helper";
import { IndexManager } from "./Index.service";
import Logger from "../../Helper/Logger.helper";
import PathSanitizer from "../../Helper/PathSanitizer.helper";

/**
 * Structure of index data stored in index files
 */
interface IndexData {
  fieldName: string;
  indexEntries: { [value: string]: string[] };
  /**
   * Sorted, de-duplicated numeric values for this field - enables O(log U + M)
   * range queries ($gt/$gte/$lt/$lte) instead of a full collection scan.
   * Optional for backward compatibility with indexes written before range
   * support existed; those are lazily backfilled on first insert/delete.
   */
  sortedValues?: number[];
}

/**
 * Cached index entry with metadata and TTL
 */
interface CachedIndex {
  data: IndexData;
  loadedAt: Date;
  expiresAt: number;
  path: string;
}

/**
 * In-memory cache for index data
 *
 * Features:
 * - Eagerly loads all indexes on collection initialization
 * - Keeps indexes in both memory (speed) and disk (persistence) as JSONL
 * - Cold start recovery: Streams from disk on cache miss
 * - Thread-safe with simple lock mechanism
 * - Dual-write: Updates both memory and disk atomically
 *
 * @example
 * ```typescript
 * const indexCache = IndexCache.getInstance('/path/to/collection');
 * await indexCache.loadAllIndexes();  // Eager load (streamed)
 * const indexData = await indexCache.getIndex('email');  // O(1) memory access
 * ```
 */
export class IndexCache {
  // One IndexCache per collection path - shared across Insert/Read/Delete/Collection
  private static instances: Map<string, IndexCache> = new Map();

  private cache: Map<string, CachedIndex>;
  private readonly indexFolderPath: string;
  private readonly indexMetaPath: string;
  private readonly fileManager: FileManager;
  private readonly converter: Converter;
  private lockChains: Map<string, Promise<void>>;  // Per-field mutex queue
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private docMap: string[] = [];
  private docMapLookup: Map<string, number> = new Map();
  private docMapLoaded = false;

  // TTL constants (5-15 minutes in milliseconds)
  private static readonly MIN_TTL_MS = 5 * 60 * 1000;   // 5 minutes
  private static readonly MAX_TTL_MS = 15 * 60 * 1000;  // 15 minutes
  private static readonly CLEANUP_INTERVAL_MS = 60 * 1000; // Check every 1 minute

  private constructor(collectionPath: string) {
    this.cache = new Map();
    this.indexFolderPath = `${collectionPath}/indexes`;
    this.indexMetaPath = `${this.indexFolderPath}/${General.Index_Meta_File}`;
    this.fileManager = new FileManager();
    this.converter = new Converter();
    this.lockChains = new Map();
    this.startCleanupInterval();
  }

  public getDocMap(): string[] {
    return this.docMap;
  }

  public async ensureDocMapLoaded(): Promise<void> {
    if (this.docMapLoaded) return;
    this.docMapLoaded = true;
    try {
      const docIdPath = `${this.indexFolderPath}/documentId${General.Index_File_EXT}`;
      const exists = await this.fileManager.FileExists(docIdPath);
      if (!exists.status) return;
      const lines = await this.fileManager.ReadLines(docIdPath);
      if (lines.length <= 1) return;
      const ext = General.DBMS_File_EXT;
      const extLen = ext.length;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const entry = JSON.parse(line);
          let key: string | undefined;
          if (Array.isArray(entry) && entry.length >= 1) {
            key = String(entry[0]);
          } else if (entry && entry.k !== undefined) {
            key = String(entry.k);
          }
          if (key) {
            if (key.endsWith(ext)) key = key.slice(0, -extLen);
            if (!this.docMapLookup.has(key)) {
              this.docMap.push(key);
              this.docMapLookup.set(key, this.docMap.length - 1);
            }
          }
        } catch { /* skip corrupted lines */ }
      }
    } catch { /* documentId.jsonl may not exist yet */ }
  }

  /**
   * Returns the shared IndexCache for a collection path, creating it on first use.
   */
  public static getInstance(collectionPath: string): IndexCache {
    let instance = IndexCache.instances.get(collectionPath);
    if (!instance) {
      instance = new IndexCache(collectionPath);
      IndexCache.instances.set(collectionPath, instance);
    }
    return instance;
  }

  /**
   * Releases the shared IndexCache for a collection path.
   */
  public static releaseInstance(collectionPath: string): void {
    const instance = IndexCache.instances.get(collectionPath);
    if (instance) {
      instance.dispose();
      IndexCache.instances.delete(collectionPath);
    }
  }

  /**
   * Stops the cleanup timer and clears cached state.
   */
  public dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    this.lockChains.clear();
  }

  /**
   * Generates a random TTL between 5-15 minutes.
   */
  private generateRandomTTL(): number {
    return Math.floor(
      Math.random() * (IndexCache.MAX_TTL_MS - IndexCache.MIN_TTL_MS + 1) + IndexCache.MIN_TTL_MS
    );
  }

  /**
   * Starts periodic cleanup of expired cache entries.
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, IndexCache.CLEANUP_INTERVAL_MS);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Removes all expired entries from cache.
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [fieldName, cached] of this.cache.entries()) {
      if (now >= cached.expiresAt) {
        this.cache.delete(fieldName);
      }
    }
  }

  /**
   * Checks if a cached entry is expired.
   */
  private isExpired(cached: CachedIndex): boolean {
    return Date.now() >= cached.expiresAt;
  }

  /**
   * Eagerly loads all indexes into memory using streaming reads.
   * Called during collection initialization for maximum query performance.
   *
   * @returns Promise that resolves when all indexes are loaded
   */
  public async loadAllIndexes(): Promise<void> {
    try {
      await this.ensureDocMapLoaded();
      const metaLines = await this.fileManager.ReadLines(this.indexMetaPath);
      if (metaLines.length === 0) {
        await this.getIndex("documentId");
        return;
      }

      const loadPromises = metaLines.map(async (line) => {
        try {
          const meta = this.converter.ToObject(line) as { indexFieldName?: string };
          const fieldName = meta?.indexFieldName;
          if (fieldName) {
            await this.getIndex(fieldName);
          }
        } catch (error) {
          Logger.error(`Failed to load index ${line}:`, error);
        }
      });

      await Promise.all(loadPromises);
    } catch (error) {
      Logger.error("Failed to load indexes into memory:", error);
    }
  }

  /**
   * Gets index data for a specific field.
   * Returns from memory cache if valid; streams from disk on cache miss.
   */
  public async getIndex(fieldName: string): Promise<IndexData | null> {
    await this.ensureDocMapLoaded();

    const cached = this.cache.get(fieldName);
    if (cached) {
      if (this.isExpired(cached)) {
        this.cache.delete(fieldName);
      } else {
        return cached.data;
      }
    }

    try {
      const sanitizedFieldName = PathSanitizer.sanitizePathComponent(fieldName);
      const indexPath = PathSanitizer.safePath(this.indexFolderPath, `${sanitizedFieldName}${General.Index_File_EXT}`);
      const lines = await this.fileManager.ReadLines(indexPath);
      if (lines.length > 0) {
        const indexData = IndexManager.deserializeIndexData(lines, this.docMap);
        if (indexData) {
          this.cache.set(fieldName, {
            data: indexData,
            loadedAt: new Date(),
            expiresAt: Date.now() + this.generateRandomTTL(),
            path: indexPath,
          });
          return indexData;
        }
      }
    } catch { /* index doesn't exist */ }

    return null;
  }

  /**
   * Updates an index in both memory and disk atomically.
   * Writes in JSONL format with integer pointers for secondary indexes.
   */
  public async updateIndex(fieldName: string, indexData: IndexData): Promise<boolean> {
    const release = await this.acquireLock(fieldName);

    try {
      await this.ensureDocMapLoaded();

      const ext = General.DBMS_File_EXT;
      const extLen = ext.length;

      // Register any new docIds in docMap memory lookup
      for (const files of Object.values(indexData.indexEntries)) {
        for (const f of files) {
          const clean = f.endsWith(ext) ? f.slice(0, -extLen) : f;
          if (!this.docMapLookup.has(clean)) {
            const intId = this.docMap.length;
            this.docMap.push(clean);
            this.docMapLookup.set(clean, intId);
          }
        }
      }

      const sanitizedFieldName = PathSanitizer.sanitizePathComponent(fieldName);
      const indexPath = PathSanitizer.safePath(this.indexFolderPath, `${sanitizedFieldName}${General.Index_File_EXT}`);
      const jsonlContent = IndexManager.serializeIndexData(indexData, this.docMapLookup);
      const writeResult = await this.fileManager.WriteFile(indexPath, jsonlContent);

      if (!writeResult.status) {
        this.cache.delete(fieldName);
        return false;
      }

      this.cache.set(fieldName, {
        data: indexData,
        loadedAt: new Date(),
        expiresAt: Date.now() + this.generateRandomTTL(),
        path: indexPath,
      });

      return true;
    } catch {
      this.cache.delete(fieldName);
      return false;
    } finally {
      release();
    }
  }

  /**
   * Invalidates a specific index (removes from memory).
   */
  public async invalidateIndex(fieldName: string): Promise<void> {
    this.cache.delete(fieldName);
  }

  /**
   * Invalidates all indexes (removes all from memory).
   */
  public async invalidateAll(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Acquires a per-field mutex.
   */
  private async acquireLock(key: string): Promise<() => void> {
    const previousTail = this.lockChains.get(key) ?? Promise.resolve();

    let release: () => void;
    const currentLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.lockChains.set(key, previousTail.then(() => currentLock));

    await previousTail;
    return release!;
  }

  /**
   * Gets current cache statistics for monitoring.
   */
  public getCacheStats(): { indexCount: number; fieldNames: string[] } {
    return {
      indexCount: this.cache.size,
      fieldNames: Array.from(this.cache.keys()),
    };
  }
}
