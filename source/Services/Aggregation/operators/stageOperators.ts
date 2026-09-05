import { CollectionResolver } from "../../../config/Interfaces/Operation/aggregation.interface";
import { evaluateExpression, getNestedValue } from "./expressionOperators";
import { BUILT_IN_ACCUMULATORS } from "./accumulatorOperators";
import { OperatorRegistry } from "../OperatorRegistry";
import RegexGuard from "../../../Helper/RegexGuard.helper";

function matchesCondition(itemValue: unknown, condition: unknown): boolean {
  if (condition === null || condition === undefined) {
    return itemValue === null || itemValue === undefined;
  }

  if (typeof condition === "string" || typeof condition === "number" || typeof condition === "boolean") {
    return itemValue === condition;
  }

  if (condition instanceof RegExp) return condition.test(String(itemValue));

  if (typeof condition === "object") {
    if ("$regex" in condition) {
      try {
        return RegexGuard.compileRegex(String((condition as Record<string, unknown>).$regex), ((condition as Record<string, unknown>).$options as string) || "").test(String(itemValue));
      } catch { return false; }
    }
    if ("$gte" in condition) return (itemValue as number) >= ((condition as Record<string, unknown>).$gte as number);
    if ("$gt" in condition) return (itemValue as number) > ((condition as Record<string, unknown>).$gt as number);
    if ("$lte" in condition) return (itemValue as number) <= ((condition as Record<string, unknown>).$lte as number);
    if ("$lt" in condition) return (itemValue as number) < ((condition as Record<string, unknown>).$lt as number);
    if ("$ne" in condition) return itemValue !== (condition as Record<string, unknown>).$ne;
    if ("$in" in condition) return Array.isArray((condition as Record<string, unknown>).$in) && ((condition as Record<string, unknown>).$in as unknown[]).includes(itemValue);
    if ("$nin" in condition) return Array.isArray((condition as Record<string, unknown>).$nin) && !((condition as Record<string, unknown>).$nin as unknown[]).includes(itemValue);
    if ("$exists" in condition) return (condition as Record<string, unknown>).$exists ? itemValue !== undefined : itemValue === undefined;
    if ("$not" in condition) return !matchesCondition(itemValue, (condition as Record<string, unknown>).$not);
    if ("$elemMatch" in condition) {
      return Array.isArray(itemValue) && itemValue.some(elem => matchesDocument(elem as Record<string, unknown>, (condition as Record<string, unknown>).$elemMatch as Record<string, unknown>));
    }
    if ("$all" in condition) return Array.isArray(itemValue) && ((condition as Record<string, unknown>).$all as unknown[]).every((v: unknown) => itemValue.includes(v));
    if ("$size" in condition) return Array.isArray(itemValue) && itemValue.length === (condition as Record<string, unknown>).$size;
    if ("$type" in condition) return matchesType(itemValue, (condition as Record<string, unknown>).$type as string | number);
    if ("$mod" in condition) {
      const [divisor, remainder] = (condition as Record<string, unknown>).$mod as [number, number];
      return (itemValue as number) % divisor === remainder;
    }
  }

  return false;
}

function matchesType(value: unknown, type: string | number): boolean {
  if (typeof type === "number") {
    switch (type) {
      case 1: return typeof value === "number" && !isNaN(value as number);
      case 2: return typeof value === "string";
      case 3: return typeof value === "object" && value !== null && !Array.isArray(value);
      case 4: return Array.isArray(value);
      case 8: return typeof value === "boolean";
      case 9: return value instanceof Date;
      case 10: return value === null;
      default: return false;
    }
  }
  switch (type) {
    case "number": return typeof value === "number" && !isNaN(value as number);
    case "string": return typeof value === "string";
    case "object": return typeof value === "object" && value !== null && !Array.isArray(value);
    case "array": return Array.isArray(value);
    case "bool": return typeof value === "boolean";
    case "date": return value instanceof Date;
    case "null": return value === null;
    case "undefined": return value === undefined;
    default: return false;
  }
}

function matchesDocument(item: Record<string, unknown>, query: Record<string, unknown>): boolean {
  return Object.entries(query).every(([key, value]) => {
    if (key === "$and") return Array.isArray(value) && value.every((cond: unknown) => matchesDocument(item, cond as Record<string, unknown>));
    if (key === "$or") return Array.isArray(value) && value.some((cond: unknown) => matchesDocument(item, cond as Record<string, unknown>));
    if (key === "$nor") return Array.isArray(value) && !value.some((cond: unknown) => matchesDocument(item, cond as Record<string, unknown>));
    if (key === "$not") return typeof value === "object" && !matchesDocument(item, value as Record<string, unknown>);
    return matchesCondition(getNestedValue(item, key), value);
  });
}

export function executeMatch(input: Record<string, unknown>[], matchExpr: Record<string, unknown>): Record<string, unknown>[] {
  return input.filter(item => matchesDocument(item, matchExpr));
}

export function executeGroup(input: Record<string, unknown>[], groupExpr: Record<string, unknown>): Record<string, unknown>[] {
  const groupedData: Record<string, Record<string, unknown>> = {};

  for (const item of input) {
    let groupKey: string;

    if (groupExpr._id === null || groupExpr._id === undefined) {
      groupKey = "null";
    } else if (typeof groupExpr._id === "string") {
      groupKey = String(groupExpr._id.startsWith("$") ? getNestedValue(item, groupExpr._id.substring(1)) : groupExpr._id);
    } else if (typeof groupExpr._id === "object") {
      const keyObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(groupExpr._id as Record<string, unknown>)) {
        if (typeof v === "string" && v.startsWith("$")) keyObj[k] = getNestedValue(item, v.substring(1));
        else if (typeof v === "object" && v !== null) keyObj[k] = evaluateExpression(item, v);
        else keyObj[k] = v;
      }
      groupKey = JSON.stringify(keyObj);
    } else {
      groupKey = String(groupExpr._id);
    }

    if (!groupedData[groupKey]) {
      groupedData[groupKey] = { _id: groupExpr._id === null ? null : (typeof groupExpr._id === "object" ? JSON.parse(groupKey) : groupKey) };
    }

    for (const [key, operation] of Object.entries(groupExpr) as [string, unknown][]) {
      if (key === "_id") continue;
      if (typeof operation !== "object" || operation === null) continue;

      const accOp = Object.keys(operation as Record<string, unknown>)[0];
      const accExpr = (operation as Record<string, unknown>)[accOp];
      const isBuiltIn = !!BUILT_IN_ACCUMULATORS[accOp];
      const isCustom = !isBuiltIn && OperatorRegistry.getOperator(accOp)?.type === "accumulator";

      if (isBuiltIn || isCustom) {
        if (!groupedData[groupKey][`__acc_${key}`]) groupedData[groupKey][`__acc_${key}`] = [];
        (groupedData[groupKey][`__acc_${key}`] as Record<string, unknown>[]).push(item);
        groupedData[groupKey][`__acc_expr_${key}`] = { op: accOp, expr: accExpr, custom: isCustom };
      }
    }
  }

  return Object.values(groupedData).map(group => {
    const result: Record<string, unknown> = { _id: group._id };
    for (const key of Object.keys(group)) {
      if (!key.startsWith("__acc_") || key.startsWith("__acc_expr_")) continue;
      const fieldKey = key.replace("__acc_", "");
      const accInfo = group[`__acc_expr_${fieldKey}`] as Record<string, unknown>;
      const docs = group[key] as Record<string, unknown>[];

      if (accInfo.custom) {
        const registered = OperatorRegistry.getOperator(accInfo.op as string);
        if (registered) result[fieldKey] = (registered.fn as any)(docs, accInfo.expr);
      } else {
        const accFn = BUILT_IN_ACCUMULATORS[accInfo.op as string];
        if (accFn) result[fieldKey] = accFn(docs, accInfo.expr);
      }
    }
    return result;
  });
}

export function executeSort(input: Record<string, unknown>[], sortExpr: Record<string, number>): Record<string, unknown>[] {
  const sortFields = Object.entries(sortExpr);
  return [...input].sort((a, b) => {
    for (const [field, order] of sortFields) {
      const aVal = getNestedValue(a, field) as number;
      const bVal = getNestedValue(b, field) as number;
      if (aVal < bVal) return -order;
      if (aVal > bVal) return order;
    }
    return 0;
  });
}

export function executeProject(input: Record<string, unknown>[], projectExpr: Record<string, unknown>): Record<string, unknown>[] {
  const hasInclusion = Object.values(projectExpr).some(v => v === 1 || (typeof v === "object" && v !== null));
  const hasExclusion = Object.values(projectExpr).some(v => v === 0);

  return input.map(item => {
    if (hasExclusion && !hasInclusion) {
      const result = { ...item };
      for (const [key, val] of Object.entries(projectExpr)) {
        if (val === 0) delete result[key];
      }
      return result;
    }

    const result: Record<string, unknown> = {};
    if (projectExpr._id !== 0 && item._id !== undefined) result._id = item._id;
    for (const [key, val] of Object.entries(projectExpr)) {
      if (key === "_id") continue;
      if (val === 1) result[key] = item[key];
      else if (typeof val === "object" && val !== null) result[key] = evaluateExpression(item, val);
      else if (typeof val === "string" && val.startsWith("$")) result[key] = getNestedValue(item, val.substring(1));
    }
    return result;
  });
}

export function executeLimit(input: Record<string, unknown>[], limit: number): Record<string, unknown>[] {
  return input.slice(0, limit);
}

export function executeSkip(input: Record<string, unknown>[], skip: number): Record<string, unknown>[] {
  return input.slice(skip);
}

export function executeUnwind(input: Record<string, unknown>[], unwindExpr: Record<string, unknown>): Record<string, unknown>[] {
  let fieldPath: string;
  let includeArrayIndex: string | undefined;
  let preserveNull = false;

  const unwindValue = unwindExpr as string | { path: string; includeArrayIndex?: string; preserveNullAndEmptyArrays?: boolean };
  if (typeof unwindValue === "string") {
    fieldPath = unwindValue.startsWith("$") ? unwindValue.substring(1) : unwindValue;
  } else {
    fieldPath = unwindValue.path.startsWith("$") ? unwindValue.path.substring(1) : unwindValue.path;
    includeArrayIndex = unwindValue.includeArrayIndex;
    preserveNull = unwindValue.preserveNullAndEmptyArrays || false;
  }

  const result: Record<string, unknown>[] = [];
  for (const item of input) {
    const value = getNestedValue(item, fieldPath);

    if (Array.isArray(value)) {
      if (value.length === 0 && preserveNull) {
        const doc = { ...item };
        setNestedValue(doc, fieldPath, null);
        if (includeArrayIndex) doc[includeArrayIndex] = null;
        result.push(doc);
      }
      value.forEach((val, index) => {
        const doc = { ...item };
        setNestedValue(doc, fieldPath, val);
        if (includeArrayIndex) doc[includeArrayIndex] = index;
        result.push(doc);
      });
    } else if ((value === null || value === undefined) && preserveNull) {
      const doc = { ...item };
      setNestedValue(doc, fieldPath, null);
      if (includeArrayIndex) doc[includeArrayIndex] = null;
      result.push(doc);
    } else if (value !== null && value !== undefined) {
      result.push(item);
    }
  }
  return result;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

export function executeAddFields(input: Record<string, unknown>[], addFieldsExpr: Record<string, unknown>): Record<string, unknown>[] {
  return input.map(item => {
    const result = { ...item };
    for (const [key, expr] of Object.entries(addFieldsExpr)) {
      result[key] = evaluateExpression(item, expr);
    }
    return result;
  });
}

export function executeUnset(input: Record<string, unknown>[], unsetExpr: Record<string, unknown>): Record<string, unknown>[] {
  const fields = Array.isArray(unsetExpr) ? (unsetExpr as unknown as string[]) : [unsetExpr as unknown as string];
  return input.map(item => {
    const result = { ...item };
    for (const field of fields) delete result[field];
    return result;
  });
}

export function executeCount(input: Record<string, unknown>[], countExpr: Record<string, unknown>): Record<string, unknown>[] {
  return [{ [countExpr as unknown as string]: input.length }];
}

export function executeSortByCount(input: Record<string, unknown>[], expr: unknown): Record<string, unknown>[] {
  const grouped: Record<string, number> = {};
  for (const item of input) {
    let key: unknown;
    if (typeof expr === "string" && expr.startsWith("$")) key = getNestedValue(item, expr.substring(1));
    else if (typeof expr === "object" && expr !== null) key = evaluateExpression(item, expr);
    else key = expr;
    const strKey = JSON.stringify(key);
    grouped[strKey] = (grouped[strKey] || 0) + 1;
  }
  return Object.entries(grouped)
    .map(([k, count]) => ({ _id: JSON.parse(k), count }))
    .sort((a, b) => (b.count as number) - (a.count as number));
}

export function executeSample(input: Record<string, unknown>[], sampleExpr: Record<string, unknown>): Record<string, unknown>[] {
  const size = Math.min((sampleExpr.size as number), input.length);
  const shuffled = [...input];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, size);
}

export function executeFacet(input: Record<string, unknown>[], facetExpr: Record<string, unknown>): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {};
  const pipelines = facetExpr as unknown as Record<string, Record<string, unknown>[]>;
  for (const [key, pipeline] of Object.entries(pipelines)) {
    let stageResult = [...input];
    for (const stage of pipeline) {
      const opName = Object.keys(stage)[0];
      stageResult = executeStageSync(opName, stageResult, (stage as Record<string, unknown>)[opName] as Record<string, unknown>);
    }
    result[key] = stageResult;
  }
  return result;
}

function executeStageSync(opName: string, input: Record<string, unknown>[], expr: Record<string, unknown>): Record<string, unknown>[] {
  switch (opName) {
    case "$match": return executeMatch(input, expr);
    case "$group": return executeGroup(input, expr);
    case "$sort": return executeSort(input, expr as Record<string, number>);
    case "$project": return executeProject(input, expr);
    case "$limit": return executeLimit(input, expr as unknown as number);
    case "$skip": return executeSkip(input, expr as unknown as number);
    case "$unwind": return executeUnwind(input, expr);
    case "$addFields": case "$set": return executeAddFields(input, expr);
    case "$unset": return executeUnset(input, expr);
    case "$count": return executeCount(input, expr);
    case "$sortByCount": return executeSortByCount(input, expr);
    case "$sample": return executeSample(input, expr);
    case "$replaceRoot": case "$replaceWith": return executeReplaceRoot(input, expr);
    default: return input;
  }
}

export function executeBucket(input: Record<string, unknown>[], bucketExpr: Record<string, unknown>): Record<string, unknown>[] {
  const { groupBy, boundaries, default: defaultKey = "Other", output } = bucketExpr as { groupBy: unknown; boundaries: unknown[]; default?: string; output?: Record<string, unknown> };
  const buckets: Record<string, Record<string, unknown>[]> = {};

  for (let i = 0; i < (boundaries as unknown[]).length - 1; i++) {
    buckets[JSON.stringify({ min: boundaries[i], max: boundaries[i + 1] })] = [];
  }
  buckets[JSON.stringify(defaultKey)] = [];

  for (const item of input) {
    let value: unknown;
    if (typeof groupBy === "string" && groupBy.startsWith("$")) value = getNestedValue(item, groupBy.substring(1));
    else if (typeof groupBy === "object") value = evaluateExpression(item, groupBy);
    else value = groupBy;

    let placed = false;
    for (let i = 0; i < (boundaries as unknown[]).length - 1; i++) {
      if ((value as number) >= (boundaries[i] as number) && (value as number) < (boundaries[i + 1] as number)) {
        buckets[JSON.stringify({ min: boundaries[i], max: boundaries[i + 1] })].push(item);
        placed = true;
        break;
      }
    }
    if (!placed) buckets[JSON.stringify(defaultKey)].push(item);
  }

  return Object.entries(buckets)
    .filter(([, docs]) => docs.length > 0)
    .map(([key, docs]) => {
      const parsedKey = JSON.parse(key);
      const result: Record<string, unknown> = { _id: parsedKey };
      if (output) {
        for (const [field, accExpr] of Object.entries(output)) {
          const accOp = Object.keys(accExpr as Record<string, unknown>)[0];
          const accFn = BUILT_IN_ACCUMULATORS[accOp];
          if (accFn) result[field] = accFn(docs, (accExpr as Record<string, unknown>)[accOp]);
        }
      } else {
        result.count = docs.length;
      }
      return result;
    });
}

export function executeBucketAuto(input: Record<string, unknown>[], bucketExpr: Record<string, unknown>): Record<string, unknown>[] {
  const { groupBy, buckets: numBuckets, output } = bucketExpr as { groupBy: unknown; buckets: number; output?: Record<string, unknown> };

  const itemsWithValue = input.map(item => {
    let value: unknown;
    if (typeof groupBy === "string" && groupBy.startsWith("$")) value = getNestedValue(item, groupBy.substring(1));
    else if (typeof groupBy === "object") value = evaluateExpression(item, groupBy);
    else value = groupBy;
    return { item, value };
  }).sort((a, b) => (a.value as number) < (b.value as number) ? -1 : (a.value as number) > (b.value as number) ? 1 : 0);

  const bucketSize = Math.ceil(itemsWithValue.length / numBuckets);
  const result: Record<string, unknown>[] = [];

  for (let i = 0; i < numBuckets && i * bucketSize < itemsWithValue.length; i++) {
    const bucketItems = itemsWithValue.slice(i * bucketSize, (i + 1) * bucketSize);
    const docs = bucketItems.map(b => b.item);

    const bucketResult: Record<string, unknown> = { _id: { min: bucketItems[0].value, max: bucketItems[bucketItems.length - 1].value } };
    if (output) {
      for (const [field, accExpr] of Object.entries(output)) {
        const accOp = Object.keys(accExpr as Record<string, unknown>)[0];
        const accFn = BUILT_IN_ACCUMULATORS[accOp];
        if (accFn) bucketResult[field] = accFn(docs, (accExpr as Record<string, unknown>)[accOp]);
      }
    } else {
      bucketResult.count = docs.length;
    }
    result.push(bucketResult);
  }

  return result;
}

export function executeReplaceRoot(input: Record<string, unknown>[], expr: Record<string, unknown>): Record<string, unknown>[] {
  return input.map(item => {
    if (typeof expr.newRoot === "string" && expr.newRoot.startsWith("$")) {
      return (getNestedValue(item, expr.newRoot.substring(1)) || {}) as Record<string, unknown>;
    }
    return evaluateExpression(item, expr.newRoot) as Record<string, unknown>;
  });
}

export async function executeLookup(input: Record<string, unknown>[], lookupExpr: Record<string, unknown>, resolver?: CollectionResolver): Promise<Record<string, unknown>[]> {
  if (!resolver) {
    throw new Error("$lookup requires a collection resolver. Ensure the collection was created via Database.createCollection().");
  }

  const { from, localField, foreignField, as, let: letExpr, pipeline: lookupPipeline } = lookupExpr;

  if (!from) throw new Error("$lookup requires a 'from' field specifying the foreign collection name.");
  if (!as) throw new Error("$lookup requires an 'as' field specifying the output array field name.");

  let foreignData: Record<string, unknown>[];

  if (lookupPipeline) {
    const queryHint = extractMatchFromPipeline(lookupPipeline as Record<string, unknown>[]);
    try {
      foreignData = await resolver(from as string, queryHint);
    } catch (error) {
      throw new Error(`$lookup failed to load collection "${from}": ${error instanceof Error ? error.message : String(error)}`);
    }

    return input.map(doc => {
      const boundVars: Record<string, unknown> = {};
      if (letExpr) {
        for (const [varName, varExpr] of Object.entries(letExpr as Record<string, unknown>)) {
          boundVars[`$$${varName}`] = typeof varExpr === "string" && varExpr.startsWith("$")
            ? getNestedValue(doc, varExpr.substring(1))
            : evaluateExpression(doc, varExpr);
        }
      }

      let matched = [...foreignData];
      for (const stage of lookupPipeline as Record<string, unknown>[]) {
        const opName = Object.keys(stage)[0];
        matched = executeStageSync(opName, matched, resolveVariables((stage as Record<string, unknown>)[opName], boundVars) as Record<string, unknown>);
      }

      return { ...doc, [as as string]: matched };
    });
  }

  if (localField && foreignField) {
    const distinctValues = [...new Set(input.map(doc => getNestedValue(doc, localField as string)).filter(v => v !== undefined))];
    const queryHint = distinctValues.length > 0 ? { [foreignField as string]: { $in: distinctValues } } : undefined;

    try {
      foreignData = await resolver(from as string, queryHint);
    } catch (error) {
      throw new Error(`$lookup failed to load collection "${from}": ${error instanceof Error ? error.message : String(error)}`);
    }

    return input.map(doc => {
      const localValue = getNestedValue(doc, localField as string);
      return { ...doc, [as as string]: foreignData.filter(foreignDoc => getNestedValue(foreignDoc, foreignField as string) === localValue) };
    });
  }

  throw new Error("$lookup requires either (localField + foreignField) or (pipeline) for join conditions.");
}

export function extractMatchFromPipeline(pipeline: Record<string, unknown>[]): Record<string, unknown> | undefined {
  for (const stage of pipeline) {
    if (stage && typeof stage === "object" && stage.$match) {
      return stage.$match as Record<string, unknown>;
    }
  }
  return undefined;
}

function resolveVariables(expr: unknown, vars: Record<string, unknown>): unknown {
  if (typeof expr === "string") {
    if (expr.startsWith("$$") && vars[expr] !== undefined) return vars[expr];
    return expr;
  }
  if (Array.isArray(expr)) return expr.map(item => resolveVariables(item, vars));
  if (typeof expr === "object" && expr !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(expr as Record<string, unknown>)) result[key] = resolveVariables(value, vars);
    return result;
  }
  return expr;
}

export function executeMergeObjects(input: Record<string, unknown>[]): Record<string, unknown>[] {
  if (input.length === 0) return [];
  return [input.reduce((merged, doc) => ({ ...merged, ...doc }), {})];
}

export const BUILT_IN_STAGE_OPERATORS: Record<string, (input: Record<string, unknown>[], expr: Record<string, unknown>) => Record<string, unknown>[]> = {
  $match: executeMatch,
  $group: executeGroup,
  $sort: executeSort as (input: Record<string, unknown>[], expr: Record<string, unknown>) => Record<string, unknown>[],
  $project: executeProject,
  $limit: executeLimit as unknown as (input: Record<string, unknown>[], expr: Record<string, unknown>) => Record<string, unknown>[],
  $skip: executeSkip as unknown as (input: Record<string, unknown>[], expr: Record<string, unknown>) => Record<string, unknown>[],
  $unwind: executeUnwind,
  $addFields: executeAddFields,
  $set: executeAddFields,
  $unset: executeUnset,
  $count: executeCount,
  $sortByCount: executeSortByCount as (input: Record<string, unknown>[], expr: Record<string, unknown>) => Record<string, unknown>[],
  $sample: executeSample,
  $replaceRoot: executeReplaceRoot,
  $replaceWith: executeReplaceRoot,
};
