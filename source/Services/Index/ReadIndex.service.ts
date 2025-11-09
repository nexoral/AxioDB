/* eslint-disable @typescript-eslint/no-explicit-any */
import { IndexManager } from "./Index.service";

export class ReadIndex extends IndexManager {

  constructor (path: string){
    super(path)
  }

  /**
   * Retrieve file path(s) from an index that match the provided query.
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
   * - This method calls `findMatchingIndexMeta(query)` to locate the appropriate index metadata.
   * - When a match is found, it reads the index file via `fileManager.ReadFile(...)` and converts the
   *   file content to an object using `converter.ToObject(...)`.
   * - The resolved object is expected to have `indexEntries` and `fieldName` properties. The method
   *   uses `indexEntries[query[fieldName]]` to obtain the associated file list.
   * - The index object is logged to the console for debugging purposes.
   *
   * @throws The returned promise will reject if reading or parsing the index file fails (for example,
   *         due to I/O errors or converter failures).
   */
  public async getFileFromIndex (query: any) : Promise <string[]>{
    const matchedIndexFile = await this.findMatchingIndexMeta(query)
    if(matchedIndexFile !== undefined) {
      const metaContent = this.converter.ToObject((await this.fileManager.ReadFile(matchedIndexFile.path)).data);
      const finalValueFiles = metaContent.indexEntries[query[metaContent.fieldName]]
      return finalValueFiles;
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