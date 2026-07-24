/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import Converter from "../../Helper/Converter.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import ResponseHelper from "../../Helper/response.helper";
import DocumentLoader from "../../Helper/DocumentLoader.helper";
import Searcher from "../../utility/Searcher.utils";
import Sorting from "../../utility/SortData.utils";
import { randomUUID } from "crypto";

// Validator
import Insertion from "./Create.operation";
import InMemoryCache from "../../Memory/memory.operation";
import { General } from "../../config/Keys/Keys";
import { ReadIndex } from "../Index/ReadIndex.service";
import DeleteIndex from "../Index/DeleteIndex.service";
import InsertIndex from "../Index/InsertIndex.service";
import LockManager from "../Transaction/LockManager.service";

export default class UpdateOperation {
  // Properties
  protected readonly collectionName: string;
  private readonly baseQuery: object | any;
  private readonly path: string;
  private readonly isEncrypted: boolean;
  private readonly encryptionKey: string | undefined;
  private readonly ResponseHelper: ResponseHelper;
  private readonly cryptoInstance?: CryptoHelper;
  private readonly Converter: Converter;
  private allDataWithFileName: any[] = [];
  private sort: object | any;
  private updatedAt: string;
  private readonly Insertion: Insertion;

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
    this.updatedAt = new Date().toISOString();
    this.sort = {};
    this.Insertion = new Insertion(this.collectionName, this.path);
    this.ResponseHelper = new ResponseHelper();
    this.Converter = new Converter();
    if (this.isEncrypted === true) {
      this.cryptoInstance = new CryptoHelper(this.encryptionKey);
    }
    this.allDataWithFileName = []; // To store all data with file name
  }

  /**
   * Updates a single document that matches the base query.
   *
   * This method performs the following operations with ACID compliance:
   * 1. Acquires lock on document to ensure atomicity and isolation
   * 2. Searches for documents matching the base query
   * 3. If documents are found, selects the first document (or first after sorting if sort criteria are provided)
   * 4. Deletes the existing document file
   * 5. Inserts a new file with updated data using the same document ID
   * 6. Releases lock
   *
   * @param newData - The new data to replace the existing document
   * @returns A Promise resolving to:
   *          - Success with updated data and previous data if successful
   *          - Error if any step fails (lock acquisition, read, update)
   * @throws May throw errors during file operations or data processing
   */
  public async UpdateOne(
    newData: object | any,
  ): Promise<SuccessInterface | ErrorInterface> {
    const lockManager = LockManager.getInstance(this.path);
    const operationId = randomUUID();
    const timestamp = Date.now();
    let documentId: string | null = null;

    try {
      // check if the data is an empty object or not
      if (Object.keys(newData).length === 0 || newData === undefined) {
        throw new Error("Data cannot be an empty.");
      }

      // check if the data is an object or not
      if (typeof newData !== "object") {
        throw new Error("Data must be an object.");
      }

      // STEP 1: Find the document first (before acquiring lock)
      let ReadResponse; // Read Response Holder
      if (this.baseQuery?.documentId !== undefined) {
        const FilePath = [
          `${this.baseQuery.documentId}${General.DBMS_File_EXT}`,
        ];
        ReadResponse = await this.LoadAllBufferRawData(FilePath);
      } else {
        const fileNames = await new ReadIndex(this.path).getFileFromIndex(this.baseQuery)
        if (fileNames && fileNames.length > 0) {
          // Load File Names from Index
          ReadResponse = await this.LoadAllBufferRawData(fileNames);
        } else {
          ReadResponse = await this.LoadAllBufferRawData();
        }
      }

      if (!("data" in ReadResponse)) {
        return this.ResponseHelper.Error("Failed to read raw data");
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

      documentId = fileName.split(".")[0];

      // STEP 2: Acquire lock on the document (ACID: Isolation)
      const lockResult = await lockManager.acquireLock(documentId, operationId, timestamp);
      if (!("data" in lockResult)) {
        return this.ResponseHelper.Error("Lock acquisition failed");
      }

      // STEP 3: Re-read the document now that we hold the lock. The Step 1 snapshot
      // can be stale: Wait-Die queues an older transaction behind the lock instead of
      // aborting it, so by the time we acquire the lock, whoever held it may already
      // have committed a change - merging against the pre-lock snapshot would silently
      // overwrite that change (lost update).
      const freshRead = await DocumentLoader.loadDocuments(
        this.path,
        this.encryptionKey,
        this.isEncrypted,
        [fileName],
        true,
      );
      if (!("data" in freshRead) || freshRead.data.length === 0) {
        return this.ResponseHelper.Error("Document no longer exists");
      }

      // STEP 4: Perform update operation (now safe - locked, and on current data)
      const documentOldData = freshRead.data[0].data; // Current data, read under lock
      const dataForRest: object | any = { ...documentOldData }; // Get the data for rest of the fields

      // Update All new Fields in the old data
      for (const key in newData) {
        documentOldData[key] = newData[key];
        // also change the updatedAt field
        documentOldData.updatedAt = this.updatedAt;
      }

      // Atomically replace the file's content in place (Create.operation.ts's Save()
      // writes to a temp file and renames over the target - no unlink step, so a
      // concurrent unlocked reader never observes a "file missing" gap here).
      const InsertResponse = await this.insertUpdate(
        documentOldData,
        documentId,
      );

      if (!("data" in InsertResponse)) {
        return this.ResponseHelper.Error("Failed to insert data");
      }

      // Keep indexes in sync - but only for fields whose value actually changed.
      const changedOldValues: any = { documentId };
      const changedNewValues: any = { documentId };
      for (const key in newData) {
        if (dataForRest[key] !== documentOldData[key]) {
          changedOldValues[key] = dataForRest[key];
          changedNewValues[key] = documentOldData[key];
        }
      }
      if (Object.keys(changedOldValues).length > 1) {
        await new DeleteIndex(this.path).RemoveFromIndex(documentId, changedOldValues).catch(() => {});
        await new InsertIndex(this.path).InsertToIndex(changedNewValues).catch(() => {});
      }

      // Fire-and-forget: Invalidate cache asynchronously
      InMemoryCache.invalidateByDocument(this.path, documentId).catch(() => {});

      return this.ResponseHelper.Success({
        message: "Data updated successfully",
        newData: documentOldData,
        previousData: dataForRest,
        documentId: documentId,
      });

    } catch (error) {
      console.log(error);
      return this.ResponseHelper.Error("Failed to update data");
    } finally {
      // STEP 4: Always release lock (ACID: ensures no deadlock)
      if (documentId) {
        await lockManager.releaseLock(documentId).catch(() => {});
      }
    }
  }

  /**
   * Updates multiple documents that match the base query.
   *
   * This method performs the following operations with ACID compliance:
   * 1. Searches for documents matching the base query
   * 2. Acquires locks on ALL matching documents (ensures atomicity across all updates)
   * 3. Deletes the existing documents
   * 4. Inserts new files with updated data for each document
   * 5. Releases all locks
   *
   * @param newData - The new data to replace the existing documents
   * @returns A Promise resolving to:
   *          - Success with updated data and previous data if successful
   *          - Error if any step fails (rollback by releasing all acquired locks)
   * @throws May throw errors during file operations or data processing
   */
  public async UpdateMany(
    newData: object | any,
  ): Promise<SuccessInterface | ErrorInterface> {
    const lockManager = LockManager.getInstance(this.path);
    const operationId = randomUUID();
    const timestamp = Date.now();
    const acquiredLocks: string[] = [];

    try {
      // check if the data is an empty object or not
      if (Object.keys(newData).length === 0 || newData === undefined) {
        throw new Error("Data cannot be an empty.");
      }

      // check if the data is an object or not
      if (typeof newData !== "object") {
        throw new Error("Data must be an object.");
      }

      newData.updatedAt = new Date().toISOString();

      // STEP 1: Find all matching documents
      let ReadResponse;
      const fileNames = await new ReadIndex(this.path).getFileFromIndex(this.baseQuery)
      if (fileNames.length > 0) {
        // Load File Names from Index
        ReadResponse = await this.LoadAllBufferRawData(fileNames);
      } else {
        ReadResponse = await this.LoadAllBufferRawData();
      }

      if (!("data" in ReadResponse)) {
        return this.ResponseHelper.Error("Failed to read raw data");
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

      // STEP 2: Extract all document IDs
      const documentIds: string[] = [];
      for (let i = 0; i < SearchedData.length; i++) {
        const selectedData = SearchedData[i];
        const fileName: string = selectedData?.fileName;
        const documentId: string = fileName.split(".")[0];
        documentIds.push(documentId);
      }

      // STEP 3: Acquire locks on ALL documents before any modification (ACID: Atomicity + Isolation)
      // This prevents partial updates if one lock fails
      for (const docId of documentIds) {
        const lockResult = await lockManager.acquireLock(docId, operationId, timestamp);
        if (!("data" in lockResult)) {
          // Lock acquisition failed - rollback by releasing acquired locks
          return this.ResponseHelper.Error(`Lock acquisition failed for document ${docId}`);
        }
        acquiredLocks.push(docId);
      }

      // STEP 4: All locks acquired - re-read current data for every document under lock.
      // The Step 1 snapshot can be stale for any document another writer committed to
      // while we were queued behind its lock (see UpdateOne for the full race).
      const fileNamesToRefresh = SearchedData.map((d) => d.fileName);
      const freshRead = await DocumentLoader.loadDocuments(
        this.path,
        this.encryptionKey,
        this.isEncrypted,
        fileNamesToRefresh,
        true,
      );
      if (!("data" in freshRead)) {
        return this.ResponseHelper.Error("Failed to re-read documents under lock");
      }
      const freshDataByFileName = new Map<string, any>(
        freshRead.data.map((d: any) => [d.fileName, d.data]),
      );

      // STEP 5: All locks acquired - now perform updates safely
      const deleteIndexService = new DeleteIndex(this.path);
      const insertIndexService = new InsertIndex(this.path);
      for (let i = 0; i < SearchedData.length; i++) {
        let selectedData = SearchedData[i];
        let fileName: string = selectedData?.fileName;
        const documentOldData = freshDataByFileName.get(fileName);
        if (!documentOldData) {
          return this.ResponseHelper.Error(`Document ${fileName} no longer exists`);
        }
        const previousData = { ...documentOldData };

        // Sort the data if sort is provided
        if (Object.keys(this.sort).length !== 0) {
          const Sorter: Sorting = new Sorting(SearchedData, this.sort);
          const SortedData: any[] = await Sorter.sort("data");
          selectedData = SortedData[i];
          fileName = selectedData?.fileName;
        }

        const documentId: string = fileName.split(".")[0];

        // Update All new Fields in the old data
        for (const key in newData) {
          documentOldData[key] = newData[key];
          documentOldData.updatedAt = newData.updatedAt;
        }

        // Atomically replace the file's content in place (see UpdateOne for why -
        // no unlink step, so concurrent unlocked readers never see a missing file).
        const InsertResponse = await this.insertUpdate(
          documentOldData,
          documentId,
        );

        if (!("data" in InsertResponse)) {
          return this.ResponseHelper.Error(`Failed to insert data for document ${documentId}`);
        }

        // Keep indexes in sync - only for fields whose value actually changed (see
        // UpdateOne for why: touching unchanged fields reorders their index bucket).
        const changedOldValues: any = { documentId };
        const changedNewValues: any = { documentId };
        for (const key in newData) {
          if (previousData[key] !== documentOldData[key]) {
            changedOldValues[key] = previousData[key];
            changedNewValues[key] = documentOldData[key];
          }
        }
        if (Object.keys(changedOldValues).length > 1) {
          await deleteIndexService.RemoveFromIndex(documentId, changedOldValues).catch(() => {});
          await insertIndexService.InsertToIndex(changedNewValues).catch(() => {});
        }
      }

      // Fire-and-forget: Invalidate cache asynchronously
      InMemoryCache.invalidateByDocuments(this.path, documentIds).catch(() => {});

      return this.ResponseHelper.Success({
        message: "Data updated successfully",
        effectedData: SearchedData.length,
        documentIds: documentIds,
      });

    } catch (error) {
      return this.ResponseHelper.Error("Failed to update data");
    } finally {
      // STEP 5: Always release ALL acquired locks (ACID: ensures no deadlock)
      if (acquiredLocks.length > 0) {
        await lockManager.releaseAllLocks(acquiredLocks).catch(() => {});
      }
    }
  }

  /**
   * to be sorted to the query    this.createdAt = new Date().toISOString();
      this.updatedAt = this.createdAt; // Initially updatedAt is same as createdAt
   * @param {object} sort - The sort to be set.
   * @returns {DeleteOperation} - An instance of the DeleteOperation class.
   */
  public Sort(sort: object | any): UpdateOperation {
    this.sort = sort;
    return this;
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
      true  // Include fileName for Update operations
    );

    // Store result in allDataWithFileName if successful
    if ("data" in result) {
      this.allDataWithFileName = result.data;
    }

    return result;
  }

  /**
   * Inserts a document into the collection.
   * @param {object} data - The data to be inserted.
   * @returns {Promise<any>} - A promise that resolves with the response of the insertion operation.
   */
  private async insertUpdate(
    data: object | any,
    ExistingdocumentId?: string,
  ): Promise<SuccessInterface | ErrorInterface> {
    // Check if data is empty or not
    if (!data) {
      throw new Error("Data cannot be empty");
    }

    // Check if data is an object or not
    if (typeof data !== "object") {
      throw new Error("Data must be an object.");
    }

    // Encrypt the data if crypto is enabled
    if (this.isEncrypted && this.cryptoInstance !== undefined) {
      data = await this.cryptoInstance.encrypt(this.Converter.ToString(data));
    }

    // Save the data
    return await this.Insertion.Save(data, ExistingdocumentId);
  }
}
