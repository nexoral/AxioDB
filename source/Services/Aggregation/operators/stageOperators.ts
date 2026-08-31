import { CollectionResolver } from "../../../config/Interfaces/Operation/aggregation.interface";
import { evaluateExpression, getNestedValue } from "./expressionOperators";
import { BUILT_IN_ACCUMULATORS } from "./accumulatorOperators";
import { OperatorRegistry } from "../OperatorRegistry";

function matchesCondition(itemValue: any, condition: any): boolean {
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
        return new RegExp(String(condition.$regex), condition.$options || "").test(String(itemValue));
      } catch { return false; }
    }
    if ("$gte" in condition) return itemValue >= condition.$gte;
    if ("$gt" in condition) return itemValue > condition.$gt;
    if ("$lte" in condition) return itemValue <= condition.$lte;
    if ("$lt" in condition) return itemValue < condition.$lt;
    if ("$ne" in condition) return itemValue !== condition.$ne;
    if ("$in" in condition) return Array.isArray(condition.$in) && condition.$in.includes(itemValue);
    if ("$nin" in condition) return Array.isArray(condition.$nin) && !condition.$nin.includes(itemValue);
    if ("$exists" in condition) return condition.$exists ? itemValue !== undefined : itemValue === undefined;
    if ("$not" in condition) return !matchesCondition(itemValue, condition.$not);
    if ("$elemMatch" in condition) {
      return Array.isArray(itemValue) && itemValue.some(elem => matchesDocument(elem, condition.$elemMatch));
    }
    if ("$all" in condition) return Array.isArray(itemValue) && condition.$all.every((v: any) => itemValue.includes(v));
    if ("$size" in condition) return Array.isArray(itemValue) && itemValue.length === condition.$size;
    if ("$type" in condition) return matchesType(itemValue, condition.$type);
    if ("$mod" in condition) {
      const [divisor, remainder] = condition.$mod;
      return itemValue % divisor === remainder;
    }
  }

  return false;
}

function matchesType(value: any, type: string | number): boolean {
  if (typeof type === "number") {
    switch (type) {
      case 1: return typeof value === "number" && !isNaN(value);
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
    case "number": return typeof value === "number" && !isNaN(value);
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

function matchesDocument(item: any, query: any): boolean {
  return Object.entries(query).every(([key, value]) => {
    if (key === "$and") return Array.isArray(value) && value.every((cond: any) => matchesDocument(item, cond));
    if (key === "$or") return Array.isArray(value) && value.some((cond: any) => matchesDocument(item, cond));
    if (key === "$nor") return Array.isArray(value) && !value.some((cond: any) => matchesDocument(item, cond));
    if (key === "$not") return typeof value === "object" && !matchesDocument(item, value);
    return matchesCondition(getNestedValue(item, key), value);
  });
}

export function executeMatch(input: any[], matchExpr: any): any[] {
  return input.filter(item => matchesDocument(item, matchExpr));
}

export function executeGroup(input: any[], groupExpr: any): any[] {
  const groupedData: Record<string, any> = {};

  for (const item of input) {
    let groupKey: string;

    if (groupExpr._id === null || groupExpr._id === undefined) {
      groupKey = "null";
    } else if (typeof groupExpr._id === "string") {
      groupKey = String(groupExpr._id.startsWith("$") ? getNestedValue(item, groupExpr._id.substring(1)) : groupExpr._id);
    } else if (typeof groupExpr._id === "object") {
      const keyObj: Record<string, any> = {};
      for (const [k, v] of Object.entries(groupExpr._id)) {
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

    for (const [key, operation] of Object.entries(groupExpr) as [string, any][]) {
      if (key === "_id") continue;
      if (typeof operation !== "object" || operation === null) continue;

      const accOp = Object.keys(operation)[0];
      const accExpr = operation[accOp];
      const isBuiltIn = !!BUILT_IN_ACCUMULATORS[accOp];
      const isCustom = !isBuiltIn && OperatorRegistry.getOperator(accOp)?.type === "accumulator";

      if (isBuiltIn || isCustom) {
        if (!groupedData[groupKey][`__acc_${key}`]) groupedData[groupKey][`__acc_${key}`] = [];
        groupedData[groupKey][`__acc_${key}`].push(item);
        groupedData[groupKey][`__acc_expr_${key}`] = { op: accOp, expr: accExpr, custom: isCustom };
      }
    }
  }

  return Object.values(groupedData).map(group => {
    const result: any = { _id: group._id };
    for (const key of Object.keys(group)) {
      if (!key.startsWith("__acc_") || key.startsWith("__acc_expr_")) continue;
      const fieldKey = key.replace("__acc_", "");
      const accInfo = group[`__acc_expr_${fieldKey}`];
      const docs = group[key];

      if (accInfo.custom) {
        const registered = OperatorRegistry.getOperator(accInfo.op);
        if (registered) result[fieldKey] = (registered.fn as any)(docs, accInfo.expr);
      } else {
        const accFn = BUILT_IN_ACCUMULATORS[accInfo.op];
        if (accFn) result[fieldKey] = accFn(docs, accInfo.expr);
      }
    }
    return result;
  });
}

export function executeSort(input: any[], sortExpr: Record<string, 1 | -1>): any[] {
  const sortFields = Object.entries(sortExpr);
  return [...input].sort((a, b) => {
    for (const [field, order] of sortFields) {
      const aVal = getNestedValue(a, field);
      const bVal = getNestedValue(b, field);
      if (aVal < bVal) return -order;
      if (aVal > bVal) return order;
    }
    return 0;
  });
}

export function executeProject(input: any[], projectExpr: Record<string, any>): any[] {
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

    const result: Record<string, any> = {};
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

export function executeLimit(input: any[], limit: number): any[] {
  return input.slice(0, limit);
}

export function executeSkip(input: any[], skip: number): any[] {
  return input.slice(skip);
}

export function executeUnwind(input: any[], unwindExpr: string | { path: string; includeArrayIndex?: string; preserveNullAndEmptyArrays?: boolean }): any[] {
  let fieldPath: string;
  let includeArrayIndex: string | undefined;
  let preserveNull = false;

  if (typeof unwindExpr === "string") {
    fieldPath = unwindExpr.startsWith("$") ? unwindExpr.substring(1) : unwindExpr;
  } else {
    fieldPath = unwindExpr.path.startsWith("$") ? unwindExpr.path.substring(1) : unwindExpr.path;
    includeArrayIndex = unwindExpr.includeArrayIndex;
    preserveNull = unwindExpr.preserveNullAndEmptyArrays || false;
  }

  const result: any[] = [];
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

function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

export function executeAddFields(input: any[], addFieldsExpr: Record<string, any>): any[] {
  return input.map(item => {
    const result = { ...item };
    for (const [key, expr] of Object.entries(addFieldsExpr)) {
      result[key] = evaluateExpression(item, expr);
    }
    return result;
  });
}

export function executeUnset(input: any[], unsetExpr: string | string[]): any[] {
  const fields = Array.isArray(unsetExpr) ? unsetExpr : [unsetExpr];
  return input.map(item => {
    const result = { ...item };
    for (const field of fields) delete result[field];
    return result;
  });
}

export function executeCount(input: any[], countExpr: string): any[] {
  return [{ [countExpr]: input.length }];
}

export function executeSortByCount(input: any[], expr: any): any[] {
  const grouped: Record<string, number> = {};
  for (const item of input) {
    let key: any;
    if (typeof expr === "string" && expr.startsWith("$")) key = getNestedValue(item, expr.substring(1));
    else if (typeof expr === "object" && expr !== null) key = evaluateExpression(item, expr);
    else key = expr;
    const strKey = JSON.stringify(key);
    grouped[strKey] = (grouped[strKey] || 0) + 1;
  }
  return Object.entries(grouped)
    .map(([k, count]) => ({ _id: JSON.parse(k), count }))
    .sort((a, b) => b.count - a.count);
}

export function executeSample(input: any[], sampleExpr: { size: number }): any[] {
  const size = Math.min(sampleExpr.size, input.length);
  const shuffled = [...input];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, size);
}

export function executeFacet(input: any[], facetExpr: Record<string, any[]>): Record<string, any[]> {
  const result: Record<string, any[]> = {};
  for (const [key, pipeline] of Object.entries(facetExpr)) {
    let stageResult = [...input];
    for (const stage of pipeline) {
      const opName = Object.keys(stage)[0];
      stageResult = executeStageSync(opName, stageResult, (stage as any)[opName]);
    }
    result[key] = stageResult;
  }
  return result;
}

function executeStageSync(opName: string, input: any[], expr: any): any[] {
  switch (opName) {
    case "$match": return executeMatch(input, expr);
    case "$group": return executeGroup(input, expr);
    case "$sort": return executeSort(input, expr);
    case "$project": return executeProject(input, expr);
    case "$limit": return executeLimit(input, expr);
    case "$skip": return executeSkip(input, expr);
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

export function executeBucket(input: any[], bucketExpr: { groupBy: any; boundaries: any[]; default?: string; output?: Record<string, any> }): any[] {
  const { groupBy, boundaries, default: defaultKey = "Other", output } = bucketExpr;
  const buckets: Record<string, any[]> = {};

  for (let i = 0; i < boundaries.length - 1; i++) {
    buckets[JSON.stringify({ min: boundaries[i], max: boundaries[i + 1] })] = [];
  }
  buckets[JSON.stringify(defaultKey)] = [];

  for (const item of input) {
    let value: any;
    if (typeof groupBy === "string" && groupBy.startsWith("$")) value = getNestedValue(item, groupBy.substring(1));
    else if (typeof groupBy === "object") value = evaluateExpression(item, groupBy);
    else value = groupBy;

    let placed = false;
    for (let i = 0; i < boundaries.length - 1; i++) {
      if (value >= boundaries[i] && value < boundaries[i + 1]) {
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
      const result: any = { _id: parsedKey };
      if (output) {
        for (const [field, accExpr] of Object.entries(output)) {
          const accOp = Object.keys(accExpr)[0];
          const accFn = BUILT_IN_ACCUMULATORS[accOp];
          if (accFn) result[field] = accFn(docs, (accExpr as any)[accOp]);
        }
      } else {
        result.count = docs.length;
      }
      return result;
    });
}

export function executeBucketAuto(input: any[], bucketExpr: { groupBy: any; buckets: number; output?: Record<string, any> }): any[] {
  const { groupBy, buckets: numBuckets, output } = bucketExpr;

  const itemsWithValue = input.map(item => {
    let value: any;
    if (typeof groupBy === "string" && groupBy.startsWith("$")) value = getNestedValue(item, groupBy.substring(1));
    else if (typeof groupBy === "object") value = evaluateExpression(item, groupBy);
    else value = groupBy;
    return { item, value };
  }).sort((a, b) => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0));

  const bucketSize = Math.ceil(itemsWithValue.length / numBuckets);
  const result: any[] = [];

  for (let i = 0; i < numBuckets && i * bucketSize < itemsWithValue.length; i++) {
    const bucketItems = itemsWithValue.slice(i * bucketSize, (i + 1) * bucketSize);
    const docs = bucketItems.map(b => b.item);

    const bucketResult: any = { _id: { min: bucketItems[0].value, max: bucketItems[bucketItems.length - 1].value } };
    if (output) {
      for (const [field, accExpr] of Object.entries(output)) {
        const accOp = Object.keys(accExpr)[0];
        const accFn = BUILT_IN_ACCUMULATORS[accOp];
        if (accFn) bucketResult[field] = accFn(docs, (accExpr as any)[accOp]);
      }
    } else {
      bucketResult.count = docs.length;
    }
    result.push(bucketResult);
  }

  return result;
}

export function executeReplaceRoot(input: any[], expr: { newRoot: any }): any[] {
  return input.map(item => {
    if (typeof expr.newRoot === "string" && expr.newRoot.startsWith("$")) {
      return getNestedValue(item, expr.newRoot.substring(1)) || {};
    }
    return evaluateExpression(item, expr.newRoot);
  });
}

export async function executeLookup(input: any[], lookupExpr: any, resolver?: CollectionResolver): Promise<any[]> {
  if (!resolver) {
    throw new Error("$lookup requires a collection resolver. Ensure the collection was created via Database.createCollection().");
  }

  const { from, localField, foreignField, as, let: letExpr, pipeline: lookupPipeline } = lookupExpr;

  if (!from) throw new Error("$lookup requires a 'from' field specifying the foreign collection name.");
  if (!as) throw new Error("$lookup requires an 'as' field specifying the output array field name.");

  let foreignData: any[];

  if (lookupPipeline) {
    // Pipeline $lookup: extract $match from pipeline as index hint
    const queryHint = extractMatchFromPipeline(lookupPipeline);
    try {
      foreignData = await resolver(from, queryHint);
    } catch (error) {
      throw new Error(`$lookup failed to load collection "${from}": ${error instanceof Error ? error.message : String(error)}`);
    }

    return input.map(doc => {
      const boundVars: Record<string, any> = {};
      if (letExpr) {
        for (const [varName, varExpr] of Object.entries(letExpr)) {
          boundVars[`$$${varName}`] = typeof varExpr === "string" && varExpr.startsWith("$")
            ? getNestedValue(doc, varExpr.substring(1))
            : evaluateExpression(doc, varExpr);
        }
      }

      let matched = [...foreignData];
      for (const stage of lookupPipeline) {
        const opName = Object.keys(stage)[0];
        matched = executeStageSync(opName, matched, resolveVariables((stage as any)[opName], boundVars));
      }

      return { ...doc, [as]: matched };
    });
  }

  if (localField && foreignField) {
    // Equality $lookup: collect distinct values, use $in as index hint
    const distinctValues = [...new Set(input.map(doc => getNestedValue(doc, localField)).filter(v => v !== undefined))];
    const queryHint = distinctValues.length > 0 ? { [foreignField]: { $in: distinctValues } } : undefined;

    try {
      foreignData = await resolver(from, queryHint);
    } catch (error) {
      throw new Error(`$lookup failed to load collection "${from}": ${error instanceof Error ? error.message : String(error)}`);
    }

    return input.map(doc => {
      const localValue = getNestedValue(doc, localField);
      return { ...doc, [as]: foreignData.filter(foreignDoc => getNestedValue(foreignDoc, foreignField) === localValue) };
    });
  }

  throw new Error("$lookup requires either (localField + foreignField) or (pipeline) for join conditions.");
}

export function extractMatchFromPipeline(pipeline: any[]): Record<string, any> | undefined {
  for (const stage of pipeline) {
    if (stage && typeof stage === "object" && stage.$match) {
      return stage.$match;
    }
  }
  return undefined;
}

function resolveVariables(expr: any, vars: Record<string, any>): any {
  if (typeof expr === "string") {
    if (expr.startsWith("$$") && vars[expr] !== undefined) return vars[expr];
    return expr;
  }
  if (Array.isArray(expr)) return expr.map(item => resolveVariables(item, vars));
  if (typeof expr === "object" && expr !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(expr)) result[key] = resolveVariables(value, vars);
    return result;
  }
  return expr;
}

export function executeMergeObjects(input: any[]): any[] {
  if (input.length === 0) return [];
  return input.reduce((merged, doc) => ({ ...merged, ...doc }), {});
}

export const BUILT_IN_STAGE_OPERATORS: Record<string, (input: any[], expr: any) => any[]> = {
  $match: executeMatch,
  $group: executeGroup,
  $sort: executeSort,
  $project: executeProject,
  $limit: executeLimit,
  $skip: executeSkip,
  $unwind: executeUnwind,
  $addFields: executeAddFields,
  $set: executeAddFields,
  $unset: executeUnset,
  $count: executeCount,
  $sortByCount: executeSortByCount,
  $sample: executeSample,
  $replaceRoot: executeReplaceRoot,
  $replaceWith: executeReplaceRoot,
};
