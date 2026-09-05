import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import ResponseHelper from "../../Helper/response.helper";
import DocumentLoader from "../../Helper/DocumentLoader.helper";
import Searcher from "../../utility/Searcher.utils";
import Sorting from "../../utility/SortData.utils";
import { TransactionOperation } from "../../config/Interfaces/Transaction/transaction.interface";

// Import All Utility
import { General } from "../../config/Keys/Keys";
import { ReadIndex } from "../Index/ReadIndex.service";
import Transaction from "../Transaction/Transaction.service";
import type { InMemoryCache } from "../../Memory/memory.operation";

export default class UpdateOperation {
  // Properties
  protected readonly collectionName: string;
  private readonly baseQuery: Record<string, unknown>;
  private readonly path: string;
  private readonly cache: InMemoryCache;
  private readonly ResponseHelper: ResponseHelper;
  private allDataWithFileName: Array<{ fileName: string; data: Record<string, unknown> }> = [];
  private sort: Record<string, 1 | -1>;

  constructor(
    collectionName: string,
    path: string,
    baseQuery: Record<string, unknown>,
    cache: InMemoryCache,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.baseQuery = baseQuery;
    this.cache = cache;
    this.sort = {};
    this.ResponseHelper = new ResponseHelper();
    this.allDataWithFileName = []; // To store all data with file name
  }

  /**
   * Updates a single document that matches the base query.
   *
   * Routed through a single-operation Transaction, so the update is WAL-backed:
   * locking, the fresh re-read under lock, atomic file replacement, and index
   * sync are all handled by Transaction/TransactionIndexManager - the same
   * machinery insert() already uses. This method's own job is just picking
   * *which* document to target (honoring .Sort()), since Transaction.update()
   * touches every document a query matches.
   *
   * @param newData - The new data to replace the existing document
   * @returns A Promise resolving to:
   *          - Success with updated data and previous data if successful
   *          - Error if no document matched or the transaction failed
   */
  public async UpdateOne(
    newData: Record<string, unknown>,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      // check if the data is an empty object or not
      if (Object.keys(newData).length === 0 || newData === undefined) {
        throw new Error("Data cannot be an empty.");
      }

      // check if the data is an object or not
      if (typeof newData !== "object") {
        throw new Error("Data must be an object.");
      }

      const documentId = await this.resolveTargetDocumentId();
      if (!documentId) {
        return this.ResponseHelper.Error(
          "No data found with the specified query",
        );
      }

      const txn = new Transaction(this.path, this.cache);
      txn.update({ documentId }, newData);
      const commitResult = await txn.commit();

      if (!("data" in commitResult)) {
        return commitResult;
      }

      const updateOp = ((commitResult.data as { resolvedOperations?: TransactionOperation[] }).resolvedOperations ?? []).find(
        (op: TransactionOperation) => op.type === "UPDATE" && op.documentId === documentId,
      );
      if (!updateOp) {
        return this.ResponseHelper.Error("Document no longer exists");
      }

      return this.ResponseHelper.Success({
        message: "Data updated successfully",
        newData: updateOp.data,
        previousData: updateOp.oldData,
        documentId,
      });
    } catch {
      return this.ResponseHelper.Error("Failed to update data");
    }
  }

  /**
   * Updates multiple documents that match the base query.
   *
   * Routed through a single Transaction covering the whole query, so the batch
   * is WAL-backed: locking, fresh re-reads, atomic file replacement, and index
   * sync (one rewrite per affected index field, not one per document) are all
   * handled by Transaction/TransactionIndexManager.
   *
   * @param newData - The new data to replace the existing documents
   * @returns A Promise resolving to:
   *          - Success with the count and IDs of updated documents
   *          - Error if no document matched or the transaction failed
   */
  public async UpdateMany(
    newData: Record<string, unknown>,
  ): Promise<SuccessInterface | ErrorInterface> {
    try {
      // check if the data is an empty object or not
      if (Object.keys(newData).length === 0 || newData === undefined) {
        throw new Error("Data cannot be an empty.");
      }

      // check if the data is an object or not
      if (typeof newData !== "object") {
        throw new Error("Data must be an object.");
      }

      const txn = new Transaction(this.path, this.cache);
      txn.update(this.baseQuery, newData);
      const commitResult = await txn.commit();

      if (!("data" in commitResult)) {
        return commitResult;
      }

      const updateOps = ((commitResult.data as { resolvedOperations?: TransactionOperation[] }).resolvedOperations ?? []).filter(
        (op: TransactionOperation) => op.type === "UPDATE",
      );

      if (updateOps.length === 0) {
        return this.ResponseHelper.Error(
          "No data found with the specified query",
        );
      }

      return this.ResponseHelper.Success({
        message: "Data updated successfully",
        effectedData: updateOps.length,
        documentIds: updateOps.map((op: TransactionOperation) => op.documentId),
      });
    } catch {
      return this.ResponseHelper.Error("Failed to update data");
    }
  }

  /**
   * to be sorted to the query
   * @param {object} sort - The sort to be set.
   * @returns {UpdateOperation} - An instance of the UpdateOperation class.
   */
  public Sort(sort: Record<string, 1 | -1>): UpdateOperation {
    this.sort = sort;
    return this;
  }

  /**
   * Resolves the single document UpdateOne should target: runs the same
   * index-or-full-scan search UpdateMany's Transaction path uses internally,
   * then applies .Sort() (if set) and picks the first match - matching the
   * "one specific document" semantics UpdateOne has always had.
   *
   * @returns The target document's ID, or null if nothing matched.
   */
  private async resolveTargetDocumentId(): Promise<string | null> {
    let ReadResponse: SuccessInterface | ErrorInterface;
    if (this.baseQuery?.documentId !== undefined) {
      const FilePath = [
        `${this.baseQuery.documentId}${General.DBMS_File_EXT}`,
      ];
      ReadResponse = await this.LoadAllBufferRawData(FilePath);
    } else {
      const fileNames = await new ReadIndex(this.path).getFileFromIndex(this.baseQuery);
      if (fileNames && fileNames.length > 0) {
        ReadResponse = await this.LoadAllBufferRawData(fileNames);
      } else {
        ReadResponse = await this.LoadAllBufferRawData();
      }
    }

    if (!("data" in ReadResponse)) {
      return null;
    }

    const SearchedData = await new Searcher(ReadResponse.data as Record<string, unknown>[], true).find(
      this.baseQuery,
      "data",
    );

    if (SearchedData.length === 0) {
      return null;
    }

    let selectedFirstData = SearchedData[0] as unknown as { fileName: string; data: Record<string, unknown> };
    if (Object.keys(this.sort).length !== 0) {
      const Sorter: Sorting = new Sorting(SearchedData, this.sort);
      const SortedData: Array<{ fileName: string; data: Record<string, unknown> }> = await Sorter.sort("data") as unknown as Array<{ fileName: string; data: Record<string, unknown> }>;
      selectedFirstData = SortedData[0];
    }

    const fileName: string = (selectedFirstData as { fileName: string })?.fileName;
    return fileName ? fileName.split(".")[0] : null;
  }

  /**
   * Loads all buffer raw data from the specified directory.
   *
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to a success or error response.
   */
  private async LoadAllBufferRawData(
    documentIdDirectFile?: string[] | undefined,
  ): Promise<SuccessInterface | ErrorInterface> {
    // Use shared DocumentLoader helper (DRY - consolidates duplicated code)
    const result = await DocumentLoader.loadDocuments(
      this.path,
      documentIdDirectFile,
      true  // Include fileName for Update operations
    );

    // Store result in allDataWithFileName if successful
    if ("data" in result) {
      this.allDataWithFileName = result.data as Array<{ fileName: string; data: Record<string, unknown> }>;
    }

    return result;
  }
}
