/* eslint-disable @typescript-eslint/no-explicit-any */
import { General } from "../../config/Keys/Keys";
import { IndexManager } from "./Index.service";
import { IndexCache } from "./IndexCache.service";

export default class InsertIndex extends IndexManager {
  private indexCache: IndexCache;

  constructor (path: string){
    super(path);
    this.indexCache = new IndexCache(path);
  }


  /**
 * Inserts a document identifier into one or more index files as defined by the global index meta.
 *
 * OPTIMIZED: Uses in-memory index cache for fast reads and atomic dual-write (memory + disk).
 *
 * The method:
 * 1. Calls `this.findMatchingIndexMeta(document)` to determine which index files should be updated.
 * 2. For each matched index entry:
 *    - Gets current index data from memory cache (or loads from disk if not cached)
 *    - Appends `${document.documentId}${General.DBMS_File_EXT}` to `indexEntries`
 *    - Updates both memory cache and disk atomically via indexCache.updateIndex()
 *
 * @param document - Object representing the document to index. Must contain a `documentId` property (string | number).
 * @returns A Promise that resolves to:
 *  - `true` if the last index file write operation returned a success status,
 *  - `false` if the global index meta could not be read, no matching index meta entries were found, or the final write returned a falsy status.
 *
 * @throws Propagates any exceptions thrown by file reads/writes or conversion (e.g., IO or parse/serialize errors).
 *
 * @remarks
 * - Updates both memory cache and disk atomically
 * - Thread-safe via index cache locking mechanism
 * - Falls back to disk read on cache miss (cold start recovery)
 *
 * @example
 * // document must include documentId:
 * // { documentId: "abc123", ... }
 * const success = await indexService.InsertToIndex({ documentId: "abc123" });
 */
  public async InsertToIndex(document: any): Promise<boolean> {
      const matchedIndex = await this.findMatchingIndexMeta(document);

      if (matchedIndex){

      if (matchedIndex.length == 0) {
        return false;
      }

      let status: boolean = false;
      for (const indexes of matchedIndex) {
        const indexName: string = indexes.indexFieldName;
        const documentFileName = `${document.documentId}${General.DBMS_File_EXT}`;

        // Get current index data from memory cache (or load from disk if not cached)
        let indexData = await this.indexCache.getIndex(indexName);

        if (!indexData) {
          // Fallback: Load from disk if not in cache (cold start recovery)
          const indexContent = await this.fileManager.ReadFile(indexes.path);
          if (indexContent.status) {
            indexData = this.converter.ToObject(indexContent.data);
          } else {
            // Index file doesn't exist - skip this index
            continue;
          }
        }

        if (!indexData) {
          continue;
        }

        const fieldValue = document[indexName];

        // Add document to index entries
        const alreadyhave = Object.keys(indexData.indexEntries).some(keys => keys == fieldValue);
        if (alreadyhave){
          indexData.indexEntries[fieldValue].push(documentFileName);
        }
        else {
          indexData.indexEntries[fieldValue] = [documentFileName];
        }

        // Update both memory cache and disk atomically
        const updateSuccess = await this.indexCache.updateIndex(indexName, indexData);
        status = updateSuccess;
      }
      return status;
    }
    return false;
  }

}