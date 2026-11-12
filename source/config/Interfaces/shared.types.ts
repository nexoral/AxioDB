/**
 * Common type aliases used across the AxioDB codebase.
 * Import from here instead of using `any` for document data.
 */

/** A generic document object. All document storage, queries, and results use this shape. */
export type Document = Record<string, unknown>;

/** An advanced query filter value. */
export type QueryValue = string | number | boolean | RegExp | QueryOperator | QueryValue[];

/** Operator expressions inside a query filter (e.g. { $gt: 5 }). */
export interface QueryOperator {
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $ne?: unknown;
  $eq?: unknown;
  $in?: unknown[];
  $nin?: unknown[];
  $regex?: string | RegExp;
  $options?: string;
  $exists?: boolean;
  $elemMatch?: Record<string, QueryValue>;
  $not?: Record<string, QueryValue>;
  $type?: string;
  $size?: number;
  $all?: unknown[];
}

/** A MongoDB-style sort specification. */
export type SortSpec = Record<string, 1 | -1>;

/** A MongoDB-style projection specification. */
export type ProjectionSpec = Record<string, 0 | 1>;

/** A document with its associated filename (used in CRUD operations). */
export interface DocumentWithFileName {
  fileName: string;
  data: Document;
}

/** Metric used for vector similarity calculations. */
export type VectorMetric = "cosine" | "dot" | "euclidean";

/** Configuration options for vector search queries. */
export interface VectorSearchOptions {
  topK?: number;
  minScore?: number;
  metric?: VectorMetric;
}

/** Internal vector search configuration. */
export interface VectorSearchConfig {
  field: string;
  vector: number[];
  options: VectorSearchOptions;
}
