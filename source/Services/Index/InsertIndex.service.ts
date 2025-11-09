/* eslint-disable @typescript-eslint/no-explicit-any */
import { General } from "../../config/Keys/Keys";
import { IndexManager } from "./Index.service";

export default class InsertIndex extends IndexManager {

  constructor (path: string){
    super(path)
  }


  /**
 * Inserts a document identifier into one or more index files as defined by the global index meta.
 *
 * The method:
 * 1. Reads the global index meta from `this.indexMetaPath` and converts it to an object using `this.converter`.
 * 2. Calls `this.findMatchingIndexMeta(document)` to determine which index files should be updated for the provided document.
 * 3. For each matched index entry:
 *    - Reads the index file at `index.path`,
 *    - Converts its contents to an object,
 *    - Appends `${document.documentId}${General.DBMS_File_EXT}` to `indexMeta.indexEntries`,
 *    - Writes the updated index back to disk.
 *
 * @param document - Object representing the document to index. Must contain a `documentId` property (string | number).
 * @returns A Promise that resolves to:
 *  - `true` if the last index file write operation returned a success status,
 *  - `false` if the global index meta could not be read, no matching index meta entries were found, or the final write returned a falsy status.
 *
 * @throws Propagates any exceptions thrown by file reads/writes or conversion (e.g., IO or parse/serialize errors).
 *
 * @remarks
 * - The method appends the document entry and does not deduplicate existing entries.
 * - When multiple index files are updated, the returned boolean reflects the status of the final write operation only.
 * - The operation is not atomic across multiple index files; concurrent invocations may produce race conditions.
 *
 * @example
 * // document must include documentId:
 * // { documentId: "abc123", ... }
 * const success = await indexService.InsertToIndex({ documentId: "abc123" });
 */
  public async InsertToIndex(document: any): Promise<boolean> {
      const matchedIndex = await this.findMatchingIndexMeta(document)

      if (matchedIndex){

      if (matchedIndex.length == 0) {
        return false
      }

      let status: boolean = false;
      for (const indexes of matchedIndex) {
        const path: string = indexes.path;
        const IndexName: string = indexes.indexFieldName
        const indexContent = await this.fileManager.ReadFile(path);
        const indexMeta = this.converter.ToObject(indexContent.data);
        const alreadyhave = Object.keys(indexMeta.indexEntries).some(keys => keys == document[IndexName])
        if (alreadyhave){
          indexMeta.indexEntries[document[IndexName]].push(`${document.documentId}${General.DBMS_File_EXT}`)
        }
        else {
          indexMeta.indexEntries[document[IndexName]] = [`${document.documentId}${General.DBMS_File_EXT}`]
        }
        
        // Write it back
        const staus = await this.fileManager.WriteFile(path, this.converter.ToString(indexMeta));
        status = staus.status;
      }
      return status;
    }
    return false;
  }

}