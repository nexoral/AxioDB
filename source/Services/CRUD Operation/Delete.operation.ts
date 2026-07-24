/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import ResponseHelper from "../../Helper/response.helper";
import DocumentLoader from "../../Helper/DocumentLoader.helper";

// Import All Utility
import Searcher from "../../utility/Searcher.utils";
import Sorting from "../../utility/SortData.utils";
import { General } from "../../config/Keys/Keys";
import { ReadIndex } from "../Index/ReadIndex.service";
import Transaction from "../Transaction/Transaction.service";
/**
 * The DeleteOperation class is used to delete a document from a collection.
 * This class provides methods to delete a single document that matches the base query.
 */
export default class DeleteOperation {
  // Properties
  protected readonly collectionName: string;
  private readonly baseQuery: object | any;
  private readonly path: string;
  private readonly ResponseHelper: ResponseHelper;
  private allDataWithFileName: any[] = [];
  private sort: object | any;

  constructor(
    collectionName: string,
    path: string,
    baseQuery: object | any,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.baseQuery = baseQuery;
    this.sort = {};
    this.ResponseHelper = new ResponseHelper();
    this.allDataWithFileName = []; // To store all data with file name
  }

  // Methods
  /**
   * Deletes a single document that matches the base query.
   *
   * Routed through a single-operation Transaction, so the delete is WAL-backed:
   * locking, the fresh re-read under lock, and index sync are all handled by
   * Transaction/TransactionIndexManager. This method's own job is just picking
   * *which* document to target (honoring .Sort()), since Transaction.delete()
   * removes every document a query matches.
   *
   * @returns {Promise<object>} A response object containing either:
   *   - Success: { message: "Data deleted successfully", deleteData: object }
   *   - Error: An error message if no data found or deletion fails
   */
  public async deleteOne(): Promise<SuccessInterface | ErrorInterface> {
    try {
      const documentId = await this.resolveTargetDocumentId();
      if (!documentId) {
        return this.ResponseHelper.Error(
          "No data found with the specified query",
        );
      }

      const txn = new Transaction(this.path);
      txn.delete({ documentId });
      const commitResult = await txn.commit();

      if (!("data" in commitResult)) {
        return commitResult;
      }

      const deleteOp = (commitResult.data.resolvedOperations ?? []).find(
        (op: any) => op.type === "DELETE" && op.documentId === documentId,
      );
      if (!deleteOp) {
        return this.ResponseHelper.Error("Document no longer exists");
      }

      return this.ResponseHelper.Success({
        message: "Data deleted successfully",
        deleteData: deleteOp.oldData,
      });
    } catch (error) {
      return this.ResponseHelper.Error("Failed to delete data");
    }
  }

  /**
   * Deletes multiple documents that match the base query.
   *
   * Routed through a single Transaction covering the whole query, so the batch
   * is WAL-backed: locking, fresh re-reads, and index sync (one rewrite per
   * affected index field, not one per document) are all handled by
   * Transaction/TransactionIndexManager.
   *
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to either:
   *   - Success with a success message and the deleted data
   *   - Error if no matching data is found or the transaction failed
   */
  public async deleteMany(): Promise<SuccessInterface | ErrorInterface> {
    try {
      const txn = new Transaction(this.path);
      txn.delete(this.baseQuery);
      const commitResult = await txn.commit();

      if (!("data" in commitResult)) {
        return commitResult;
      }

      const deleteOps = (commitResult.data.resolvedOperations ?? []).filter(
        (op: any) => op.type === "DELETE",
      );

      if (deleteOps.length === 0) {
        return this.ResponseHelper.Error(
          "No data found with the specified query",
        );
      }

      return this.ResponseHelper.Success({
        message: "Data deleted successfully",
        deleteData: deleteOps.map((op: any) => op.oldData),
      });
    } catch (error) {
      return this.ResponseHelper.Error("Failed to delete data");
    }
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

  /**
   * Resolves the single document deleteOne should target: runs the same
   * index-or-full-scan search deleteMany's Transaction path uses internally,
   * then applies .Sort() (if set) and picks the first match - matching the
   * "one specific document" semantics deleteOne has always had.
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
      if (fileNames.length > 0) {
        ReadResponse = await this.LoadAllBufferRawData(fileNames);
      } else {
        ReadResponse = await this.LoadAllBufferRawData();
      }
    }

    if (!("data" in ReadResponse)) {
      return null;
    }

    const SearchedData = await new Searcher(ReadResponse.data, true).find(
      this.baseQuery,
      "data",
    );

    if (SearchedData.length === 0) {
      return null;
    }

    let selectedFirstData = SearchedData[0];
    if (Object.keys(this.sort).length !== 0) {
      const Sorter: Sorting = new Sorting(SearchedData, this.sort);
      const SortedData: any[] = await Sorter.sort("data");
      selectedFirstData = SortedData[0];
    }

    const fileName: string = selectedFirstData?.fileName;
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
      true  // Include fileName for Delete operations
    );

    // Store result in allDataWithFileName if successful
    if ("data" in result) {
      this.allDataWithFileName = result.data;
    }

    return result;
  }
}
