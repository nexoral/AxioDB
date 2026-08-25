/* eslint-disable @typescript-eslint/no-explicit-any */

export type CollectionResolver = (collectionName: string, query?: Record<string, any>) => Promise<any[]>;

export type StageOperatorFn = (input: any[], stageExpr: any, resolver?: CollectionResolver) => any[] | Promise<any[]>;

export type AccumulatorFn = (collection: any[], expr: any) => any;

export type ExpressionFn = (doc: any, expr: any) => any;

export interface RegisteredOperator {
  type: "stage" | "accumulator" | "expression";
  name: string;
  fn: StageOperatorFn | AccumulatorFn | ExpressionFn;
}
