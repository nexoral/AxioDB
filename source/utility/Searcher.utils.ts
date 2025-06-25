/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Worker } from "worker_threads";
import path from "path";

const workerPath: string = path.resolve(
  __dirname,
  "../engine/node",
  "WorkerForSearch.engine.js",
);

export default class Searcher {
  private data: any[];

  constructor(arr: any[]) {
    this.data = arr;
  }

  /**
   * Finds items in the data array that match the given query.
   * Uses worker threads to parallelize the search across multiple CPU cores.
   *
   * @param query - The query object containing conditions to match against items.
   * @param aditionalFiled - Optional field to extract from each item for matching.
   * @returns {Promise<any[]>} - A promise that resolves to an array of matching items.
   */
  public async find(
    query: { [key: string]: any },
    aditionalFiled?: string | number | undefined,
  ): Promise<any[]> {
    const numWorkers = 1; // Use a single worker for simplicity, can be adjusted based on requirements
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
              aditionalFiled,
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
      const itemValue = item[key];

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
