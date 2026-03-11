/* eslint-disable @typescript-eslint/no-explicit-any */
import { IndexManager } from "./Index.service";
import { IndexCache } from "./IndexCache.service";

export class ReadIndex extends IndexManager {
  private indexCache: IndexCache;

  constructor (path: string){
    super(path);
    this.indexCache = new IndexCache(path);
  }

  /**
   * Retrieve file path(s) from an index that match the provided query.
   *
   * OPTIMIZED: Uses in-memory index cache for O(1) lookups instead of disk I/O.
   * Falls back to disk on cache miss (cold start recovery).
   *
   * @param query - An object containing the value to look up. The concrete lookup key is determined
   *                by the matched index metadata's `fieldName` (i.e. the method will use
   *                query[metaContent.fieldName] to find entries).
   *
   * @returns A Promise that resolves to an array of string file paths associated with the query value.
   *          If no matching index metadata is found, the promise resolves to an empty array.
   *          If a matching index is found but no entries exist for the queried value, the returned
   *          value may be undefined at runtime (callers should guard against a missing entry).
   *
   * @remarks
   * - Tries memory cache first for maximum performance (no disk I/O)
   * - Falls back to disk on cache miss (cold start recovery)
   * - Skips index for complex operators ($regex, $in, $gt, etc.) - full scan required
   *
   * @throws The returned promise will reject if reading or parsing the index file fails (for example,
   *         due to I/O errors or converter failures).
   */
  public async getFileFromIndex (query: any) : Promise <string[]>{
    const matchedIndexFile = await this.findMatchingIndexMeta(query);
    if(matchedIndexFile !== undefined) {
      // FAST PATH: Try to get from memory cache first (O(1), no disk I/O)
      const indexData = await this.indexCache.getIndex(matchedIndexFile.indexFieldName);

      if (indexData) {
        // Memory cache hit - use cached index data
        const queryValue = query[indexData.fieldName];

        // Skip index lookup for complex query operators
        if (typeof queryValue === 'object' && queryValue !== null) {
          return [];
        }

        const finalValueFiles = indexData.indexEntries[queryValue];
        return finalValueFiles || [];
      }

      // Cache miss - fall back to disk read (cold start recovery)
      const metaContent = this.converter.ToObject((await this.fileManager.ReadFile(matchedIndexFile.path)).data);
      const queryValue = query[metaContent.fieldName];

      // Skip index lookup for complex query operators
      if (typeof queryValue === 'object' && queryValue !== null) {
        return [];
      }

      const finalValueFiles = metaContent.indexEntries[queryValue];
      return finalValueFiles || [];
    }
    else {
      return [];
    }
  }

  /**
 * Finds index metadata entries that correspond to properties present on the provided document.
 *
 * Reads the index metadata file at `this.indexMetaPath`, converts its content into an object,
 * and returns the subset of metadata entries whose `indexFieldName` is an own property of `doc`.
 *
 * @param doc - The document to check for matching index fields. The function tests own properties
 *              (via `Object.prototype.hasOwnProperty.call`) rather than inherited properties.
 * @returns A Promise that resolves to an array of matching index metadata entries, or `undefined`
 *          if the index metadata file could not be successfully read. The array may be empty if
 *          no metadata entries match.
 *
 * @throws May propagate errors from `fileManager.ReadFile` or `converter.ToObject` if those
 *         operations throw or reject.
 */
  protected async findMatchingIndexMeta(document: any): Promise<any | undefined> {
    const indexMetaContent = await this.fileManager.ReadFile(this.indexMetaPath);
    if (indexMetaContent.status) {
      const indexMeta = this.converter.ToObject(indexMetaContent.data);
      return indexMeta.find((meta: { indexFieldName: any; }) =>
        Object.prototype.hasOwnProperty.call(document, meta.indexFieldName)
      );
    }
  }
}