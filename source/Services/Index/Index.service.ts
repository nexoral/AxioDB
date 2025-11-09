/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorInterface, SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import { General } from "../../config/Keys/Keys";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";

export class IndexManager {
  // Properties
  private readonly path: string;
  private readonly indexFolderPath: string;
  private readonly indexMetaPath: string;
  private readonly fileManager: FileManager;
  private readonly folderManager: FolderManager;
  private readonly converter: Converter;
  private readonly ResponseHelper: ResponseHelper;

  constructor(path: string) {
    this.path = path;
    this.indexFolderPath = `${this.path}/indexes`;
    this.indexMetaPath = `${this.indexFolderPath}/index.meta.json`;
    this.fileManager = new FileManager();
    this.folderManager = new FolderManager();
    this.converter = new Converter();
    this.ResponseHelper = new ResponseHelper();
  }


  /**
   * Create one or more index files and register them in the index metadata.
   *
   * For each supplied field name this method:
   * 1. Determines the index file path as `${indexName}.axiodb` inside the configured index folder.
   * 2. Checks whether the index file already exists. If it does not, creates the file with an empty
   *    index structure ({ fieldName, indexEntries: [] }).
   * 3. Reads the index metadata file (index.meta.json), parses it, and if an entry for the index
   *    field does not already exist, appends a metadata record `{ indexFieldName, fileName, path }`
   *    and writes the metadata file back.
   *
   * Side effects:
   * - Writes new index files to disk via `fileManager.WriteFile`.
   * - Reads and updates the index metadata file via `fileManager.ReadFile` / `WriteFile`.
   * - Uses the configured `converter` to serialize/deserialize index and metadata content.
   *
   * Notes:
   * - The operation is not atomic: some indexes may be created while others fail. The method will
   *   collect created and failed index names and include them in the returned response.
   * - A failure is recorded for a field when the index file already exists, when the index already
   *   exists in the metadata, or when reading/writing the metadata file fails.
   * - The method relies on `indexFolderPath`, `indexMetaPath`, `fileManager`, and `converter`
   *   being correctly configured and available on the instance.
   *
   * @param fieldNames - One or more field names for which to create indexes.
   * @returns A promise that resolves to either:
   *   - SuccessInterface: indicates which indexes were created and which already existed / failed,
   *     typically containing a human-readable message listing affected and existing indexes.
   *   - ErrorInterface: returned when underlying file/IO operations fail in a way that prevents
   *     producing the expected success response.
   *
   * @example
   * // Create a single index
   * await service.createIndex('email');
   *
   * @example
   * // Create multiple indexes
   * await service.createIndex('email', 'username', 'createdAt');
   */
  public async createIndex(...fieldNames: string[]): Promise<SuccessInterface | ErrorInterface> {
    const EffectedIndexes: string[] = [];
    const FailedIndexes: string[] = [];
    for (const fieldName of fieldNames) {
      const indexName = fieldName;
      const indexFilePath = `${this.indexFolderPath}/${indexName}${General.DBMS_File_EXT}`;
      const DemoIndexHash = {
        fieldName: indexName,
        indexEntries: [],
      }
      const exists = await this.fileManager.FileExists(indexFilePath);
      if (!exists.status) {
        // create empty index file
        await this.fileManager.WriteFile(indexFilePath, this.converter.ToString(DemoIndexHash));
        // Update index.meta.json
        const indexMetaContent = await this.fileManager.ReadFile(this.indexMetaPath);
        if (indexMetaContent.status) {
          const indexMeta = this.converter.ToObject(indexMetaContent.data);
          // check if index already exists in meta
          const indexExists = indexMeta.find((index: any) => index.indexFieldName === indexName);
          if (!indexExists) {
            indexMeta.push({
              indexFieldName: indexName,
              fileName: `${indexName}${General.DBMS_File_EXT}`,
              path: indexFilePath,
            });
            await this.fileManager.WriteFile(this.indexMetaPath, this.converter.ToString(indexMeta));
            EffectedIndexes.push(indexName);
          }
          else {
            FailedIndexes.push(indexName);
          }
        }
        else {
          FailedIndexes.push(indexName);
        }
      }
      else {
        FailedIndexes.push(indexName);
      }
    }
    return this.ResponseHelper.Success(`Indexes: ${EffectedIndexes.join(", ")} created & Existing Indexes: ${FailedIndexes.join(", ")}`);
  }

  /**
   * Deletes an index file and removes its entry from the index metadata.
   *
   * This asynchronous method attempts to delete the index file located at
   * `${this.indexFolderPath}/${indexName}.axiodb`. If the file exists it is removed,
   * and the index metadata file at `this.indexMetaPath` is read and updated by
   * filtering out the metadata entry whose `indexFieldName` matches `indexName`.
   * The metadata update is performed only if the metadata file can be read successfully.
   *
   * @param indexName - The name of the index to delete (without extension).
   * @returns A Promise that resolves to a SuccessInterface when the index was deleted
   *          (and metadata updated when possible), or an ErrorInterface when the
   *          specified index does not exist.
   *
   * @async
   * @remarks
   * - Side effects: removes a file from the file system and may modify the index metadata file.
   * - Uses injected helpers: `fileManager` for filesystem operations, `converter` for
   *   (de)serialization of metadata, and `ResponseHelper` to construct the returned result.
   * - If the metadata file cannot be read, the method still succeeds after deleting the index file.
   *
   * @throws {Error} May propagate errors from underlying file operations if those utilities throw.
   */
  public async dropIndex(indexName: string): Promise<SuccessInterface | ErrorInterface> {
    const indexFilePath = `${this.indexFolderPath}/${indexName}${General.DBMS_File_EXT}`;
    // check if index file exists
    const exists = await this.fileManager.FileExists(indexFilePath);
    if (exists.status === true) {
      // delete index file
      await this.fileManager.DeleteFile(indexFilePath);
      // update index.meta.json
      const indexMetaContent = await this.fileManager.ReadFile(this.indexMetaPath);
      if (indexMetaContent.status) {
        let indexMeta = this.converter.ToObject(indexMetaContent.data);
        indexMeta = indexMeta.filter((index: any) => index.indexFieldName !== indexName);
        await this.fileManager.WriteFile(this.indexMetaPath, this.converter.ToString(indexMeta));
      }
      return this.ResponseHelper.Success(`Index: ${indexName} deleted successfully`);
    }
    else {
      return this.ResponseHelper.Error(`Index: ${indexName} does not exist`);
    }
  }

  /**
   * Ensures the index folder and the index metadata file exist, creating them if necessary.
   *
   * This asynchronous method performs the following steps:
   * 1. Checks whether the index folder at `this.indexFolderPath` exists; if not, creates it.
   * 2. Checks whether the index metadata file at `this.indexMetaPath` exists; if not:
   *    a. Constructs a default index metadata entry for a unique "documentId" index:
   *       - indexFieldName: "documentId"
   *       - fileName: "documentId.axiodb"
   *       - path: `${this.indexFolderPath}/documentId.axiodb`
   *       - unique: true
   *    b. Calls `this.createIndex("documentId")` to create the underlying index file/structure.
   *    c. Writes the metadata array to `this.indexMetaPath` using `this.converter.ToString(...)`.
   *
   * The operation is idempotent: if the folder or metadata file already exist, no changes are made.
   *
   * @remarks
   * - This method performs filesystem modifications via `folderManager` and `fileManager`.
   * - Any errors thrown by `folderManager`, `fileManager`, `converter`, or `createIndex` will propagate to the caller.
   * - Callers should `await` this method to ensure the initialization is complete before proceeding.
   *
   * @returns A Promise that resolves when initialization is complete.
   *
   * @throws Will reject if directory creation, file checks/writes, conversion, or index creation fails.
   *
   * @example
   * // Ensure index folder and metadata exist before using the index service
   * await indexService.generateIndexMeta();
   */
  public async generateIndexMeta(): Promise<void> {
    // check is index.meta.json exists or not
    const folderExists = await this.folderManager.DirectoryExists(this.indexFolderPath);

    if (!folderExists.status) {
      await this.folderManager.CreateDirectory(this.indexFolderPath);
    }

    const exists = await this.fileManager.FileExists(this.indexMetaPath);
    if (!exists.status) {
      // create index.meta.json
      const indexMeta  : object[]= [
        {
          indexFieldName: "documentId",
          path: `${this.indexFolderPath}/documentId${General.DBMS_File_EXT}`,
          fileName: `documentId${General.DBMS_File_EXT}`
        }
      ];
      await this.createIndex("documentId")
      await this.fileManager.WriteFile(this.indexMetaPath, this.converter.ToString(indexMeta));
    }
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
    const indexMetaContent = await this.fileManager.ReadFile(this.indexMetaPath);
    if (indexMetaContent.status) {
      const indexMeta = this.converter.ToObject(indexMetaContent.data);
      const matchedIndex = await this.findMatchingIndexMeta(document, indexMeta)

      if (matchedIndex.length == 0){
        return false
      }
      
      let status: boolean = false;
      for (const indexes of matchedIndex) {
        const path: string = indexes.path;
        const indexContent = await this.fileManager.ReadFile(path);
        const indexMeta = this.converter.ToObject(indexContent.data);
        indexMeta.indexEntries.push(`${document.documentId}${General.DBMS_File_EXT}`)
        
        // Write it back
       const staus =  await this.fileManager.WriteFile(path, this.converter.ToString(indexMeta));
       status = staus.status;
      }
      return status;

    }
    return false;
  }

  private async findMatchingIndexMeta (doc: any, indexMetaList: any[]) {
    return indexMetaList.filter((meta: { indexFieldName: any; }) =>
      Object.prototype.hasOwnProperty.call(doc, meta.indexFieldName)
    );
  }
}