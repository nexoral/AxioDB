/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorInterface, SuccessInterface } from "../../config/Interfaces/Helper/response.helper.interface";
import { General } from "../../config/Keys/Keys";
import FileManager from "../../engine/Filesystem/FileManager";
import FolderManager from "../../engine/Filesystem/FolderManager";
import Converter from "../../Helper/Converter.helper";
import ResponseHelper from "../../Helper/response.helper";

export class IndexManager {
  // Properties
  public readonly path: string;
  public readonly indexFolderPath: string;
  public readonly indexMetaPath: string;
  public readonly fileManager: FileManager;
  public readonly folderManager: FolderManager;
  public readonly converter: Converter;
  public readonly ResponseHelper: ResponseHelper;

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
  public async createIndex(...fieldNames: string[]): Promise<SuccessInterface | undefined> {
    const EffectedIndexes: string[] = [];
    const FailedIndexes: string[] = [];
    for (const fieldName of fieldNames) {
      const indexName = fieldName;
      const indexFilePath = `${this.indexFolderPath}/${indexName}${General.DBMS_File_EXT}`;
      const DemoIndexHash = {
        fieldName: indexName,
        indexEntries: {},
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
            return this.ResponseHelper.Success(`Indexes: ${EffectedIndexes.join(", ")} created Indexes: ${FailedIndexes.join(", ")}`);
          }
          else {
            FailedIndexes.push(indexName);
          }
        }
      }
    }
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
  protected async findMatchingIndexMeta (doc: any): Promise<any[] | undefined> {
    const indexMetaContent = await this.fileManager.ReadFile(this.indexMetaPath);
    if (indexMetaContent.status) {
      const indexMeta = this.converter.ToObject(indexMetaContent.data);
      return indexMeta.filter((meta: { indexFieldName: any; }) =>
        Object.prototype.hasOwnProperty.call(doc, meta.indexFieldName)
      );
    }
  }
}