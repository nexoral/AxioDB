import { Worker } from "worker_threads";
import path from "path";
import os from "os";
import RegexGuard from "../Helper/RegexGuard.helper";

const workerPath: string = path.resolve(
  __dirname,
  "../engine/node",
  "WorkerForSearch.engine.js",
);

// Compiled query cache for reusable regex and Set objects
interface CompiledQuery {
  key: string;
  type: 'regex' | 'in_set' | 'range' | 'eq' | 'direct' | 'ne' | 'nin';
  regex?: RegExp;
  inSet?: Set<unknown>;
  rangeOps?: { $gt?: number; $lt?: number; $gte?: number; $lte?: number };
  eqValue?: unknown;
  directValue?: unknown;
}

export default class Searcher {
  private data: Record<string, unknown>[];
  private isUpdated: boolean = false;
  private compiledQueries: CompiledQuery[] | null = null;

  constructor(arr: Record<string, unknown>[], isUpdated: boolean = false) {
    this.data = arr;
    this.isUpdated = isUpdated;
  }

  /**
   * Pre-compiles query operators for faster matching (regex, $in sets, etc.)
   */
  private compileQuery(query: Record<string, unknown>): CompiledQuery[] {
    const compiled: CompiledQuery[] = [];
    
    for (const key of Object.keys(query)) {
      if (key === '$or' || key === '$and') continue;
      
      const queryValue = query[key];
      
      if (typeof queryValue === "object" && queryValue !== null) {
        const qv = queryValue as Record<string, unknown>;
        // Handle $regex - pre-compile RegExp
        if ("$regex" in qv) {
          const pattern = qv["$regex"] as string | RegExp;
          const flags = (qv["$options"] as string) || "i";
          compiled.push({
            key,
            type: 'regex',
            regex: pattern instanceof RegExp ? pattern : RegexGuard.compileRegex(pattern, flags)
          });
        }
        // Handle $in - convert to Set for O(1) lookup
        else if ("$in" in qv && Array.isArray(qv["$in"])) {
          compiled.push({
            key,
            type: 'in_set',
            inSet: new Set(qv["$in"])
          });
        }
        // Handle range operators
        else if ("$gt" in qv || "$lt" in qv || "$gte" in qv || "$lte" in qv) {
          compiled.push({
            key,
            type: 'range',
            rangeOps: {
              $gt: qv["$gt"] as number | undefined,
              $lt: qv["$lt"] as number | undefined,
              $gte: qv["$gte"] as number | undefined,
              $lte: qv["$lte"] as number | undefined
            }
          });
        }
        // Handle $eq
        else if ("$eq" in qv) {
          compiled.push({
            key,
            type: 'eq',
            eqValue: qv["$eq"]
          });
        }
        // Handle $ne
        else if ("$ne" in qv) {
          compiled.push({
            key,
            type: 'ne',
            eqValue: qv["$ne"]
          });
        }
        // Handle $nin - convert to Set for O(1) lookup
        else if ("$nin" in qv && Array.isArray(qv["$nin"])) {
          compiled.push({
            key,
            type: 'nin',
            inSet: new Set(qv["$nin"])
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
  private matchWithCompiled(item: Record<string, unknown>, compiled: CompiledQuery[]): boolean {
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
        case 'ne':
          if (itemValue === cq.eqValue) return false;
          break;
        case 'nin':
          if (cq.inSet!.has(itemValue)) return false;
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
    query: Record<string, unknown>,
    additionalFiled?: string | number | undefined,
    findOne: boolean = false,
    limit?: number,
  ): Promise<Record<string, unknown>[]> {
    // Pre-compile query for faster matching
    const hasLogicalOps = '$or' in query || '$and' in query || '$nor' in query;
    let compiled: CompiledQuery[] | null = hasLogicalOps
      ? null
      : this.compileQuery(query);
    // If some query keys use operators not covered by the compiled fast path
    // ($not, $elemMatch, $size, $all, $exists, $type, etc.), the partial compiled
    // list would silently match every document. Fall back to matchesQuery instead.
    if (
      compiled !== null &&
      compiled.length !== Object.keys(query).length
    ) {
      compiled = null;
    }
    const effectiveLimit = findOne ? 1 : limit;
    
    // For small datasets, findOne, or when limit is small - use optimized linear search
    if (findOne || (effectiveLimit && effectiveLimit < 1000) || this.data.length < 10000) {
      const result: Record<string, unknown>[] = [];
      for (let i = 0; i < this.data.length; i++) {
        const rawItem = this.data[i];
        const item = additionalFiled ? rawItem[additionalFiled] : rawItem;
        
        if (item === undefined || item === null) continue;
        
        // Use compiled query for faster matching when no logical operators
        const matches = compiled 
          ? this.matchWithCompiled(item as Record<string, unknown>, compiled)
          : Searcher.matchesQuery(item as Record<string, unknown>, query, this.isUpdated);
          
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

    const tasks: Promise<Record<string, unknown>[]>[] = [];

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
    item: Record<string, unknown>,
    query: Record<string, unknown>,
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
      const rest = Object.fromEntries(
        Object.entries(query).filter(([k]) => k !== "$and")
      );
      const andMatch = query.$and.every((sub) => this.matchesQuery(item, sub));
      const restMatch = Object.keys(rest).length
        ? this.matchesQuery(item, rest)
        : true;
      return andMatch && restMatch;
    }

    // Handle root-level $nor (negated OR - none of the conditions should match)
    if ("$nor" in query && Array.isArray(query.$nor)) {
      const { $nor, ...rest } = query;
      const norMatch = !$nor.some((sub) => this.matchesQuery(item, sub));
      const restMatch = Object.keys(rest).length
        ? this.matchesQuery(item, rest)
        : true;
      return norMatch && restMatch;
    }

    // Two-pointer optimized query matching
    const queryKeys = Object.keys(query);
    const queryLength = queryKeys.length;

    // Early return for empty query
    if (queryLength === 0) return true;

    for (let i = 0; i < queryLength; i++) {
      const key = queryKeys[i];
      const queryValue = query[key];
      const itemValue = isUpdated == true ? (item.data as Record<string, unknown>)[key] : item[key];

      // If queryValue is an object (for operators)
      if (typeof queryValue === "object" && queryValue !== null) {
        const qv = queryValue as Record<string, unknown>;
        // Handle MongoDB-like operators with optimized checks
        if ("$regex" in qv) {
          // Support both pre-compiled RegExp and string patterns
          const pattern = qv["$regex"] as string | RegExp;
          const regex = pattern instanceof RegExp 
            ? pattern 
            : RegexGuard.compileRegex(pattern, (qv["$options"] as string) || "i");
          if (!regex.test(String(itemValue))) return false;
          continue;
        }

        // Handle range operators - check all that are present (don't use continue to allow combined $gte + $lte)
        const hasRangeOp = "$gt" in qv || "$lt" in qv || "$gte" in qv || "$lte" in qv;
        if (hasRangeOp) {
          if (typeof itemValue !== "number") return false;
          if ("$gt" in qv && !(itemValue > (qv["$gt"] as number))) return false;
          if ("$lt" in qv && !(itemValue < (qv["$lt"] as number))) return false;
          if ("$gte" in qv && !(itemValue >= (qv["$gte"] as number))) return false;
          if ("$lte" in qv && !(itemValue <= (qv["$lte"] as number))) return false;
          continue;
        }

        if ("$in" in qv && Array.isArray(qv["$in"])) {
          // Use Set for O(1) lookup on large arrays
          const inArray = qv["$in"] as unknown[];
          if (inArray.length > 10) {
            const inSet = new Set(inArray);
            if (!inSet.has(itemValue)) return false;
          } else {
            if (!inArray.includes(itemValue)) return false;
          }
          continue;
        }

        // $exists - Check if field exists in document
        if ("$exists" in qv) {
          const shouldExist = qv["$exists"] as boolean;
          const fieldExists = itemValue !== undefined && itemValue !== null;
          if (shouldExist && !fieldExists) return false;
          if (!shouldExist && fieldExists) return false;
          continue;
        }

        // $elemMatch - Match array elements with nested conditions
        if ("$elemMatch" in qv) {
          if (!Array.isArray(itemValue)) return false;

          const elemQuery = qv["$elemMatch"] as Record<string, unknown>;
          const hasMatch = itemValue.some(elem => {
            return this.matchesQuery(elem as Record<string, unknown>, elemQuery, false);
          });

          if (!hasMatch) return false;
          continue;
        }

        // $not - Negation of query condition
        if ("$not" in qv) {
          const negatedQuery = qv["$not"] as Record<string, unknown>;
          const tempDoc = { [key]: itemValue } as Record<string, unknown>;
          const tempQuery = { [key]: negatedQuery } as Record<string, unknown>;

          if (this.matchesQuery(isUpdated ? { data: tempDoc } as Record<string, unknown> : tempDoc, tempQuery, isUpdated)) {
            return false;
          }
          continue;
        }

        // $type - Check value type
        if ("$type" in qv) {
          const expectedType = qv["$type"] as string;
          const actualType = itemValue === null ? 'null'
                          : Array.isArray(itemValue) ? 'array'
                          : typeof itemValue;

          if (actualType !== expectedType) return false;
          continue;
        }

        // $size - Check array length
        if ("$size" in qv) {
          if (!Array.isArray(itemValue)) return false;
          if (itemValue.length !== (qv["$size"] as number)) return false;
          continue;
        }

        // $all - Array must contain all specified values
        if ("$all" in qv && Array.isArray(qv["$all"])) {
          if (!Array.isArray(itemValue)) return false;

          const requiredValues = qv["$all"] as unknown[];
          const itemSet = new Set(itemValue);
          const hasAll = requiredValues.every(val => itemSet.has(val));

          if (!hasAll) return false;
          continue;
        }

        if ("$eq" in qv) {
          if (itemValue !== qv["$eq"]) return false;
          continue;
        }

        // $ne - Not equal
        if ("$ne" in qv) {
          if (itemValue === qv["$ne"]) return false;
          continue;
        }

        // $nin - Not in array (inverse of $in)
        if ("$nin" in qv && Array.isArray(qv["$nin"])) {
          const ninArray = qv["$nin"] as unknown[];
          if (ninArray.length > 10) {
            const ninSet = new Set(ninArray);
            if (ninSet.has(itemValue)) return false;
          } else {
            if (ninArray.includes(itemValue)) return false;
          }
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
