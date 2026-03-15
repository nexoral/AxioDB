/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";

// Import All helpers
import InMemoryCache from "../../Memory/memory.operation";
import Converter from "../../Helper/Converter.helper";
import { CryptoHelper } from "../../Helper/Crypto.helper";
import responseHelper from "../../Helper/response.helper";
import PathSanitizer from "../../Helper/PathSanitizer.helper";
import DocumentLoader from "../../Helper/DocumentLoader.helper";
// Import All Utility
import { General } from "../../config/Keys/Keys";
import Searcher from "../../utility/Searcher.utils";
import Sorting from "../../utility/SortData.utils";
import { ReadIndex } from "../Index/ReadIndex.service";

/**
 * Class representing a read operation.
 */
export default class Reader {
  private readonly collectionName: string;
  private readonly path: string | any;
  private readonly Converter: Converter;
  private readonly baseQuery: object | any;
  private limit: number | undefined;
  private skip: number | undefined;
  private sort: object | any;
  private isEncrypted: boolean;
  private encryptionKey: string | undefined;
  private cryptoInstance?: CryptoHelper;
  private totalCount: boolean;
  private FindOneStatus: boolean;
  private project: object | any;
  private readonly ResponseHelper: responseHelper;
  private AllData: any[];

  /**
   * Creates an instance of Read.
   * @param {string} collectionName - The name of the collection.
   * @param {string} path - The data to be read.
   * @param {object} baseQuery - The base query to be used.
   * @param {boolean} isEncrypted - The encryption status.
   * @param {string} encryptionKey - The encryption key.
   */
  constructor(
    collectionName: string,
    path: string,
    baseQuery: object | any,
    isEncrypted: boolean = false,
    encryptionKey?: string,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.limit = 10;
    this.skip = 0;
    this.FindOneStatus = false; // Default value for FindOneStatus
    this.isEncrypted = isEncrypted;
    this.sort = {};
    this.project = {};
    this.baseQuery = baseQuery;
    this.Converter = new Converter();
    this.encryptionKey = encryptionKey;
    this.ResponseHelper = new responseHelper();
    this.totalCount = false;
    this.AllData = [];
    if (this.isEncrypted === true) {
      this.cryptoInstance = new CryptoHelper(this.encryptionKey);
    }
  }

  /**
   * Generates a comprehensive cache key including collection context
   * Prevents cache collisions between different collections with same query
   *
   * Format: {collectionPath}::{query}::{limit}::{skip}::{sort}
   *
   * @returns Cache key string
   * @private
   */
  private generateCacheKey(): string {
    const components = [
      this.path,  // Collection path prevents cross-collection collisions
      this.Converter.ToString(this.baseQuery),
      this.limit?.toString() ?? 'all',
      this.skip?.toString() ?? '0',
      Object.keys(this.sort).length > 0 ? this.Converter.ToString(this.sort) : 'nosort'
    ];
    return components.join('::');
  }

  /**
   * Reads the data from a file.
   * @returns {Promise<any>} A promise that resolves with the response of the read operation.
   */
  public async exec(): Promise<SuccessInterface | ErrorInterface> {
    try {
      let SearchedData: any[] = [];

      // Generate cache key with collection context (fixes cache collision bug)
      const cacheKey = this.generateCacheKey();
      
      // Check if result is in cache
      const responseFromCache = await InMemoryCache.getCache(cacheKey);
      if (responseFromCache !== false) {
        SearchedData = responseFromCache;
        return this.applySortAndReturn(SearchedData);
      }

      // Direct documentId lookup - fastest path
      if (this.baseQuery?.documentId !== undefined) {
        // Sanitize document IDs to prevent directory traversal attacks
        const sanitizeDocId = (id: string) =>
          `${PathSanitizer.sanitizePathComponent(id)}${General.DBMS_File_EXT}`;

        const FilePath = Array.isArray(this.baseQuery.documentId)
          ? this.baseQuery.documentId.map(sanitizeDocId)
          : [sanitizeDocId(this.baseQuery.documentId)];

        const ReadResponse = await this.LoadAllBufferRawData(FilePath);
        if ("data" in ReadResponse) {
          // Fire-and-forget: Cache asynchronously
          InMemoryCache.setCache(cacheKey, ReadResponse.data).catch(() => {});
          return this.ApplySkipAndLimit(ReadResponse.data);
        }
        return this.ResponseHelper.Error("Failed to read document by ID");
      }

      // Try index-based lookup first
      const indexReader = new ReadIndex(this.path);
      const indexedFileNames = await indexReader.getFileFromIndex(this.baseQuery);
      
      let ReadResponse;
      let usedIndex = false;
      
      if (indexedFileNames && indexedFileNames.length > 0) {
        // Index hit - load only indexed files (much faster)
        ReadResponse = await this.LoadAllBufferRawData(indexedFileNames);
        usedIndex = true;
      } else {
        // No index match - full collection scan required
        ReadResponse = await this.LoadAllBufferRawData();
      }

      if (!("data" in ReadResponse)) {
        return this.ResponseHelper.Error("Failed to read data");
      }

      // If no query filters, return all data
      if (Object.keys(this.baseQuery).length === 0) {
        // Fire-and-forget: Cache asynchronously
        InMemoryCache.setCache(cacheKey, ReadResponse.data).catch(() => {});
        return this.applySortAndReturn(ReadResponse.data);
      }

      // If we used index for exact match (single field, no operators), data is already filtered
      if (usedIndex && this.isExactIndexMatch()) {
        SearchedData = ReadResponse.data;
      } else {
        // Apply searcher for complex queries or partial index matches
        const searcher: Searcher = new Searcher(ReadResponse.data);
        SearchedData = await searcher.find(this.baseQuery);
      }

      // Fire-and-forget: Cache asynchronously
      InMemoryCache.setCache(cacheKey, SearchedData).catch(() => {});
      
      return this.applySortAndReturn(SearchedData);
    } catch (error) {
      return this.ResponseHelper.Error(error);
    }
  }

  /**
   * Checks if the query is an exact match on a single indexed field (no operators)
   */
  private isExactIndexMatch(): boolean {
    const queryKeys = Object.keys(this.baseQuery);
    if (queryKeys.length !== 1) return false;
    
    const value = this.baseQuery[queryKeys[0]];
    // Exact match if value is primitive (not an operator object)
    return typeof value !== 'object' || value === null;
  }

  /**
   * Applies sorting if needed and returns data with skip/limit
   */
  private async applySortAndReturn(data: any[]): Promise<SuccessInterface | ErrorInterface> {
    if (Object.keys(this.sort).length === 0) {
      return this.ApplySkipAndLimit(data);
    }
    const Sorter: Sorting = new Sorting(data, this.sort);
    const SortedData: any[] = await Sorter.sort();
    return this.ApplySkipAndLimit(SortedData);
  }

  /**
   * set limit to the query
   * @param {number} limit - The limit to be set.
   * @returns {Reader} - An instance of the Reader class.
   */
  public Limit(limit: number): Reader {
    // Check if limit is a number or not
    if (typeof limit !== "number") {
      throw new Error("Limit should be a number");
    }
    this.limit = limit;
    return this;
  }

  /**
   * to be skipped to the query
   * @param {number} skip - The skip to be set.
   * @returns {Reader} - An instance of the Reader class.
   */

  public Skip(skip: number): Reader {
    // Check if skip is a number or not
    if (typeof skip !== "number") {
      throw new Error("Skip should be a number");
    }
    this.skip = skip;
    return this;
  }

  /**
   * to be sorted to the query
   * @param {object} sort - The sort to be set.
   * @returns {Reader} - An instance of the Reader class.
   */
  public Sort(sort: object | any): Reader {
    // check if sort is an object or not
    if (typeof sort !== "object") {
      throw new Error("Sort should be an object");
    }
    this.sort = sort;
    return this;
  }

  /**
   * Sets whether to include the total count of matching documents in the result.
   *
   * @param count - Boolean flag indicating whether to include the total count
   * @returns The Reader instance for method chaining
   */
  public setCount(count: boolean): Reader {
    this.totalCount = count;
    return this;
  }

  public findOne(status: boolean = false): Reader {
    this.FindOneStatus = status;
    return this;
  }

  public setProject(project: object | any): Reader {
    // check if project is an object or not
    if (typeof project !== "object") {
      throw new Error("Project should be an object");
    }
    this.project = project;
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
      false  // Don't include fileName for Reader
    );

    // Store result in AllData if successful
    if ("data" in result) {
      this.AllData = result.data;
    }

    return result;
  }

  /**
   * Applies skip and limit to the provided data array.
   *
   * This method checks if both `limit` and `skip` are defined. If they are,
   * it slices the `FinalData` array according to the `skip` and `limit` values
   * and returns the sliced data. If either `limit` or `skip` is not defined,
   * it returns the original `FinalData` array.
   *
   * @param {any[]} FinalData - The array of data to apply skip and limit to.
   * @returns {Promise<SuccessInterface | ErrorInterface>} - A promise that resolves to a success interface containing the sliced data or the original data.
   */
  private async ApplySkipAndLimit(
    FinalData: any[],
  ): Promise<SuccessInterface | ErrorInterface> {
    // Check if FindOneStatus is true
    if (this.FindOneStatus === true) {
      // If FindOneStatus is true then return the first document
      if (FinalData.length > 0) {
        if (Object.keys(this.project).length !== 0) {
          const projectionresponse = await this.ApplyProjection([FinalData[0]]);
          if ("data" in projectionresponse) {
            return this.ResponseHelper.Success({
              documents: projectionresponse.data.documents[0],
            });
          }
        }
        return this.ResponseHelper.Success({
          documents: FinalData[0],
        });
      } else {
        return this.ResponseHelper.Error("No documents found");
      }
    }
    // Check if limit is passed or not
    if (this.limit !== undefined && this.skip !== undefined) {
      // Apply Skip and Limit
      const limitedAndSkippedData: any[] = FinalData.slice(
        this.skip,
        this.skip + this.limit,
      );

      if (this.totalCount) {
        // Apply Projectd if total count is true
        if (Object.keys(this.project).length !== 0) {
          const projectionresponse = await this.ApplyProjection(
            limitedAndSkippedData,
          );
          if ("data" in projectionresponse) {
            return this.ResponseHelper.Success({
              documents: projectionresponse.data.documents,
              totalDocuments: FinalData.length,
            });
          }
        }
        return this.ResponseHelper.Success({
          documents: limitedAndSkippedData,
          totalDocuments: limitedAndSkippedData.length,
        });
      } else {
        if (Object.keys(this.project).length !== 0) {
          const projectionresponse = await this.ApplyProjection(
            limitedAndSkippedData,
          );
          if ("data" in projectionresponse) {
            return this.ResponseHelper.Success({
              documents: projectionresponse.data.documents,
            });
          }
        }
        return this.ResponseHelper.Success({
          documents: limitedAndSkippedData,
        });
      }
    }
    return this.ResponseHelper.Success({
      documents: FinalData,
    });
  }

  // Apply Projection
  private async ApplyProjection(
    FinalData: any[],
  ): Promise<SuccessInterface | ErrorInterface> {
    // Special keys
    const SpecialKeys = ["documentId"];

    // Apply Project
    if (Object.keys(this.project).length !== 0) {
      const projectedData: any[] = FinalData.map((data) => {
        const projectedObject: any = {};
        const keys = Object.keys(this.project);
        const hasInclude = keys.some((key) => this.project[key] === 1);
        const hasExclude = keys.every((key) => this.project[key] === 0);

        if (hasInclude) {
          for (const [key, value] of Object.entries(this.project)) {
            if (value === 1) {
              projectedObject[key] = key in data ? data[key] : null;
            }
          }
        } else if (hasExclude) {
          for (const key in data) {
            if (!(key in this.project)) {
              projectedObject[key] = data[key];
            }
          }
        } else {
          throw new Error(
            "Invalid projection: mixing inclusion and exclusion is not allowed.",
          );
        }

        // Always include documentId (and optionally updatedAt)
        SpecialKeys.forEach((key) => {
          if (key in data) {
            projectedObject[key] = data[key];
          }
        });
        return projectedObject;
      });
      return this.ResponseHelper.Success({
        documents: projectedData,
      });
    }
    return this.ResponseHelper.Success({
      documents: FinalData,
    });
  }
}
