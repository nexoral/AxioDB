import {
  ErrorInterface,
  SuccessInterface,
} from "../../config/Interfaces/Helper/response.helper.interface";
import { Document, SortSpec, ProjectionSpec, VectorSearchOptions, VectorSearchConfig } from "../../config/Interfaces/shared.types";

// Import All helpers
import type { InMemoryCache } from "../../Memory/memory.operation";
import Converter from "../../Helper/Converter.helper";
import responseHelper from "../../Helper/response.helper";
import PathSanitizer from "../../Helper/PathSanitizer.helper";
import DocumentLoader from "../../Helper/DocumentLoader.helper";
// Import All Utility
import { General } from "../../config/Keys/Keys";
import Searcher from "../../utility/Searcher.utils";
import Sorting from "../../utility/SortData.utils";
import { ReadIndex } from "../Index/ReadIndex.service";
import VectorMath from "../../utility/VectorMath.utils";

/**
 * Class representing a read operation.
 */
export default class Reader {
  private readonly collectionName: string;
  private readonly path: string;
  private readonly Converter: Converter;
  private readonly baseQuery: Record<string, unknown>;
  private limit: number | undefined;
  private skip: number | undefined;
  private sort: SortSpec;
  private totalCount: boolean;
  private FindOneStatus: boolean;
  private project: ProjectionSpec;
  private readonly cache: InMemoryCache;
  private readonly ResponseHelper: responseHelper;
  private AllData: Document[];
  private indexHint: string | undefined;
  private vectorConfig: VectorSearchConfig | undefined;

  /**
   * Creates an instance of Read.
   * @param {string} collectionName - The name of the collection.
   * @param {string} path - The data to be read.
   * @param {object} baseQuery - The base query to be used.
   * @param {InMemoryCache} cache - The shared instance cache.
   */
  constructor(
    collectionName: string,
    path: string,
    baseQuery: Record<string, unknown>,
    cache: InMemoryCache,
  ) {
    this.collectionName = collectionName;
    this.path = path;
    this.limit = 25;
    this.skip = 0;
    this.FindOneStatus = false; // Default value for FindOneStatus
    this.sort = {};
    this.project = {};
    this.baseQuery = baseQuery;
    this.cache = cache;
    this.Converter = new Converter();
    this.ResponseHelper = new responseHelper();
    this.totalCount = false;
    this.AllData = [];
    this.vectorConfig = undefined;
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
      this.path,
      this.Converter.ToString(this.baseQuery),
      this.limit?.toString() ?? 'all',
      this.skip?.toString() ?? '0',
      Object.keys(this.sort).length > 0 ? this.Converter.ToString(this.sort) : 'nosort',
      this.indexHint ?? 'nohint'
    ];
    if (this.vectorConfig) {
      components.push(
        this.vectorConfig.field,
        this.vectorConfig.options.metric ?? 'cosine',
        this.vectorConfig.options.minScore?.toString() ?? 'nominscore',
        this.vectorConfig.vector.join(',')
      );
    }
    return components.join('::');
  }

  /**
   * Reads the data from a file.
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves with the response of the read operation.
   */
  public async exec(): Promise<SuccessInterface | ErrorInterface> {
    try {
      let SearchedData: Document[] = [];

      // Generate cache key with collection context (fixes cache collision bug)
      const cacheKey = this.generateCacheKey();
      
      // Check if result is in cache
      const responseFromCache = await this.cache.getCache(cacheKey);
      if (responseFromCache !== false) {
        SearchedData = responseFromCache as Document[];
        return this.applySortAndReturn(SearchedData);
      }

      // Direct documentId lookup - fastest path
      if (this.baseQuery?.documentId !== undefined) {
        // Sanitize document IDs to prevent directory traversal attacks
        const sanitizeDocId = (id: string) =>
          `${PathSanitizer.sanitizePathComponent(id)}${General.DBMS_File_EXT}`;

        const FilePath = Array.isArray(this.baseQuery.documentId)
          ? this.baseQuery.documentId.map((id) => sanitizeDocId(String(id)))
          : [sanitizeDocId(String(this.baseQuery.documentId))];

        const ReadResponse = await this.LoadAllBufferRawData(FilePath);
        if ("data" in ReadResponse) {
          const data = ReadResponse.data as Document[];
          // Fire-and-forget: Cache asynchronously
          this.cache.setCache(cacheKey, data, this.path).catch(() => {});
          return this.ApplySkipAndLimit(data);
        }
        return this.ResponseHelper.Error("Failed to read document by ID");
      }

      // Try index-based lookup first
      const indexReader = new ReadIndex(this.path);
      let indexedFileNames: string[] = [];

      // Index hint: force a specific index
      if (this.indexHint && this.baseQuery[this.indexHint] !== undefined) {
        const hintField = this.indexHint;
        const hintValue = this.baseQuery[hintField];

        if (typeof hintValue === 'object' && hintValue !== null) {
          const hintObj = hintValue as Record<string, unknown>;
          if ('$in' in hintObj) {
            indexedFileNames = await indexReader.getFilesForInOperator(hintField, hintObj.$in as unknown[]);
          } else if ('$regex' in hintObj) {
            indexedFileNames = await indexReader.getFileFromIndex({ [hintField]: hintObj });
          } else if ('$gt' in hintObj || '$gte' in hintObj || '$lt' in hintObj || '$lte' in hintObj) {
            indexedFileNames = await indexReader.getFilesForRangeOperator(hintField, hintObj as { $gt?: number; $gte?: number; $lt?: number; $lte?: number });
          } else {
            indexedFileNames = await indexReader.getFileFromIndex({ [hintField]: hintObj });
          }
        } else {
          indexedFileNames = await indexReader.getFileFromIndex({ [hintField]: hintValue });
        }
      } else {
        // Auto-detect best index
        const queryKeys = Object.keys(this.baseQuery);
        if (queryKeys.length === 1 && queryKeys[0] === '$or' && Array.isArray(this.baseQuery.$or)) {
          const orBranches = this.baseQuery.$or as Record<string, unknown>[];
          const unionFiles = new Set<string>();
          let allBranchesIndexed = orBranches.length > 0;

          for (const branch of orBranches) {
            if (typeof branch === 'object' && branch !== null && Object.keys(branch).length === 1) {
              const bKey = Object.keys(branch)[0];
              const bVal = branch[bKey];
              const matched = await indexReader.findMatchingIndexMeta(branch);
              if (matched && matched.length > 0) {
                let branchFiles: string[] = [];
                if (typeof bVal === 'object' && bVal !== null) {
                  const bObj = bVal as Record<string, unknown>;
                  if ('$eq' in bObj) {
                    branchFiles = await indexReader.getFileFromIndex({ [bKey]: bObj.$eq });
                  } else if ('$in' in bObj && Array.isArray(bObj.$in)) {
                    branchFiles = await indexReader.getFilesForInOperator(bKey, bObj.$in);
                  } else if ('$gt' in bObj || '$gte' in bObj || '$lt' in bObj || '$lte' in bObj) {
                    branchFiles = await indexReader.getFilesForRangeOperator(bKey, bObj as { $gt?: number; $gte?: number; $lt?: number; $lte?: number });
                  } else {
                    allBranchesIndexed = false;
                    break;
                  }
                } else {
                  branchFiles = await indexReader.getFileFromIndex(branch);
                }
                branchFiles.forEach(f => unionFiles.add(f));
              } else {
                allBranchesIndexed = false;
                break;
              }
            } else {
              allBranchesIndexed = false;
              break;
            }
          }

          if (allBranchesIndexed) {
            if (unionFiles.size === 0) {
              return this.ResponseHelper.Success({ documents: [] });
            }
            indexedFileNames = Array.from(unionFiles);
          }
        } else if (queryKeys.length === 1) {
          const fieldName = queryKeys[0];
          const fieldValue = this.baseQuery[fieldName];

          if (typeof fieldValue === 'object' && fieldValue !== null) {
            const fieldObj = fieldValue as Record<string, unknown>;
            if ('$eq' in fieldObj) {
              const matchedIndexes = await indexReader.findMatchingIndexMeta(this.baseQuery);
              const isFieldIndexed = Boolean(matchedIndexes && matchedIndexes.length > 0);
              indexedFileNames = await indexReader.getFileFromIndex({ [fieldName]: fieldObj.$eq });
              if (isFieldIndexed && indexedFileNames.length === 0) {
                return this.ResponseHelper.Success({ documents: [] });
              }
            } else if ('$in' in fieldObj) {
              indexedFileNames = await indexReader.getFilesForInOperator(fieldName, fieldObj.$in as unknown[]);
            } else if ('$regex' in fieldObj) {
              const prefixInfo = this.detectPrefixPattern(fieldObj.$regex as string | RegExp, fieldObj.$options as string | undefined);
              if (prefixInfo.isPrefix && prefixInfo.prefix) {
                indexedFileNames = await indexReader.getFilesForPrefixQuery(
                  fieldName,
                  prefixInfo.prefix,
                  prefixInfo.caseInsensitive
                );
              }
            } else if ('$gt' in fieldObj || '$gte' in fieldObj || '$lt' in fieldObj || '$lte' in fieldObj) {
              const sortEntries = Object.entries(this.sort);
              let rangeOrder: 1 | -1 = 1;
              let rangeLimit: number | undefined;
              if (!this.totalCount && sortEntries.length === 1 && sortEntries[0][0] === fieldName) {
                rangeOrder = sortEntries[0][1] === -1 ? -1 : 1;
                if (this.limit !== undefined && this.limit > 0) {
                  rangeLimit = (this.skip || 0) + this.limit;
                }
              }
              indexedFileNames = await indexReader.getFilesForRangeOperator(
                fieldName,
                fieldObj as { $gt?: number; $gte?: number; $lt?: number; $lte?: number },
                rangeOrder,
                rangeLimit,
              );
            }
          } else {
            const matchedIndexes = await indexReader.findMatchingIndexMeta(this.baseQuery);
            const isFieldIndexed = Boolean(matchedIndexes && matchedIndexes.length > 0);
            indexedFileNames = await indexReader.getFileFromIndex(this.baseQuery);
            if (isFieldIndexed && indexedFileNames.length === 0) {
              return this.ResponseHelper.Success({ documents: [] });
            }
          }
        } else if (queryKeys.length === 0) {
          const sortEntries = Object.entries(this.sort);
          if (!this.totalCount && sortEntries.length === 1) {
            const [sortField, sortOrder] = sortEntries[0];
            const order: 1 | -1 = sortOrder === -1 ? -1 : 1;
            const needed = (this.limit !== undefined && this.limit > 0)
              ? (this.skip || 0) + this.limit
              : undefined;
            indexedFileNames = await indexReader.getSortedFiles(sortField, order, needed);
          } else {
            indexedFileNames = await indexReader.getFileFromIndex(this.baseQuery);
          }
        } else {
          indexedFileNames = await indexReader.getFileFromIndex(this.baseQuery);
        }
      }

      let ReadResponse;
      let usedIndex = false;

      if (indexedFileNames && indexedFileNames.length > 0) {
        let filesToLoad = indexedFileNames;
        const sortEntries = Object.entries(this.sort);
        const isSortCompatible =
          sortEntries.length === 0 ||
          (sortEntries.length === 1 &&
            (Object.keys(this.baseQuery).length === 0 ||
              (Object.keys(this.baseQuery).length === 1 && sortEntries[0][0] === Object.keys(this.baseQuery)[0])));

        if (
          !this.vectorConfig &&
          !this.totalCount &&
          isSortCompatible &&
          this.limit !== undefined &&
          this.limit > 0
        ) {
          const needed = (this.skip || 0) + this.limit;
          if (filesToLoad.length > needed) {
            filesToLoad = filesToLoad.slice(0, needed);
          }
        }
        // Index hit - load only indexed files (much faster)
        ReadResponse = await this.LoadAllBufferRawData(filesToLoad);
        usedIndex = true;
      } else {
        const maxFiles =
          !this.vectorConfig &&
          !this.totalCount &&
          Object.keys(this.baseQuery).length === 0 &&
          Object.keys(this.sort).length === 0 &&
          this.limit !== undefined &&
          this.limit > 0
            ? (this.skip || 0) + this.limit
            : undefined;
        const earlyLimit =
          !this.vectorConfig &&
          !this.totalCount &&
          Object.keys(this.sort).length === 0 &&
          this.limit !== undefined &&
          this.limit > 0
            ? (this.skip || 0) + this.limit
            : undefined;
        ReadResponse = await this.LoadAllBufferRawData(undefined, maxFiles, earlyLimit);
      }

      if (!("data" in ReadResponse)) {
        return this.ResponseHelper.Error("Failed to read data");
      }

      // If no query filters, return all data
      if (Object.keys(this.baseQuery).length === 0) {
        const data = ReadResponse.data as Document[];
        // Fire-and-forget: Cache asynchronously
        this.cache.setCache(cacheKey, data, this.path).catch(() => {});
        return this.applySortAndReturn(data);
      }

      // If we used index for exact match (single field, no operators), data is already filtered
      if (usedIndex && this.isExactIndexMatch()) {
        SearchedData = ReadResponse.data as Document[];
      } else {
        // Apply searcher for complex queries or partial index matches
        const searcher: Searcher = new Searcher(ReadResponse.data as Record<string, unknown>[]);
        const searchLimit =
          !this.vectorConfig &&
          Object.keys(this.sort).length === 0 && this.limit !== undefined && this.limit > 0
            ? (this.skip || 0) + this.limit
            : undefined;
        SearchedData = await searcher.find(
          this.baseQuery,
          undefined,
          this.FindOneStatus,
          searchLimit,
        );
      }

      // Fire-and-forget: Cache asynchronously
      this.cache.setCache(cacheKey, SearchedData, this.path).catch(() => {});

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
   * Detects if a regex pattern is a simple prefix match (e.g., /^John/, /^admin@/)
   * and extracts the prefix for index optimization
   *
   * @param regex - The regex pattern (RegExp object or string)
   * @param options - Optional regex flags (e.g., 'i' for case-insensitive)
   * @returns Object with isPrefix flag, prefix string, and case-insensitive flag
   *
   * @example
   * detectPrefixPattern(/^John/, 'i') // { isPrefix: true, prefix: 'John', caseInsensitive: true }
   * detectPrefixPattern(/John/) // { isPrefix: false }
   * detectPrefixPattern(/^test[0-9]+/) // { isPrefix: false } - complex pattern
   */
  private detectPrefixPattern(
    regex: RegExp | string,
    options?: string
  ): { isPrefix: boolean; prefix?: string; caseInsensitive: boolean } {
    const regexStr = regex instanceof RegExp ? regex.source : String(regex);
    const flags = regex instanceof RegExp ? regex.flags : (options || '');

    // Match simple prefix patterns: ^abc, ^test, ^John (alphanumeric, underscore, dash, @, .)
    // Excludes complex patterns with [], *, +, {}, etc.
    const prefixMatch = regexStr.match(/^\^([a-zA-Z0-9_\-@.]+)$/);

    if (prefixMatch) {
      return {
        isPrefix: true,
        prefix: prefixMatch[1],
        caseInsensitive: flags.includes('i')
      };
    }

    return { isPrefix: false, caseInsensitive: false };
  }

  /**
   * Applies sorting if needed and returns data with skip/limit
   */
  private async applySortAndReturn(data: Document[]): Promise<SuccessInterface | ErrorInterface> {
    if (this.vectorConfig) {
      return this.applyVectorSearch(data);
    }
    if (Object.keys(this.sort).length === 0) {
      return this.ApplySkipAndLimit(data);
    }
    const Sorter: Sorting = new Sorting(data, this.sort);
    const SortedData: Document[] = await Sorter.sort();
    return this.ApplySkipAndLimit(SortedData);
  }

  /**
   * Scores and ranks documents based on vector similarity or distance.
   */
  private async applyVectorSearch(data: Document[]): Promise<SuccessInterface | ErrorInterface> {
    if (!this.vectorConfig) {
      return this.ApplySkipAndLimit(data);
    }

    const { field, vector, options } = this.vectorConfig;
    const metric = options.metric || "cosine";
    const minScore = options.minScore;
    const targetDim = vector.length;

    const scored: Array<Document & { _score: number }> = [];

    for (let i = 0; i < data.length; i++) {
      const doc = data[i];
      if (!doc || typeof doc !== "object") continue;

      const docVec = (doc as Record<string, unknown>)[field];
      if (!VectorMath.isValidVector(docVec, targetDim)) {
        continue;
      }

      let score = 0;
      if (metric === "cosine") {
        score = VectorMath.cosineSimilarity(vector, docVec);
      } else if (metric === "dot") {
        score = VectorMath.dotProduct(vector, docVec);
      } else if (metric === "euclidean") {
        score = VectorMath.euclideanDistance(vector, docVec);
      }

      if (metric === "euclidean") {
        if (minScore !== undefined && score > minScore) {
          continue;
        }
      } else {
        if (minScore !== undefined && score < minScore) {
          continue;
        }
      }

      scored.push({
        ...doc,
        _score: Number(score.toFixed(6)),
      });
    }

    if (metric === "euclidean") {
      scored.sort((a, b) => a._score - b._score);
    } else {
      scored.sort((a, b) => b._score - a._score);
    }

    return this.ApplySkipAndLimit(scored);
  }

  /**
   * Configures a vector semantic similarity search on the query results.
   *
   * @param field - Document field name containing vector embeddings (number[]).
   * @param targetVector - Target query vector to compare against.
   * @param options - Configuration options (topK, minScore, metric).
   * @returns This Reader instance for chainable execution.
   */
  public vectorSearch(
    field: string,
    targetVector: number[],
    options: VectorSearchOptions = {},
  ): Reader {
    if (typeof field !== "string" || field.trim().length === 0) {
      throw new Error("Vector field name must be a non-empty string");
    }
    if (!Array.isArray(targetVector) || targetVector.length === 0) {
      throw new Error("Target vector must be a non-empty array of numbers");
    }
    for (let i = 0; i < targetVector.length; i++) {
      const val = targetVector[i];
      if (typeof val !== "number" || !Number.isFinite(val)) {
        throw new Error("Target vector elements must be finite numbers");
      }
    }
    if (options.topK !== undefined) {
      if (typeof options.topK !== "number" || !Number.isInteger(options.topK) || options.topK <= 0) {
        throw new Error("topK must be a positive integer");
      }
      this.limit = options.topK;
    }
    if (options.minScore !== undefined) {
      if (typeof options.minScore !== "number" || !Number.isFinite(options.minScore)) {
        throw new Error("minScore must be a finite number");
      }
    }
    if (options.metric !== undefined) {
      const validMetrics = ["cosine", "dot", "euclidean"];
      if (!validMetrics.includes(options.metric)) {
        throw new Error(
          `Unsupported metric: ${options.metric}. Supported metrics are: cosine, dot, euclidean`,
        );
      }
    }

    this.vectorConfig = {
      field: field.trim(),
      vector: targetVector,
      options,
    };

    return this;
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
  public Sort(sort: SortSpec): Reader {
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

  /**
   * Forces a specific index to be used for the query.
   * @param {string} indexName - The indexed field name to use.
   * @returns {Reader} - An instance of the Reader class.
   */
  public hint(indexName: string): Reader {
    if (typeof indexName !== "string") {
      throw new Error("Hint should be a string (index field name)");
    }
    this.indexHint = indexName;
    return this;
  }

  public setProject(project: ProjectionSpec): Reader {
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
   * 3. Reads each file.
   * 4. Stores the data in the `AllData` array.
   * 5. If the directory is locked, it unlocks the directory, reads the files, and then locks the directory again.
   *
   * @returns {Promise<SuccessInterface | ErrorInterface>} A promise that resolves to a success or error response.
   *
   * @throws {Error} Throws an error if any operation fails.
   */
  private async LoadAllBufferRawData(
    documentIdDirectFile?: string[] | undefined,
    maxFiles?: number,
    limit?: number,
  ): Promise<SuccessInterface | ErrorInterface> {
    // Use shared DocumentLoader helper (DRY - consolidates duplicated code)
    const result = await DocumentLoader.loadDocuments(
      this.path,
      documentIdDirectFile,
      false, // Don't include fileName for Reader
      this.baseQuery,
      maxFiles,
      limit,
    );

    // Store result in AllData if successful
    if ("data" in result) {
      this.AllData = result.data as Document[];
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
   * @param {Document[]} FinalData - The array of data to apply skip and limit to.
   * @returns {Promise<SuccessInterface | ErrorInterface>} - A promise that resolves to a success interface containing the sliced data or the original data.
   */
  private async ApplySkipAndLimit(
    FinalData: Document[],
  ): Promise<SuccessInterface | ErrorInterface> {
    // Check if FindOneStatus is true
    if (this.FindOneStatus === true) {
      // If FindOneStatus is true then return the first document
      if (FinalData.length > 0) {
        if (Object.keys(this.project).length !== 0) {
          const projectionresponse = await this.ApplyProjection([FinalData[0]]);
          if ("data" in projectionresponse) {
            const projData = projectionresponse.data as { documents: Document[] };
            return this.ResponseHelper.Success({
              documents: projData.documents[0],
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
      const limitedAndSkippedData: Document[] = FinalData.slice(
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
            const projData = projectionresponse.data as { documents: Document[] };
            return this.ResponseHelper.Success({
              documents: projData.documents,
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
            const projData = projectionresponse.data as { documents: Document[] };
            return this.ResponseHelper.Success({
              documents: projData.documents,
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
    FinalData: Document[],
  ): Promise<SuccessInterface | ErrorInterface> {
    // Special keys
    const SpecialKeys = ["documentId", "_score"];

    // Apply Project
    if (Object.keys(this.project).length !== 0) {
      const projectedData: Document[] = FinalData.map((data) => {
        const projectedObject: Document = {};
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
