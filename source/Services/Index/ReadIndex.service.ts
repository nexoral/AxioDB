/* eslint-disable @typescript-eslint/no-explicit-any */
import { IndexManager } from "./Index.service";
import { IndexCache } from "./IndexCache.service";
import SortedIndexValues from "../../Helper/SortedIndexValues.helper";

export class ReadIndex extends IndexManager {
  private indexCache: IndexCache;

  constructor (path: string){
    super(path);
    this.indexCache = IndexCache.getInstance(path);
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
   * Retrieve file paths from an index for documents matching any value in the $in array.
   *
   * OPTIMIZED: Uses index lookups for each value in the $in array, unions the results.
   * This is significantly faster than full collection scan for indexed fields.
   *
   * @param fieldName - The field name to query (must have an index)
   * @param values - Array of values to match (from $in operator)
   *
   * @returns Promise resolving to array of unique file paths matching any value
   *
   * @remarks
   * - Uses Set for automatic deduplication of file paths
   * - Returns empty array if field has no index
   * - O(K) lookups where K = values.length (much faster than O(N) full scan)
   *
   * @example
   * // For query: { category: { $in: ['Electronics', 'Books'] } }
   * const files = await readIndex.getFilesForInOperator('category', ['Electronics', 'Books']);
   */
  public async getFilesForInOperator(fieldName: string, values: any[]): Promise<string[]> {
    const indexData = await this.indexCache.getIndex(fieldName);
    if (!indexData) return [];

    const fileSet = new Set<string>();
    for (const value of values) {
      const files = indexData.indexEntries[value];
      if (files) {
        files.forEach(f => fileSet.add(f));
      }
    }
    return Array.from(fileSet);
  }

  /**
   * Retrieve file paths from an index for documents where field value starts with a prefix.
   *
   * OPTIMIZED: Uses index to filter values by prefix, avoiding full collection scan.
   * Works with hash-based indexes by filtering index keys.
   *
   * @param fieldName - The field name to query (must have an index)
   * @param prefix - The prefix string to match
   * @param caseInsensitive - Whether to perform case-insensitive matching (default: false)
   *
   * @returns Promise resolving to array of unique file paths where field starts with prefix
   *
   * @remarks
   * - Filters index keys for prefix matches (O(K) where K = index key count)
   * - Much faster than full collection scan for prefix patterns
   * - Falls back to empty array if field has no index
   * - Best used for regex patterns like /^John/ or /^admin@/
   *
   * @example
   * // For query: { name: { $regex: /^John/i } }
   * const files = await readIndex.getFilesForPrefixQuery('name', 'John', true);
   */
  public async getFilesForPrefixQuery(
    fieldName: string,
    prefix: string,
    caseInsensitive: boolean = false
  ): Promise<string[]> {
    const indexData = await this.indexCache.getIndex(fieldName);
    if (!indexData) return [];

    const normalizedPrefix = caseInsensitive ? prefix.toLowerCase() : prefix;
    const fileSet = new Set<string>();

    // Iterate through index keys and find matches
    // For hash-based indexes, this is O(K) where K = number of unique values
    for (const [value, files] of Object.entries(indexData.indexEntries)) {
      const normalizedValue = caseInsensitive ? value.toLowerCase() : value;

      if (normalizedValue.startsWith(normalizedPrefix)) {
        files.forEach(f => fileSet.add(f));
      }
    }

    return Array.from(fileSet);
  }

  /**
   * Retrieve file paths from an index for documents whose field value falls within
   * a numeric range ($gt/$gte/$lt/$lte).
   *
   * OPTIMIZED: Binary-searches the index's sorted value array for the matching bounds,
   * then unions only the file lists for values inside that range - avoids the full
   * collection scan that unindexed range queries require.
   *
   * @param fieldName - The field name to query (must have an index)
   * @param range - Range operators to apply, e.g. `{ $gt: 25 }` or `{ $gte: 18, $lte: 65 }`
   *
   * @returns Promise resolving to an array of unique file paths matching the range,
   *          or an empty array if the field has no index, the index predates range
   *          support (not yet backfilled), or no values fall in range.
   *
   * @remarks
   * - O(log U) to find the bounds + O(K) to union file lists, where U = unique indexed
   *   values and K = unique values within the range - independent of collection size.
   * - Only numeric values participate (matches `Searcher.matchesQuery`, which already
   *   rejects range comparisons against non-numbers).
   *
   * @example
   * // For query: { age: { $gt: 25 } }
   * const files = await readIndex.getFilesForRangeOperator('age', { $gt: 25 });
   */
  public async getFilesForRangeOperator(
    fieldName: string,
    range: { $gt?: number; $gte?: number; $lt?: number; $lte?: number },
  ): Promise<string[]> {
    const indexData = await this.indexCache.getIndex(fieldName);
    if (!indexData || !indexData.sortedValues || indexData.sortedValues.length === 0) {
      return [];
    }

    const bounds = SortedIndexValues.resolveRange(indexData.sortedValues, range);
    if (!bounds) {
      return [];
    }

    const fileSet = new Set<string>();
    for (let i = bounds.startIndex; i <= bounds.endIndex; i++) {
      const files = indexData.indexEntries[indexData.sortedValues[i]];
      if (files) {
        files.forEach(f => fileSet.add(f));
      }
    }
    return Array.from(fileSet);
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