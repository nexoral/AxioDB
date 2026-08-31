
export function getNestedValue(obj: any, path: string): any {
  if (!path || !obj) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

export function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

export function evaluateExpression(doc: any, expr: any): any {
  if (typeof expr === "string") {
    if (expr === "$$ROOT") return doc;
    if (expr.startsWith("$$")) return undefined;
    if (expr.startsWith("$")) return getNestedValue(doc, expr.substring(1));
    return expr;
  }

  if (expr === null || expr === undefined || typeof expr !== "object") return expr;
  if (Array.isArray(expr)) return expr.map(item => evaluateExpression(doc, item));

  const keys = Object.keys(expr);
  if (keys.length === 0) return {};

  const op = keys[0];

  switch (op) {
    case "$add": return evaluateArithmetic(doc, expr.$add, (a, b) => a + b);
    case "$subtract": return evaluateArithmetic(doc, expr.$subtract, (a, b) => a - b);
    case "$multiply": return evaluateArithmetic(doc, expr.$multiply, (a, b) => a * b);
    case "$divide": return evaluateArithmetic(doc, expr.$divide, (a, b) => a / b);
    case "$mod": return evaluateArithmetic(doc, expr.$mod, (a, b) => a % b);
    case "$abs": return Math.abs(evaluateExpression(doc, expr.$abs));
    case "$ceil": return Math.ceil(evaluateExpression(doc, expr.$ceil));
    case "$floor": return Math.floor(evaluateExpression(doc, expr.$floor));
    case "$sqrt": return Math.sqrt(evaluateExpression(doc, expr.$sqrt));
    case "$pow": {
      const [base, exp] = expr.$pow.map((e: any) => evaluateExpression(doc, e));
      return Math.pow(base, exp);
    }
    case "$log": return Math.log(evaluateExpression(doc, expr.$log));
    case "$log10": return Math.log10(evaluateExpression(doc, expr.$log10));
    case "$exp": return Math.exp(evaluateExpression(doc, expr.$exp));
    case "$trunc": return Math.trunc(evaluateExpression(doc, expr.$trunc));
    case "$round": {
      const roundArgs = expr.$round;
      if (Array.isArray(roundArgs)) {
        const val = evaluateExpression(doc, roundArgs[0]);
        const place = evaluateExpression(doc, roundArgs[1]) || 0;
        const factor = Math.pow(10, place);
        return Math.round(val * factor) / factor;
      }
      return Math.round(evaluateExpression(doc, roundArgs));
    }

    case "$concat":
      return (expr.$concat as any[]).map(e => {
        const v = evaluateExpression(doc, e);
        return v === null || v === undefined ? "" : String(v);
      }).join("");
    case "$substr": {
      const [str, start, len] = expr.$substr.map((e: any) => evaluateExpression(doc, e));
      return String(str).substr(start, len);
    }
    case "$substrBytes": {
      const [str, start, len] = expr.$substrBytes.map((e: any) => evaluateExpression(doc, e));
      return String(str).substr(start, len);
    }
    case "$strLen": return String(evaluateExpression(doc, expr.$strLen)).length;
    case "$strLenBytes": return Buffer.byteLength(String(evaluateExpression(doc, expr.$strLenBytes)));
    case "$toLower": return String(evaluateExpression(doc, expr.$toLower)).toLowerCase();
    case "$toUpper": return String(evaluateExpression(doc, expr.$toUpper)).toUpperCase();
    case "$trim": {
      const trimInput = expr.$trim;
      if (typeof trimInput === "object" && trimInput.input) {
        const str = String(evaluateExpression(doc, trimInput.input));
        const chars = trimInput.chars ? evaluateExpression(doc, trimInput.chars) : undefined;
        if (chars) {
          const regex = new RegExp(`^[${escapeRegex(chars)}]+|[${escapeRegex(chars)}]+$`, "g");
          return str.replace(regex, "");
        }
        return str.trim();
      }
      return String(evaluateExpression(doc, trimInput)).trim();
    }
    case "$ltrim": {
      const ltrimInput = expr.$ltrim;
      if (typeof ltrimInput === "object" && ltrimInput.input) {
        const str = String(evaluateExpression(doc, ltrimInput.input));
        const chars = ltrimInput.chars ? evaluateExpression(doc, ltrimInput.chars) : undefined;
        if (chars) return str.replace(new RegExp(`^[${escapeRegex(chars)}]+`, "g"), "");
        return str.trimStart();
      }
      return String(evaluateExpression(doc, ltrimInput)).trimStart();
    }
    case "$rtrim": {
      const rtrimInput = expr.$rtrim;
      if (typeof rtrimInput === "object" && rtrimInput.input) {
        const str = String(evaluateExpression(doc, rtrimInput.input));
        const chars = rtrimInput.chars ? evaluateExpression(doc, rtrimInput.chars) : undefined;
        if (chars) return str.replace(new RegExp(`[${escapeRegex(chars)}]+$`, "g"), "");
        return str.trimEnd();
      }
      return String(evaluateExpression(doc, rtrimInput)).trimEnd();
    }
    case "$indexOfBytes": {
      const args = expr.$indexOfBytes;
      const str = String(evaluateExpression(doc, args[0]));
      const search = String(evaluateExpression(doc, args[1]));
      const start = args[2] ? evaluateExpression(doc, args[2]) : 0;
      const end = args[3] ? evaluateExpression(doc, args[3]) : str.length;
      return str.substring(start, end).indexOf(search) + (start > 0 ? start : 0);
    }
    case "$split": {
      const [str, delim] = expr.$split.map((e: any) => evaluateExpression(doc, e));
      return String(str).split(String(delim));
    }
    case "$replaceOne": {
      const input = expr.$replaceOne;
      const str = String(evaluateExpression(doc, input.input));
      const find = String(evaluateExpression(doc, input.find));
      const replacement = String(evaluateExpression(doc, input.replacement));
      return str.replace(find, replacement);
    }
    case "$replaceAll": {
      const input = expr.$replaceAll;
      const str = String(evaluateExpression(doc, input.input));
      const find = String(evaluateExpression(doc, input.find));
      const replacement = String(evaluateExpression(doc, input.replacement));
      return str.split(find).join(replacement);
    }
    case "$regexMatch": {
      const input = expr.$regexMatch;
      const str = String(evaluateExpression(doc, input.input));
      const regex = new RegExp(input.regex, input.options || "");
      return regex.test(str);
    }

    case "$cmp": {
      const [a, b] = expr.$cmp.map((e: any) => evaluateExpression(doc, e));
      return a === b ? 0 : a < b ? -1 : 1;
    }
    case "$eq": { const [a, b] = expr.$eq.map((e: any) => evaluateExpression(doc, e)); return a === b; }
    case "$gt": { const [a, b] = expr.$gt.map((e: any) => evaluateExpression(doc, e)); return a > b; }
    case "$gte": { const [a, b] = expr.$gte.map((e: any) => evaluateExpression(doc, e)); return a >= b; }
    case "$lt": { const [a, b] = expr.$lt.map((e: any) => evaluateExpression(doc, e)); return a < b; }
    case "$lte": { const [a, b] = expr.$lte.map((e: any) => evaluateExpression(doc, e)); return a <= b; }
    case "$ne": { const [a, b] = expr.$ne.map((e: any) => evaluateExpression(doc, e)); return a !== b; }

    case "$and": return (expr.$and as any[]).every(e => evaluateExpression(doc, e));
    case "$or": return (expr.$or as any[]).some(e => evaluateExpression(doc, e));
    case "$not": return !evaluateExpression(doc, expr.$not[0]);
    case "$cond": {
      if (Array.isArray(expr.$cond)) {
        const [condition, thenVal, elseVal] = expr.$cond;
        return evaluateExpression(doc, condition) ? evaluateExpression(doc, thenVal) : evaluateExpression(doc, elseVal);
      }
      const { if: ifExpr, then: thenExpr, else: elseExpr } = expr.$cond;
      return evaluateExpression(doc, ifExpr) ? evaluateExpression(doc, thenExpr) : evaluateExpression(doc, elseExpr);
    }
    case "$ifNull": {
      const [inputExpr, replacementExpr] = expr.$ifNull;
      const val = evaluateExpression(doc, inputExpr);
      return val === null || val === undefined ? evaluateExpression(doc, replacementExpr) : val;
    }
    case "$switch": {
      const branches = expr.$switch.branches;
      const defaultVal = expr.$switch.default;
      for (const branch of branches) {
        if (evaluateExpression(doc, branch.case)) return evaluateExpression(doc, branch.then);
      }
      return defaultVal !== undefined ? evaluateExpression(doc, defaultVal) : undefined;
    }

    case "$arrayElemAt": {
      const [arr, idx] = expr.$arrayElemAt.map((e: any) => evaluateExpression(doc, e));
      if (!Array.isArray(arr)) return undefined;
      return arr[idx < 0 ? arr.length + idx : idx];
    }
    case "$arrayToObject": {
      const arr = evaluateExpression(doc, expr.$arrayToObject);
      if (!Array.isArray(arr)) return {};
      const result: Record<string, any> = {};
      for (const item of arr) {
        if (Array.isArray(item) && item.length >= 2) result[String(item[0])] = item[1];
        else if (item && item.k !== undefined) result[String(item.k)] = item.v;
      }
      return result;
    }
    case "$concatArrays": {
      const arrays = expr.$concatArrays.map((e: any) => evaluateExpression(doc, e));
      return arrays.flat();
    }
    case "$filter": {
      const { input, as, cond } = expr.$filter;
      const arr = evaluateExpression(doc, input);
      if (!Array.isArray(arr)) return [];
      const varName = as || "this";
      return arr.filter(item => evaluateExpression({ ...doc, [varName]: item }, cond));
    }
    case "$first": return evaluateExpression(doc, expr.$first);
    case "$last": return evaluateExpression(doc, expr.$last);
    case "$size": {
      const arr = evaluateExpression(doc, expr.$size);
      return Array.isArray(arr) ? arr.length : 0;
    }
    case "$slice": {
      const args = expr.$slice;
      const arr = evaluateExpression(doc, args[0]);
      if (!Array.isArray(arr)) return [];
      const pos = evaluateExpression(doc, args[1]);
      if (args[2] !== undefined) return arr.slice(pos, pos + evaluateExpression(doc, args[2]));
      return arr.slice(0, pos);
    }
    case "$map": {
      const { input, as, in: inExpr } = expr.$map;
      const arr = evaluateExpression(doc, input);
      if (!Array.isArray(arr)) return [];
      const varName = as || "this";
      return arr.map(item => evaluateExpression({ ...doc, [varName]: item }, inExpr));
    }
    case "$reduce": {
      const { input, initialValue, in: inExpr } = expr.$reduce;
      const arr = evaluateExpression(doc, input);
      if (!Array.isArray(arr)) return evaluateExpression(doc, initialValue);
      const varName = expr.$reduce.as || "this";
      return arr.reduce((acc, item) => {
        return evaluateExpression({ ...doc, [varName]: item, value: acc }, inExpr);
      }, evaluateExpression(doc, initialValue));
    }
    case "$range": {
      const args = expr.$range.map((e: any) => evaluateExpression(doc, e));
      const [start, end, step = 1] = args;
      const result: number[] = [];
      for (let i = start; i < end; i += step) result.push(i);
      return result;
    }
    case "$zip": {
      const { inputs, useLongestLength, defaults } = expr.$zip;
      const arrays = inputs.map((e: any) => evaluateExpression(doc, e));
      const maxLen = useLongestLength ? Math.max(...arrays.map((a: any) => a.length)) : Math.min(...arrays.map((a: any) => a.length));
      const result: any[][] = [];
      for (let i = 0; i < maxLen; i++) {
        const row: any[] = [];
        for (let j = 0; j < arrays.length; j++) {
          if (i < arrays[j].length) row.push(arrays[j][i]);
          else if (defaults && defaults[j] !== undefined) row.push(evaluateExpression(doc, defaults[j]));
          else row.push(undefined);
        }
        result.push(row);
      }
      return result;
    }
    case "$in": {
      const [needle, haystack] = expr.$in.map((e: any) => evaluateExpression(doc, e));
      return Array.isArray(haystack) && haystack.includes(needle);
    }
    case "$indexOfArray": {
      const [arr, searchValue] = expr.$indexOfArray.map((e: any) => evaluateExpression(doc, e));
      return Array.isArray(arr) ? arr.indexOf(searchValue) : -1;
    }
    case "$reverseArray": {
      const arr = evaluateExpression(doc, expr.$reverseArray);
      return Array.isArray(arr) ? [...arr].reverse() : [];
    }
    case "$sortArray": {
      const { input, sortBy } = expr.$sortArray;
      const arr = evaluateExpression(doc, input);
      if (!Array.isArray(arr)) return [];
      const sorted = [...arr];
      if (sortBy === 1) sorted.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      else if (sortBy === -1) sorted.sort((a, b) => (a > b ? -1 : a < b ? 1 : 0));
      return sorted;
    }

    case "$year": return new Date(evaluateExpression(doc, expr.$year)).getFullYear();
    case "$month": return new Date(evaluateExpression(doc, expr.$month)).getMonth() + 1;
    case "$dayOfMonth": return new Date(evaluateExpression(doc, expr.$dayOfMonth)).getDate();
    case "$hour": return new Date(evaluateExpression(doc, expr.$hour)).getHours();
    case "$minute": return new Date(evaluateExpression(doc, expr.$minute)).getMinutes();
    case "$second": return new Date(evaluateExpression(doc, expr.$second)).getSeconds();
    case "$millisecond": return new Date(evaluateExpression(doc, expr.$millisecond)).getMilliseconds();
    case "$dayOfWeek": return new Date(evaluateExpression(doc, expr.$dayOfWeek)).getDay() + 1;
    case "$dayOfYear": {
      const date = new Date(evaluateExpression(doc, expr.$dayOfYear));
      const start = new Date(date.getFullYear(), 0, 0);
      return Math.floor((date.getTime() - start.getTime()) / 86400000);
    }
    case "$week": return getISOWeek(new Date(evaluateExpression(doc, expr.$week)));
    case "$isoDayOfWeek": {
      const day = new Date(evaluateExpression(doc, expr.$isoDayOfWeek)).getDay();
      return day === 0 ? 7 : day;
    }
    case "$isoWeekYear": return getISOWeekYear(new Date(evaluateExpression(doc, expr.$isoWeekYear)));
    case "$dateToString": {
      const { format, date, onNull } = expr.$dateToString;
      const d = evaluateExpression(doc, date);
      if (d === null || d === undefined) return onNull || null;
      return formatDate(new Date(d), format || "%Y-%m-%dT%H:%M:%S.%LZ");
    }
    case "$dateFromString": {
      const { dateString, onNull, onError } = expr.$dateFromString;
      const str = evaluateExpression(doc, dateString);
      if (str === null || str === undefined) return onNull || null;
      try { return new Date(str); } catch { return onError || null; }
    }
    case "$dateDiff": {
      const { startDate, endDate, unit } = expr.$dateDiff;
      return dateDiff(new Date(evaluateExpression(doc, startDate)), new Date(evaluateExpression(doc, endDate)), unit || "day");
    }
    case "$dateAdd": {
      const { startDate, unit, amount } = expr.$dateAdd;
      return addToDate(new Date(evaluateExpression(doc, startDate)), unit || "day", evaluateExpression(doc, amount));
    }
    case "$dateSubtract": {
      const { startDate, unit, amount } = expr.$dateSubtract;
      return addToDate(new Date(evaluateExpression(doc, startDate)), unit || "day", -evaluateExpression(doc, amount));
    }
    case "$toDate": return new Date(evaluateExpression(doc, expr.$toDate));

    case "$type": {
      const val = evaluateExpression(doc, expr.$type);
      if (val === null) return "null";
      if (val === undefined) return "undefined";
      if (Array.isArray(val)) return "array";
      if (val instanceof Date) return "date";
      if (val instanceof RegExp) return "regex";
      return typeof val;
    }
    case "$convert": {
      const { input, to, onError, onNull } = expr.$convert;
      const val = evaluateExpression(doc, input);
      if (val === null || val === undefined) return onNull !== undefined ? onNull : null;
      try { return convertType(val, to); } catch { return onError !== undefined ? onError : null; }
    }
    case "$toString": {
      const val = evaluateExpression(doc, expr.$toString);
      return val !== null && val !== undefined ? String(val) : null;
    }
    case "$toInt": {
      const val = evaluateExpression(doc, expr.$toInt);
      return val !== null && val !== undefined ? parseInt(val, 10) : null;
    }
    case "$toLong": {
      const val = evaluateExpression(doc, expr.$toLong);
      return val !== null && val !== undefined ? parseInt(val, 10) : null;
    }
    case "$toDouble": {
      const val = evaluateExpression(doc, expr.$toDouble);
      return val !== null && val !== undefined ? parseFloat(val) : null;
    }
    case "$toBool": {
      const val = evaluateExpression(doc, expr.$toBool);
      return val !== null && val !== undefined ? Boolean(val) : null;
    }
    case "$toObjectId": return evaluateExpression(doc, expr.$toObjectId);
    case "$toDecimal": return evaluateExpression(doc, expr.$toDecimal);
    case "$isNumber": {
      const val = evaluateExpression(doc, expr.$isNumber);
      return typeof val === "number" && !isNaN(val);
    }
    case "$isArray": return Array.isArray(evaluateExpression(doc, expr.$isArray));

    case "$setEquals": {
      const sets = expr.$setEquals.map((e: any) => evaluateExpression(doc, e));
      const [first, ...rest] = sets;
      const firstSet = new Set(first);
      return rest.every((arr: any[]) => {
        const s = new Set(arr);
        return s.size === firstSet.size && [...firstSet].every(v => s.has(v));
      });
    }
    case "$setIntersection": {
      const sets = expr.$setIntersection.map((e: any) => evaluateExpression(doc, e));
      return sets.reduce((a: any[], b: any[]) => a.filter(v => b.includes(v)));
    }
    case "$setUnion": {
      const sets = expr.$setUnion.map((e: any) => evaluateExpression(doc, e));
      return [...new Set(sets.flat())];
    }
    case "$setDifference": {
      const [a, b] = expr.$setDifference.map((e: any) => evaluateExpression(doc, e));
      return a.filter((v: any) => !b.includes(v));
    }
    case "$setIsSubset": {
      const [a, b] = expr.$setIsSubset.map((e: any) => evaluateExpression(doc, e));
      return a.every((v: any) => b.includes(v));
    }
    case "$anyElementTrue": {
      const arr = evaluateExpression(doc, expr.$anyElementTrue);
      return Array.isArray(arr) && arr.some(v => Boolean(v));
    }
    case "$allElementsTrue": {
      const arr = evaluateExpression(doc, expr.$allElementsTrue);
      return Array.isArray(arr) && arr.every(v => Boolean(v));
    }

    case "$literal": return expr.$literal;
    case "$getField": {
      const { field, input } = expr.$getField;
      const obj = input ? evaluateExpression(doc, input) : doc;
      return obj ? obj[field] : undefined;
    }
    case "$mergeObjects": {
      const sources = Array.isArray(expr.$mergeObjects)
        ? expr.$mergeObjects.map((e: any) => evaluateExpression(doc, e))
        : [evaluateExpression(doc, expr.$mergeObjects)];
      return Object.assign({}, ...sources.filter((s: any) => s !== null && typeof s === "object"));
    }
    case "$let": {
      const { vars, in: inExpr } = expr.$let;
      const context = { ...doc };
      for (const [varName, varExpr] of Object.entries(vars)) {
        context[`$$${varName}`] = evaluateExpression(doc, varExpr);
      }
      return evaluateExpression(context, inExpr);
    }

    default: {
      const { OperatorRegistry } = require("../OperatorRegistry");
      const registered = OperatorRegistry.getOperator(op);
      if (registered && registered.type === "expression") {
        return (registered.fn as any)(doc, expr[op]);
      }
      return expr;
    }
  }
}

function evaluateArithmetic(doc: any, args: any[], op: (a: number, b: number) => number): number {
  const values = args.map(e => evaluateExpression(doc, e));
  return values.reduce((a, b) => op(Number(a), Number(b)));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

function formatDate(date: Date, format: string): string {
  return format
    .replace("%Y", String(date.getFullYear()))
    .replace("%m", String(date.getMonth() + 1).padStart(2, "0"))
    .replace("%d", String(date.getDate()).padStart(2, "0"))
    .replace("%H", String(date.getHours()).padStart(2, "0"))
    .replace("%M", String(date.getMinutes()).padStart(2, "0"))
    .replace("%S", String(date.getSeconds()).padStart(2, "0"))
    .replace("%L", String(date.getMilliseconds()).padStart(3, "0"))
    .replace("%j", String(Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)));
}

function dateDiff(start: Date, end: Date, unit: string): number {
  const diffMs = end.getTime() - start.getTime();
  switch (unit) {
    case "millisecond": return diffMs;
    case "second": return Math.floor(diffMs / 1000);
    case "minute": return Math.floor(diffMs / 60000);
    case "hour": return Math.floor(diffMs / 3600000);
    case "day": return Math.floor(diffMs / 86400000);
    case "week": return Math.floor(diffMs / 604800000);
    case "month": return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    case "quarter": return Math.floor(((end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())) / 3);
    case "year": return end.getFullYear() - start.getFullYear();
    default: return diffMs;
  }
}

function addToDate(date: Date, unit: string, amount: number): Date {
  const result = new Date(date);
  switch (unit) {
    case "millisecond": result.setMilliseconds(result.getMilliseconds() + amount); break;
    case "second": result.setSeconds(result.getSeconds() + amount); break;
    case "minute": result.setMinutes(result.getMinutes() + amount); break;
    case "hour": result.setHours(result.getHours() + amount); break;
    case "day": result.setDate(result.getDate() + amount); break;
    case "week": result.setDate(result.getDate() + amount * 7); break;
    case "month": result.setMonth(result.getMonth() + amount); break;
    case "quarter": result.setMonth(result.getMonth() + amount * 3); break;
    case "year": result.setFullYear(result.getFullYear() + amount); break;
  }
  return result;
}

function convertType(value: any, to: string): any {
  switch (to) {
    case "string": return String(value);
    case "int": case "long": return parseInt(value, 10);
    case "double": case "decimal": return parseFloat(value);
    case "bool": return Boolean(value);
    case "date": return new Date(value);
    case "objectId": return value;
    default: return value;
  }
}
