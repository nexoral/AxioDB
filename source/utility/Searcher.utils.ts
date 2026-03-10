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

// Compiled query cache for reusable regex and Set objects
interface CompiledQuery {
  key: string;
  type: 'regex' | 'in_set' | 'range' | 'eq' | 'direct';
  regex?: RegExp;
  inSet?: Set<any>;
  rangeOps?: { $gt?: number; $lt?: number; $gte?: number; $lte?: number };
  eqValue?: any;
  directValue?: any;
}

export default class Searcher {
  private data: any[];
  private isUpdated: boolean = false;
  private compiledQueries: CompiledQuery[] | null = null;

  constructor(arr: any[], isUpdated: boolean = false) {
    this.data = arr;
    this.isUpdated = isUpdated;
  }

  /**
   * Pre-compiles query operators for faster matching (regex, $in sets, etc.)
   */
  private compileQuery(query: { [key: string]: any }): CompiledQuery[] {
    const compiled: CompiledQuery[] = [];
    
    for (const key of Object.keys(query)) {
      if (key === '$or' || key === '$and') continue;
      
      const queryValue = query[key];
      
      if (typeof queryValue === "object" && queryValue !== null) {
        // Handle $regex - pre-compile RegExp
        if ("$regex" in queryValue) {
          const pattern = queryValue["$regex"];
          const flags = queryValue["$options"] || "i";
          compiled.push({
            key,
            type: 'regex',
            regex: pattern instanceof RegExp ? pattern : new RegExp(pattern, flags)
          });
        }
        // Handle $in - convert to Set for O(1) lookup
        else if ("$in" in queryValue && Array.isArray(queryValue["$in"])) {
          compiled.push({
            key,
            type: 'in_set',
            inSet: new Set(queryValue["$in"])
          });
        }
        // Handle range operators
        else if ("$gt" in queryValue || "$lt" in queryValue || "$gte" in queryValue || "$lte" in queryValue) {
          compiled.push({
            key,
            type: 'range',
            rangeOps: {
              $gt: queryValue["$gt"],
              $lt: queryValue["$lt"],
              $gte: queryValue["$gte"],
              $lte: queryValue["$lte"]
            }
          });
        }
        // Handle $eq
        else if ("$eq" in queryValue) {
          compiled.push({
            key,
            type: 'eq',
            eqValue: queryValue["$eq"]
          });
        }
      } else {
        // Direct value comparison
        compiled.push({
          key,
          type: 'direct',
          directValue: queryValue
        });
      }
    }
    
    return compiled;
  }

  /**
   * Fast matching using pre-compiled query.
   * Note: The item passed here should already be the actual data object to compare against.
   * The caller (find method) handles extracting via additionalFiled if needed.
   */
  private matchWithCompiled(item: any, compiled: CompiledQuery[]): boolean {
    if (!item) return false;
    
    for (const cq of compiled) {
      const itemValue = item[cq.key];
      
      switch (cq.type) {
        case 'regex':
          if (itemValue === undefined || itemValue === null) return false;
          if (!cq.regex!.test(String(itemValue))) return false;
          break;
        case 'in_set':
          if (!cq.inSet!.has(itemValue)) return false;
          break;
        case 'range': {
          if (typeof itemValue !== 'number') return false;
          const ops = cq.rangeOps!;
          if (ops.$gt !== undefined && !(itemValue > ops.$gt)) return false;
          if (ops.$lt !== undefined && !(itemValue < ops.$lt)) return false;
          if (ops.$gte !== undefined && !(itemValue >= ops.$gte)) return false;
          if (ops.$lte !== undefined && !(itemValue <= ops.$lte)) return false;
          break;
        }
        case 'eq':
          if (itemValue !== cq.eqValue) return false;
          break;
        case 'direct':
          if (itemValue !== cq.directValue) return false;
          break;
      }
    }
    return true;
  }

  /**
   * Finds items in the data array that match the given query.
   * Uses optimized search strategies based on data size.
   * Note: InMemoryCache at the Reader layer already handles query result caching.
   *
   * @param query - The query object containing conditions to match against items.
   * @param additionalFiled - Optional field to extract from each item for matching.
   * @param findOne - If true, stops after finding the first match (early exit)
   * @param limit - Optional limit for early termination (returns when limit reached)
   * @returns {Promise<any[]>} - A promise that resolves to an array of matching items.
   */
  public async find(
    query: { [key: string]: any },
    additionalFiled?: string | number | undefined,
    findOne: boolean = false,
    limit?: number,
  ): Promise<any[]> {
    // Pre-compile query for faster matching
    const hasLogicalOps = '$or' in query || '$and' in query;
    const compiled = hasLogicalOps ? null : this.compileQuery(query);
    const effectiveLimit = findOne ? 1 : limit;
    
    // For small datasets, findOne, or when limit is small - use optimized linear search
    if (this.data.length < 5000 || findOne || (effectiveLimit && effectiveLimit < 100)) {
      const result: any[] = [];
      for (let i = 0; i < this.data.length; i++) {
        const rawItem = this.data[i];
        const item = additionalFiled ? rawItem[additionalFiled] : rawItem;
        
        if (item === undefined || item === null) continue;
        
        // Use compiled query for faster matching when no logical operators
        const matches = compiled 
          ? this.matchWithCompiled(item, compiled)
          : Searcher.matchesQuery(item, query, this.isUpdated);
          
        if (matches) {
          result.push(rawItem);
          // Early termination when limit reached
          if (effectiveLimit && result.length >= effectiveLimit) {
            return result;
          }
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
        if ("$regex" in queryValue) {
          // Support both pre-compiled RegExp and string patterns
          const pattern = queryValue["$regex"];
          const regex = pattern instanceof RegExp 
            ? pattern 
            : new RegExp(pattern, queryValue["$options"] || "i");
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
          // Use Set for O(1) lookup on large arrays
          const inArray = queryValue["$in"];
          if (inArray.length > 10) {
            const inSet = new Set(inArray);
            if (!inSet.has(itemValue)) return false;
          } else {
            if (!inArray.includes(itemValue)) return false;
          }
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
