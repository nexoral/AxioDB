/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import Converter from "../../Helper/Converter.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";
import DocumentLoader from "../../Helper/DocumentLoader.helper";
import FileManager from "../../engine/Filesystem/FileManager";
import { randomUUID } from "crypto";

// Import All Utility
import Searcher from "../../utility/Searcher.utils";
import Sorting from "../../utility/SortData.utils";
import InMemoryCache from "../../Memory/memory.operation";
import { General } from "../../config/Keys/Keys";
import { ReadIndex } from "../Index/ReadIndex.service";
import DeleteIndex from "../Index/DeleteIndex.service";
import LockManager from "../Transaction/LockManager.service";
/**
 * The DeleteOperation class is used to delete a document from a collection.
 * This class provides methods to delete a single document that matches the base query.
 */
export default class DeleteOperation {
  // Properties
  protected readonly collectionName: string;
  private readonly baseQuery: object | any;
  private readonly path: string;
  private readonly isEncrypted: boolean;
  private readonly encryptionKey: string | undefined;
  private readonly ResponseHelper: ResponseHelper;
  private readonly cryptoInstance?: CryptoHelper;
  private readonly Converter: Converter;
  private readonly fileManager: FileManager;
  private allDataWithFileName: any[] = [];
  private sort: object | any;

  constructor(
    collectionName: string,
    path: string,
    baseQuery: object | any,
    isEncrypted: boolean = false,
    encryptionKey?: string,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.baseQuery = baseQuery;
    this.isEncrypted = isEncrypted;
    this.encryptionKey = encryptionKey;
    this.sort = {};
    this.ResponseHelper = new ResponseHelper();
    this.Converter = new Converter();
    this.fileManager = new FileManager();
    if (this.isEncrypted === true) {
      if (!this.encryptionKey) {
        throw new Error(
          "Encryption key must be provided when isEncrypted is true.",
        );
      }
      this.cryptoInstance = new CryptoHelper(this.encryptionKey);
    }
    this.allDataWithFileName = []; // To store all data with file name
  }

  // Methods
  /**
   * Deletes a single document that matches the base query.
   *
   * This method with ACID compliance:
   * 1. Loads all raw data from buffers
   * 2. Searches for documents matching the base query
   * 3. Selects the first matching document (applying sort if provided)
   * 4. Acquires lock on the document
   * 5. Deletes the file associated with the selected document
   * 6. Releases lock
   *
   * @returns {Promise<object>} A response object containing either:
   *   - Success: { message: "Data deleted successfully", deleteData: object }
   *   - Error: An error message if no data found or deletion fails
   *
   * @throws Will propagate any errors from underlying operations
   */
  public async deleteOne(): Promise<SuccessInterface | ErrorInterface> {
    const lockManager = new LockManager(this.path);
    const operationId = randomUUID();
    const timestamp = Date.now();
    let documentId: string | null = null;

    try {
      // STEP 1: Find the document first
      let ReadResponse; // Read Response Holder
      if (this.baseQuery?.documentId !== undefined) {
        const FilePath = [
          `${this.baseQuery.documentId}${General.DBMS_File_EXT}`,
        ];
        ReadResponse = await this.LoadAllBufferRawData(FilePath);
      } else {
        const fileNames = await new ReadIndex(this.path).getFileFromIndex(this.baseQuery)
        if (fileNames.length > 0) {
          // Load File Names from Index
          ReadResponse = await this.LoadAllBufferRawData(fileNames);
        } else {
          ReadResponse = await this.LoadAllBufferRawData();
        }
      }

      if (!("data" in ReadResponse)) {
        return this.ResponseHelper.Error(ReadResponse);
      }

      const SearchedData = await new Searcher(ReadResponse.data, true).find(
        this.baseQuery,
        "data",
      );

      if (SearchedData.length === 0) {
        return this.ResponseHelper.Error(
          "No data found with the specified query",
        );
      }

      let selectedFirstData = SearchedData[0]; // Select the first data
      let fileName: string = selectedFirstData?.fileName; // Get the file name

      // Sort the data if sort is provided then select the first data for deletion
      if (Object.keys(this.sort).length !== 0) {
        const Sorter: Sorting = new Sorting(SearchedData, this.sort);
        const SortedData: any[] = await Sorter.sort("data"); // Sort the data
        selectedFirstData = SortedData[0]; // Select the first data
        fileName = selectedFirstData?.fileName; // Get the file name
      }

      documentId = fileName.split('.')[0];

      // STEP 2: Acquire lock on the document (ACID: Isolation)
      const lockResult = await lockManager.acquireLock(documentId, operationId, timestamp);
      if (!("data" in lockResult)) {
        return this.ResponseHelper.Error("Lock acquisition failed");
      }

      // STEP 3: Delete the file (now safe - locked)
      const deleteResponse = await this.deleteFile(fileName);
      if (!("data" in deleteResponse)) {
        return this.ResponseHelper.Error("Failed to delete data");
      }

      // Fire-and-forget: Remove from indexes and invalidate cache asynchronously for faster response
      new DeleteIndex(this.path).RemoveFromIndex(documentId, selectedFirstData?.data).catch(() => {});
      InMemoryCache.invalidateByDocument(this.path, documentId).catch(() => {});

      return this.ResponseHelper.Success({
        message: "Data deleted successfully",
        deleteData: selectedFirstData?.data,
      });

    } finally {
      // STEP 4: Always release lock (ACID: ensures no deadlock)
      if (documentId) {
        await lockManager.releaseLock(documentId).catch(() => {});
      }
    }
  }

  /**
   * Deletes multiple documents that match the base query.
   *
   * This method with ACID compliance:
   * 1. Searches for documents matching the base query
   * 2. Acquires locks on ALL matching documents (ensures atomicity)
   * 3. Deletes each matching file
   * 4. Releases all locks
   * 5. Returns success with the deleted data or an error
   *
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to either:
   *   - Success with a success message and the deleted data
   *   - Error if:
   *     - No matching data is found
   *     - Lock acquisition fails
   *     - Any file deletion operation fails
   *     - The initial buffer data loading fails
   */
  public async deleteMany(): Promise<SuccessInterface | ErrorInterface> {
    const lockManager = new LockManager(this.path);
    const operationId = randomUUID();
    const timestamp = Date.now();
    const acquiredLocks: string[] = [];

    try {
      // STEP 1: Find all matching documents
      let response;
      const fileNames = await new ReadIndex(this.path).getFileFromIndex(this.baseQuery)
      if (fileNames.length > 0) {
        // Load File Names from Index
        response = await this.LoadAllBufferRawData(fileNames);
      } else {
        response = await this.LoadAllBufferRawData();
      }

      if (!("data" in response)) {
        return this.ResponseHelper.Error(response);
      }

      const SearchedData = await new Searcher(response.data, true).find(
        this.baseQuery,
        "data",
      );

      if (SearchedData.length === 0) {
        return this.ResponseHelper.Error(
          "No data found with the specified query",
        );
      }

      // STEP 2: Extract all document IDs and acquire locks on ALL documents
      const documentIds = SearchedData.map((data) => data.fileName.split('.')[0]);

      for (const docId of documentIds) {
        const lockResult = await lockManager.acquireLock(docId, operationId, timestamp);
        if (!("data" in lockResult)) {
          // Lock acquisition failed - rollback
          return this.ResponseHelper.Error(`Lock acquisition failed for document ${docId}`);
        }
        acquiredLocks.push(docId);
      }

      // STEP 3: All locks acquired - now perform deletions safely
      const deleteIndexService = new DeleteIndex(this.path);
      for (let i = 0; i < SearchedData.length; i++) {
        const deleteResponse = await this.deleteFile(SearchedData[i].fileName);
        if (!("data" in deleteResponse)) {
          return this.ResponseHelper.Error("Failed to delete data");
        }

        // Fire-and-forget: Remove from indexes asynchronously
        deleteIndexService.RemoveFromIndex(
          SearchedData[i].fileName.split('.')[0],
          SearchedData[i].data
        ).catch(() => {});
      }

      // Fire-and-forget: Invalidate cache asynchronously
      InMemoryCache.invalidateByDocuments(this.path, documentIds).catch(() => {});

      return this.ResponseHelper.Success({
        message: "Data deleted successfully",
        deleteData: SearchedData.map((data) => data.data),
      });

    } finally {
      // STEP 4: Always release ALL acquired locks (ACID: ensures no deadlock)
      if (acquiredLocks.length > 0) {
        await lockManager.releaseAllLocks(acquiredLocks).catch(() => {});
      }
    }
  }

  /**
   * Loads all buffer raw data from the specified directory.
   *
   * This method performs the following steps:
   * 1. Checks if the directory is locked.
   * 2. If the directory is not locked, it lists all files in the directory.
   * 3. Reads each file and decrypts the data if encryption is enabled.
   * 4. Stores the decrypted data in the `AllData` array.
   * 5. If the directory is locked, it unlocks the directory, reads the files, and then locks the directory again.
   *
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to a success or error response.
   *
   * @throws {Error} Throws an error if any operation fails.
   */
  private async LoadAllBufferRawData(
    documentIdDirectFile?: string[] | undefined,
  ): Promise<SuccessInterface | ErrorInterface> {
    // Use shared DocumentLoader helper (DRY - consolidates duplicated code)
    const result = await DocumentLoader.loadDocuments(
      this.path,
      this.encryptionKey,
      this.isEncrypted,
      documentIdDirectFile,
      true  // Include fileName for Delete operations
    );

    // Store result in allDataWithFileName if successful
    if ("data" in result) {
      this.allDataWithFileName = result.data;
    }

    return result;
  }

  /**
   * Deletes a file from the specified path.
   *
   * This method checks if the directory is locked before attempting to delete the file.
   * If the directory is locked, it tries to unlock it, delete the file, and then lock it again.
   *
   * @param fileName - The name of the file to be deleted
   * @returns A response object indicating success or failure
   *          Success response: { status: true, message: "File deleted successfully" }
   *          Error response: { status: false, message: <error message> }
   * @private
   */
  private async deleteFile(fileName: string) {
    // Use FileManager's DeleteFileWithLock method for proper lock management
    return await this.fileManager.DeleteFileWithLock(this.path, fileName);
  }

  /**
   * to be sorted to the query
   * @param {object} sort - The sort to be set.
   * @returns {DeleteOperation} - An instance of the DeleteOperation class.
   */
  public Sort(sort: object | any): DeleteOperation {
    this.sort = sort;
    return this;
  }
}
