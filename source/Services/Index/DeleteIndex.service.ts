/* eslint-disable @typescript-eslint/no-explicit-any */
import { General } from "../../config/Keys/Keys";
import { IndexManager } from "./Index.service";
import { IndexCache } from "./IndexCache.service";

/**
 * Service for removing documents from indexes
 * 
 * When a document is deleted, this service removes its reference from all
 * relevant index entries to prevent stale references and maintain index integrity.
 * 
 * @example
 * ```typescript
 * const deleteIndex = new DeleteIndex('/path/to/collection');
 * await deleteIndex.RemoveFromIndex('doc123', { email: 'test@example.com' });
 * ```
 */
export default class DeleteIndex extends IndexManager {
  private indexCache: IndexCache;

  constructor(path: string) {
    super(path);
    this.indexCache = new IndexCache(path);
  }

  /**
   * Removes a document from all matching indexes
   * 
   * For each indexed field present in the document:
   * 1. Loads the index data from cache (or disk if not cached)
   * 2. Removes the document filename from indexEntries[fieldValue]
   * 3. Deletes the entry key if array becomes empty
   * 4. Updates both memory cache and disk atomically
   * 
   * @param documentId - The document ID to remove (without file extension)
   * @param document - The document data containing indexed field values
   * @returns True if at least one index was updated, false otherwise
   */
  public async RemoveFromIndex(documentId: string, document: any): Promise<boolean> {
    const matchedIndex = await this.findMatchingIndexMeta(document);

    if (!matchedIndex || matchedIndex.length === 0) {
      return false;
    }

    let status = false;
    const documentFileName = `${documentId}${General.DBMS_File_EXT}`;

    for (const indexes of matchedIndex) {
      const indexName: string = indexes.indexFieldName;

      // Get current index data from memory cache (or load from disk)
      let indexData = await this.indexCache.getIndex(indexName);

      if (!indexData) {
        // Fallback: Load from disk if not in cache
        const indexContent = await this.fileManager.ReadFile(indexes.path);
        if (indexContent.status) {
          indexData = this.converter.ToObject(indexContent.data);
        } else {
          continue;
        }
      }

      if (!indexData) {
        continue;
      }

      const fieldValue = document[indexName];

      // Check if this field value exists in the index
      if (indexData.indexEntries[fieldValue]) {
        // Remove the document from the array
        const docIndex = indexData.indexEntries[fieldValue].indexOf(documentFileName);
        
        if (docIndex !== -1) {
          indexData.indexEntries[fieldValue].splice(docIndex, 1);

          // Remove the key entirely if array is now empty
          if (indexData.indexEntries[fieldValue].length === 0) {
            delete indexData.indexEntries[fieldValue];
          }

          // Update disk first (must await for data integrity)
          const updateSuccess = await this.indexCache.updateIndex(indexName, indexData);
          
          // Fire-and-forget: Invalidate cache asynchronously
          this.indexCache.invalidateIndex(indexName).catch(() => {});
          
          status = status || updateSuccess;
        }
      }
    }

    return status;
  }

  /**
   * Removes multiple documents from all matching indexes (batch operation)
   * 
   * @param documents - Array of { documentId, document } pairs to remove
   * @returns True if at least one index was updated, false otherwise
   */
  public async RemoveMultipleFromIndex(
    documents: Array<{ documentId: string; document: any }>
  ): Promise<boolean> {
    let status = false;

    for (const { documentId, document } of documents) {
      const result = await this.RemoveFromIndex(documentId, document);
      status = status || result;
    }

    return status;
  }
}
