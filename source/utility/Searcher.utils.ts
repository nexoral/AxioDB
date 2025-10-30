/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker } from "worker_threads";
import path from "path";
import os from "os";

const workerPath: string = path.resolve(
  __dirname,
  "../engine/node",
  "WorkerForSearch.engine.js",
);

export default class Searcher {
  private data: any[];
  private isUpdated: boolean = false;

  constructor(arr: any[], isUpdated: boolean = false) {
    this.data = arr;
    this.isUpdated = isUpdated;
  }

  /**
   * Finds items in the data array that match the given query.
   * Uses optimized search strategies based on data size.
   * Note: InMemoryCache at the Reader layer already handles query result caching.
   *
   * @param query - The query object containing conditions to match against items.
   * @param aditionalFiled - Optional field to extract from each item for matching.
   * @param findOne - If true, stops after finding the first match (early exit)
   * @returns {Promise<any[]>} - A promise that resolves to an array of matching items.
   */
  public async find(
    query: { [key: string]: any },
    additionalFiled?: string | number | undefined,
    findOne: boolean = false,
  ): Promise<any[]> {
    // For small datasets or findOne, linear search is faster (avoid worker overhead)
    if (this.data.length < 1000 || findOne) {
      const result: any[] = [];
      for (let i = 0; i < this.data.length; i++) {
        const rawItem = this.data[i];
        const item = additionalFiled ? rawItem[additionalFiled] : rawItem;
        if (
          item !== undefined &&
          item !== null &&
          Searcher.matchesQuery(item, query, this.isUpdated)
        ) {
          result.push(rawItem);
          if (findOne) return result; // Early exit for findOne
        }
      }
      return result;
    }

    // Parallel search for large datasets with complex queries
    const numWorkers = Math.min(os.cpus().length, Math.max(1, Math.ceil(this.data.length / 1000)));
    const chunkSize = Math.ceil(this.data.length / numWorkers);

    const tasks: Promise<any[]>[] = [];

    for (let i = 0; i < numWorkers; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, this.data.length);
      const dataChunk = this.data.slice(start, end);

      tasks.push(
        new Promise((resolve, reject) => {
          const worker = new Worker(workerPath, {
            workerData: {
              chunk: dataChunk,
              query,
              isUpdated: this.isUpdated,
              additionalFiled,
            },
          });

          worker.on("message", resolve);
          worker.on("error", reject);
          worker.on("exit", (code) => {
            if (code !== 0)
              reject(new Error(`Worker stopped with code ${code}`));
          });
        }),
      );
    }

    const results = await Promise.all(tasks);
    return results.flat(); // Combine all matches
  }

  /**
   * Matches an item against a query object.
   * Supports MongoDB-like operators and logical operators ($or, $and).
   *
   * @param item - The item to match against the query.
   * @param query - The query object containing conditions.
   * @returns {boolean} - True if the item matches the query, false otherwise.
   */
  public static matchesQuery(
    item: any,
    query: { [key: string]: any },
    isUpdated: boolean = false,
  ): boolean {
    // Handle root-level $or
    if ("$or" in query && Array.isArray(query.$or)) {
      const { $or, ...rest } = query;
      const orMatch = $or.some((sub) => this.matchesQuery(item, sub));
      const restMatch = Object.keys(rest).length
        ? this.matchesQuery(item, rest)
        : true;
      return orMatch && restMatch;
    }

    // Handle root-level $and
    if ("$and" in query && Array.isArray(query.$and)) {
      const { $and, ...rest } = query;
      const andMatch = query.$and.every((sub) => this.matchesQuery(item, sub));
      const restMatch = Object.keys(rest).length
        ? this.matchesQuery(item, rest)
        : true;
      return andMatch && restMatch;
    }

    // Two-pointer optimized query matching
    const queryKeys = Object.keys(query);
    const queryLength = queryKeys.length;

    // Early return for empty query
    if (queryLength === 0) return true;

    for (let i = 0; i < queryLength; i++) {
      const key = queryKeys[i];
      const queryValue = query[key];
      const itemValue = isUpdated == true ? item.data[key] : item[key];

      // If queryValue is an object (for operators)
      if (typeof queryValue === "object" && queryValue !== null) {
        // Handle MongoDB-like operators with optimized checks
        if (
          "$regex" in queryValue &&
          typeof queryValue["$regex"] === "string"
        ) {
          const regex = new RegExp(
            queryValue["$regex"],
            queryValue["$options"] || "i",
          );
          if (!regex.test(itemValue)) return false;
          continue;
        }

        if ("$gt" in queryValue) {
          if (!(typeof itemValue === "number" && itemValue > queryValue["$gt"]))
            return false;
          continue;
        }

        if ("$lt" in queryValue) {
          if (!(typeof itemValue === "number" && itemValue < queryValue["$lt"]))
            return false;
          continue;
        }

        if ("$gte" in queryValue) {
          if (
            !(typeof itemValue === "number" && itemValue >= queryValue["$gte"])
          )
            return false;
          continue;
        }

        if ("$lte" in queryValue) {
          if (
            !(typeof itemValue === "number" && itemValue <= queryValue["$lte"])
          )
            return false;
          continue;
        }

        if ("$in" in queryValue && Array.isArray(queryValue["$in"])) {
          if (!queryValue["$in"].includes(itemValue)) return false;
          continue;
        }

        if ("$eq" in queryValue) {
          if (itemValue !== queryValue["$eq"]) return false;
          continue;
        }
      }

      // Direct equality check with early failure
      if (itemValue !== queryValue) {
        return false;
      }
    }

    return true;
  }
}
