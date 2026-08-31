import { evaluateExpression } from "./expressionOperators";

function resolveOperand(doc: any, operand: any): any {
  if (typeof operand === "string" && operand.startsWith("$")) {
    return doc[operand.substring(1)];
  }
  if (typeof operand === "object" && operand !== null) {
    return evaluateExpression(doc, operand);
  }
  return operand;
}

export function accumulatorSum(groupDocs: any[], expr: any): number {
  if (typeof expr === "number") return groupDocs.length * expr;
  return groupDocs.reduce((sum, doc) => {
    const val = resolveOperand(doc, expr);
    return sum + (typeof val === "number" ? val : 0);
  }, 0);
}

export function accumulatorAvg(groupDocs: any[], expr: any): number | null {
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

export function accumulatorMin(groupDocs: any[], expr: any): any {
  if (groupDocs.length === 0) return null;
  let min: any = undefined;
  for (const doc of groupDocs) {
    const val = resolveOperand(doc, expr);
    if (val !== null && val !== undefined && (min === undefined || val < min)) {
      min = val;
    }
  }
  return min !== undefined ? min : null;
}

export function accumulatorMax(groupDocs: any[], expr: any): any {
  if (groupDocs.length === 0) return null;
  let max: any = undefined;
  for (const doc of groupDocs) {
    const val = resolveOperand(doc, expr);
    if (val !== null && val !== undefined && (max === undefined || val > max)) {
      max = val;
    }
  }
  return max !== undefined ? max : null;
}

export function accumulatorFirst(groupDocs: any[], expr: any): any {
  if (groupDocs.length === 0) return null;
  return resolveOperand(groupDocs[0], expr);
}

export function accumulatorLast(groupDocs: any[], expr: any): any {
  if (groupDocs.length === 0) return null;
  return resolveOperand(groupDocs[groupDocs.length - 1], expr);
}

export function accumulatorPush(groupDocs: any[], expr: any): any[] {
  return groupDocs.map(doc => resolveOperand(doc, expr));
}

export function accumulatorAddToSet(groupDocs: any[], expr: any): any[] {
  const seen = new Set<any>();
  const result: any[] = [];
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

export function accumulatorStdDevPop(groupDocs: any[], expr: any): number | null {
  if (groupDocs.length === 0) return null;
  const values = groupDocs
    .map(doc => resolveOperand(doc, expr))
    .filter(v => typeof v === "number" && !isNaN(v));
  if (values.length === 0) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function accumulatorStdDevSamp(groupDocs: any[], expr: any): number | null {
  if (groupDocs.length <= 1) return null;
  const values = groupDocs
    .map(doc => resolveOperand(doc, expr))
    .filter(v => typeof v === "number" && !isNaN(v));
  if (values.length <= 1) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function accumulatorCount(groupDocs: any[]): number {
  return groupDocs.length;
}

export const BUILT_IN_ACCUMULATORS: Record<string, (groupDocs: any[], expr: any) => any> = {
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
