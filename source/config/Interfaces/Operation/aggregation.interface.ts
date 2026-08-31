
export type CollectionResolver = (collectionName: string, query?: Record<string, unknown>) => Promise<Record<string, unknown>[]>;

export type StageOperatorFn = (input: Record<string, unknown>[], stageExpr: Record<string, unknown>, resolver?: CollectionResolver) => Record<string, unknown>[] | Promise<Record<string, unknown>[]>;

export type AccumulatorFn = (collection: Record<string, unknown>[], expr: unknown) => unknown;

export type ExpressionFn = (doc: Record<string, unknown>, expr: unknown) => unknown;

export interface RegisteredOperator {
  type: "stage" | "accumulator" | "expression";
  name: string;
  fn: StageOperatorFn | AccumulatorFn | ExpressionFn;
}
