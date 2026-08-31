import { evaluateExpression } from "./expressionOperators";

function resolveOperand(doc: Record<string, unknown>, operand: unknown): unknown {
  if (typeof operand === "string" && operand.startsWith("$")) {
    return doc[operand.substring(1)];
  }
  if (typeof operand === "object" && operand !== null) {
    return evaluateExpression(doc, operand);
  }
  return operand;
}

export function accumulatorSum(groupDocs: Record<string, unknown>[], expr: unknown): number {
  if (typeof expr === "number") return groupDocs.length * expr;
  return groupDocs.reduce((sum, doc) => {
    const val = resolveOperand(doc, expr);
    return sum + (typeof val === "number" ? val : 0);
  }, 0);
}

export function accumulatorAvg(groupDocs: Record<string, unknown>[], expr: unknown): number | null {
  if (groupDocs.length === 0) return null;
  let sum = 0;
  let count = 0;
  for (const doc of groupDocs) {
    const val = resolveOperand(doc, expr);
    if (typeof val === "number" && !isNaN(val)) {
      sum += val;
      count++;
    }
  }
  return count > 0 ? sum / count : null;
}

export function accumulatorMin(groupDocs: Record<string, unknown>[], expr: unknown): unknown {
  if (groupDocs.length === 0) return null;
  let min: unknown = undefined;
  for (const doc of groupDocs) {
    const val = resolveOperand(doc, expr);
    if (val !== null && val !== undefined && (min === undefined || (val as number) < (min as number))) {
      min = val;
    }
  }
  return min !== undefined ? min : null;
}

export function accumulatorMax(groupDocs: Record<string, unknown>[], expr: unknown): unknown {
  if (groupDocs.length === 0) return null;
  let max: unknown = undefined;
  for (const doc of groupDocs) {
    const val = resolveOperand(doc, expr);
    if (val !== null && val !== undefined && (max === undefined || (val as number) > (max as number))) {
      max = val;
    }
  }
  return max !== undefined ? max : null;
}

export function accumulatorFirst(groupDocs: Record<string, unknown>[], expr: unknown): unknown {
  if (groupDocs.length === 0) return null;
  return resolveOperand(groupDocs[0], expr);
}

export function accumulatorLast(groupDocs: Record<string, unknown>[], expr: unknown): unknown {
  if (groupDocs.length === 0) return null;
  return resolveOperand(groupDocs[groupDocs.length - 1], expr);
}

export function accumulatorPush(groupDocs: Record<string, unknown>[], expr: unknown): unknown[] {
  return groupDocs.map(doc => resolveOperand(doc, expr));
}

export function accumulatorAddToSet(groupDocs: Record<string, unknown>[], expr: unknown): unknown[] {
  const seen = new Set<string>();
  const result: unknown[] = [];
  for (const doc of groupDocs) {
    const val = resolveOperand(doc, expr);
    const key = JSON.stringify(val);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(val);
    }
  }
  return result;
}

export function accumulatorStdDevPop(groupDocs: Record<string, unknown>[], expr: unknown): number | null {
  if (groupDocs.length === 0) return null;
  const values = groupDocs
    .map(doc => resolveOperand(doc, expr))
    .filter((v): v is number => typeof v === "number" && !isNaN(v));
  if (values.length === 0) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function accumulatorStdDevSamp(groupDocs: Record<string, unknown>[], expr: unknown): number | null {
  if (groupDocs.length <= 1) return null;
  const values = groupDocs
    .map(doc => resolveOperand(doc, expr))
    .filter((v): v is number => typeof v === "number" && !isNaN(v));
  if (values.length <= 1) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function accumulatorCount(groupDocs: Record<string, unknown>[]): number {
  return groupDocs.length;
}

export const BUILT_IN_ACCUMULATORS: Record<string, (groupDocs: Record<string, unknown>[], expr: unknown) => unknown> = {
  $sum: accumulatorSum,
  $avg: accumulatorAvg,
  $min: accumulatorMin,
  $max: accumulatorMax,
  $first: accumulatorFirst,
  $last: accumulatorLast,
  $push: accumulatorPush,
  $addToSet: accumulatorAddToSet,
  $stdDevPop: accumulatorStdDevPop,
  $stdDevSamp: accumulatorStdDevSamp,
  $count: accumulatorCount,
};
