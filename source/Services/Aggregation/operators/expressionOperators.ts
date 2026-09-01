
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path || !obj) return undefined;
  const parts = path.split(".");
  let current = obj as Record<string, unknown>;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part] as Record<string, unknown>;
  }
  return current;
}

export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

export function evaluateExpression(doc: Record<string, unknown>, expr: unknown): unknown {
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
  const exprObj = expr as Record<string, unknown>;

  switch (op) {
    case "$add": return evaluateArithmetic(doc, exprObj.$add as unknown[], (a, b) => a + b);
    case "$subtract": return evaluateArithmetic(doc, exprObj.$subtract as unknown[], (a, b) => a - b);
    case "$multiply": return evaluateArithmetic(doc, exprObj.$multiply as unknown[], (a, b) => a * b);
    case "$divide": return evaluateArithmetic(doc, exprObj.$divide as unknown[], (a, b) => a / b);
    case "$mod": return evaluateArithmetic(doc, exprObj.$mod as unknown[], (a, b) => a % b);
    case "$abs": return Math.abs(evaluateExpression(doc, exprObj.$abs) as number);
    case "$ceil": return Math.ceil(evaluateExpression(doc, exprObj.$ceil) as number);
    case "$floor": return Math.floor(evaluateExpression(doc, exprObj.$floor) as number);
    case "$sqrt": return Math.sqrt(evaluateExpression(doc, exprObj.$sqrt) as number);
    case "$pow": {
      const [base, exp] = (exprObj.$pow as unknown[]).map((e: unknown) => evaluateExpression(doc, e)) as [number, number];
      return Math.pow(base, exp);
    }
    case "$log": return Math.log(evaluateExpression(doc, exprObj.$log) as number);
    case "$log10": return Math.log10(evaluateExpression(doc, exprObj.$log10) as number);
    case "$exp": return Math.exp(evaluateExpression(doc, exprObj.$exp) as number);
    case "$trunc": return Math.trunc(evaluateExpression(doc, exprObj.$trunc) as number);
    case "$round": {
      const roundArgs = exprObj.$round as unknown;
      if (Array.isArray(roundArgs)) {
        const val = evaluateExpression(doc, roundArgs[0]) as number;
        const place = (evaluateExpression(doc, roundArgs[1]) as number) || 0;
        const factor = Math.pow(10, place);
        return Math.round(val * factor) / factor;
      }
      return Math.round(evaluateExpression(doc, roundArgs) as number);
    }

    case "$concat":
      return (exprObj.$concat as unknown[]).map(e => {
        const v = evaluateExpression(doc, e);
        return v === null || v === undefined ? "" : String(v);
      }).join("");
    case "$substr": {
      const [str, start, len] = (exprObj.$substr as unknown[]).map((e: unknown) => evaluateExpression(doc, e));
      return String(str).substr(start as number, len as number);
    }
    case "$substrBytes": {
      const [str, start, len] = (exprObj.$substrBytes as unknown[]).map((e: unknown) => evaluateExpression(doc, e));
      return String(str).substr(start as number, len as number);
    }
    case "$strLen": return String(evaluateExpression(doc, exprObj.$strLen)).length;
    case "$strLenBytes": return Buffer.byteLength(String(evaluateExpression(doc, exprObj.$strLenBytes)));
    case "$toLower": return String(evaluateExpression(doc, exprObj.$toLower)).toLowerCase();
    case "$toUpper": return String(evaluateExpression(doc, exprObj.$toUpper)).toUpperCase();
    case "$trim": {
      const trimInput = exprObj.$trim as Record<string, unknown>;
      if (typeof trimInput === "object" && trimInput.input) {
        const str = String(evaluateExpression(doc, trimInput.input));
        const chars = trimInput.chars ? evaluateExpression(doc, trimInput.chars) : undefined;
        if (chars) {
          const regex = new RegExp(`^[${escapeRegex(chars as string)}]+|[${escapeRegex(chars as string)}]+$`, "g");
          return str.replace(regex, "");
        }
        return str.trim();
      }
      return String(evaluateExpression(doc, trimInput)).trim();
    }
    case "$ltrim": {
      const ltrimInput = exprObj.$ltrim as Record<string, unknown>;
      if (typeof ltrimInput === "object" && ltrimInput.input) {
        const str = String(evaluateExpression(doc, ltrimInput.input));
        const chars = ltrimInput.chars ? evaluateExpression(doc, ltrimInput.chars) : undefined;
        if (chars) return str.replace(new RegExp(`^[${escapeRegex(chars as string)}]+`, "g"), "");
        return str.trimStart();
      }
      return String(evaluateExpression(doc, ltrimInput)).trimStart();
    }
    case "$rtrim": {
      const rtrimInput = exprObj.$rtrim as Record<string, unknown>;
      if (typeof rtrimInput === "object" && rtrimInput.input) {
        const str = String(evaluateExpression(doc, rtrimInput.input));
        const chars = rtrimInput.chars ? evaluateExpression(doc, rtrimInput.chars) : undefined;
        if (chars) return str.replace(new RegExp(`[${escapeRegex(chars as string)}]+$`, "g"), "");
        return str.trimEnd();
      }
      return String(evaluateExpression(doc, rtrimInput)).trimEnd();
    }
    case "$indexOfBytes": {
      const args = exprObj.$indexOfBytes as unknown[];
      const str = String(evaluateExpression(doc, args[0]));
      const search = String(evaluateExpression(doc, args[1]));
      const start = args[2] ? (evaluateExpression(doc, args[2]) as number) : 0;
      const end = args[3] ? (evaluateExpression(doc, args[3]) as number) : str.length;
      return str.substring(start, end).indexOf(search) + (start > 0 ? start : 0);
    }
    case "$split": {
      const [str, delim] = (exprObj.$split as unknown[]).map((e: unknown) => evaluateExpression(doc, e));
      return String(str).split(String(delim));
    }
    case "$replaceOne": {
      const input = exprObj.$replaceOne as Record<string, unknown>;
      const str = String(evaluateExpression(doc, input.input));
      const find = String(evaluateExpression(doc, input.find));
      const replacement = String(evaluateExpression(doc, input.replacement));
      return str.replace(find, replacement);
    }
    case "$replaceAll": {
      const input = exprObj.$replaceAll as Record<string, unknown>;
      const str = String(evaluateExpression(doc, input.input));
      const find = String(evaluateExpression(doc, input.find));
      const replacement = String(evaluateExpression(doc, input.replacement));
      return str.split(find).join(replacement);
    }
    case "$regexMatch": {
      const input = exprObj.$regexMatch as Record<string, unknown>;
      const str = String(evaluateExpression(doc, input.input));
      const regex = new RegExp(input.regex as string, (input.options as string) || "");
      return regex.test(str);
    }

    case "$cmp": {
      const [a, b] = (exprObj.$cmp as unknown[]).map((e: unknown) => evaluateExpression(doc, e)) as [number, number];
      return a === b ? 0 : a < b ? -1 : 1;
    }
    case "$eq": { const [a, b] = (exprObj.$eq as unknown[]).map((e: unknown) => evaluateExpression(doc, e)); return a === b; }
    case "$gt": { const [a, b] = (exprObj.$gt as unknown[]).map((e: unknown) => evaluateExpression(doc, e)) as [number, number]; return a > b; }
    case "$gte": { const [a, b] = (exprObj.$gte as unknown[]).map((e: unknown) => evaluateExpression(doc, e)) as [number, number]; return a >= b; }
    case "$lt": { const [a, b] = (exprObj.$lt as unknown[]).map((e: unknown) => evaluateExpression(doc, e)) as [number, number]; return a < b; }
    case "$lte": { const [a, b] = (exprObj.$lte as unknown[]).map((e: unknown) => evaluateExpression(doc, e)) as [number, number]; return a <= b; }
    case "$ne": { const [a, b] = (exprObj.$ne as unknown[]).map((e: unknown) => evaluateExpression(doc, e)); return a !== b; }

    case "$and": return (exprObj.$and as unknown[]).every(e => evaluateExpression(doc, e));
    case "$or": return (exprObj.$or as unknown[]).some(e => evaluateExpression(doc, e));
    case "$not": return !evaluateExpression(doc, (exprObj.$not as unknown[])[0]);
    case "$cond": {
      const condVal = exprObj.$cond;
      if (Array.isArray(condVal)) {
        const [condition, thenVal, elseVal] = condVal;
        return evaluateExpression(doc, condition) ? evaluateExpression(doc, thenVal) : evaluateExpression(doc, elseVal);
      }
      const { if: ifExpr, then: thenExpr, else: elseExpr } = condVal as Record<string, unknown>;
      return evaluateExpression(doc, ifExpr) ? evaluateExpression(doc, thenExpr) : evaluateExpression(doc, elseExpr);
    }
    case "$ifNull": {
      const [inputExpr, replacementExpr] = exprObj.$ifNull as unknown[];
      const val = evaluateExpression(doc, inputExpr);
      return val === null || val === undefined ? evaluateExpression(doc, replacementExpr) : val;
    }
    case "$switch": {
      const switchVal = exprObj.$switch as Record<string, unknown>;
      const branches = switchVal.branches as { case: unknown; then: unknown }[];
      const defaultVal = switchVal.default;
      for (const branch of branches) {
        if (evaluateExpression(doc, branch.case)) return evaluateExpression(doc, branch.then);
      }
      return defaultVal !== undefined ? evaluateExpression(doc, defaultVal) : undefined;
    }

    case "$arrayElemAt": {
      const [arr, idx] = (exprObj.$arrayElemAt as unknown[]).map((e: unknown) => evaluateExpression(doc, e));
      if (!Array.isArray(arr)) return undefined;
      const idxNum = idx as number;
      return arr[idxNum < 0 ? arr.length + idxNum : idxNum];
    }
    case "$arrayToObject": {
      const arr = evaluateExpression(doc, exprObj.$arrayToObject);
      if (!Array.isArray(arr)) return {};
      const result: Record<string, unknown> = {};
      for (const item of arr) {
        if (Array.isArray(item) && item.length >= 2) result[String(item[0])] = item[1];
        else if (item && (item as Record<string, unknown>).k !== undefined) result[String((item as Record<string, unknown>).k)] = (item as Record<string, unknown>).v;
      }
      return result;
    }
    case "$concatArrays": {
      const arrays = (exprObj.$concatArrays as unknown[]).map((e: unknown) => evaluateExpression(doc, e));
      return (arrays as unknown[][]).flat();
    }
    case "$filter": {
      const { input, as, cond } = exprObj.$filter as Record<string, unknown>;
      const arr = evaluateExpression(doc, input) as unknown[];
      if (!Array.isArray(arr)) return [];
      const varName = (as as string) || "this";
      return arr.filter(item => evaluateExpression({ ...doc, [varName]: item }, cond));
    }
    case "$first": return evaluateExpression(doc, (exprObj.$first as unknown));
    case "$last": return evaluateExpression(doc, (exprObj.$last as unknown));
    case "$size": {
      const arr = evaluateExpression(doc, exprObj.$size);
      return Array.isArray(arr) ? arr.length : 0;
    }
    case "$slice": {
      const args = exprObj.$slice as unknown[];
      const arr = evaluateExpression(doc, args[0]) as unknown[];
      if (!Array.isArray(arr)) return [];
      const pos = evaluateExpression(doc, args[1]) as number;
      if (args[2] !== undefined) return arr.slice(pos, pos + (evaluateExpression(doc, args[2]) as number));
      return arr.slice(0, pos);
    }
    case "$map": {
      const { input, as, in: inExpr } = exprObj.$map as Record<string, unknown>;
      const arr = evaluateExpression(doc, input) as unknown[];
      if (!Array.isArray(arr)) return [];
      const varName = (as as string) || "this";
      return arr.map(item => evaluateExpression({ ...doc, [varName]: item }, inExpr));
    }
    case "$reduce": {
      const { input, initialValue, in: inExpr } = exprObj.$reduce as Record<string, unknown>;
      const arr = evaluateExpression(doc, input) as unknown[];
      if (!Array.isArray(arr)) return evaluateExpression(doc, initialValue);
      const varName = ((exprObj.$reduce as Record<string, unknown>).as as string) || "this";
      return arr.reduce((acc, item) => {
        return evaluateExpression({ ...doc, [varName]: item, value: acc }, inExpr);
      }, evaluateExpression(doc, initialValue));
    }
    case "$range": {
      const args = (exprObj.$range as unknown[]).map((e: unknown) => evaluateExpression(doc, e)) as number[];
      const [start, end, step = 1] = args;
      const result: number[] = [];
      for (let i = start; i < end; i += step) result.push(i);
      return result;
    }
    case "$zip": {
      const { inputs, useLongestLength, defaults } = exprObj.$zip as Record<string, unknown>;
      const arrays = (inputs as unknown[]).map((e: unknown) => evaluateExpression(doc, e) as unknown[]);
      const maxLen = useLongestLength ? Math.max(...arrays.map((a: unknown[]) => a.length)) : Math.min(...arrays.map((a: unknown[]) => a.length));
      const result: unknown[][] = [];
      for (let i = 0; i < maxLen; i++) {
        const row: unknown[] = [];
        for (let j = 0; j < arrays.length; j++) {
          if (i < arrays[j].length) row.push(arrays[j][i]);
          else if (defaults && (defaults as unknown[])[j] !== undefined) row.push(evaluateExpression(doc, (defaults as unknown[])[j]));
          else row.push(undefined);
        }
        result.push(row);
      }
      return result;
    }
    case "$in": {
      const [needle, haystack] = (exprObj.$in as unknown[]).map((e: unknown) => evaluateExpression(doc, e));
      return Array.isArray(haystack) && haystack.includes(needle);
    }
    case "$indexOfArray": {
      const [arr, searchValue] = (exprObj.$indexOfArray as unknown[]).map((e: unknown) => evaluateExpression(doc, e));
      return Array.isArray(arr) ? arr.indexOf(searchValue) : -1;
    }
    case "$reverseArray": {
      const arr = evaluateExpression(doc, exprObj.$reverseArray);
      return Array.isArray(arr) ? [...arr].reverse() : [];
    }
    case "$sortArray": {
      const { input, sortBy } = exprObj.$sortArray as Record<string, unknown>;
      const arr = evaluateExpression(doc, input) as unknown[];
      if (!Array.isArray(arr)) return [];
      const sorted = [...arr];
      if (sortBy === 1) sorted.sort((a, b) => ((a as number) < (b as number) ? -1 : (a as number) > (b as number) ? 1 : 0));
      else if (sortBy === -1) sorted.sort((a, b) => ((a as number) > (b as number) ? -1 : (a as number) < (b as number) ? 1 : 0));
      return sorted;
    }

    case "$year": return new Date(evaluateExpression(doc, exprObj.$year) as string | number).getFullYear();
    case "$month": return new Date(evaluateExpression(doc, exprObj.$month) as string | number).getMonth() + 1;
    case "$dayOfMonth": return new Date(evaluateExpression(doc, exprObj.$dayOfMonth) as string | number).getDate();
    case "$hour": return new Date(evaluateExpression(doc, exprObj.$hour) as string | number).getHours();
    case "$minute": return new Date(evaluateExpression(doc, exprObj.$minute) as string | number).getMinutes();
    case "$second": return new Date(evaluateExpression(doc, exprObj.$second) as string | number).getSeconds();
    case "$millisecond": return new Date(evaluateExpression(doc, exprObj.$millisecond) as string | number).getMilliseconds();
    case "$dayOfWeek": return new Date(evaluateExpression(doc, exprObj.$dayOfWeek) as string | number).getDay() + 1;
    case "$dayOfYear": {
      const date = new Date(evaluateExpression(doc, exprObj.$dayOfYear) as string | number);
      const start = new Date(date.getFullYear(), 0, 0);
      return Math.floor((date.getTime() - start.getTime()) / 86400000);
    }
    case "$week": return getISOWeek(new Date(evaluateExpression(doc, exprObj.$week) as string | number));
    case "$isoDayOfWeek": {
      const day = new Date(evaluateExpression(doc, exprObj.$isoDayOfWeek) as string | number).getDay();
      return day === 0 ? 7 : day;
    }
    case "$isoWeekYear": return getISOWeekYear(new Date(evaluateExpression(doc, exprObj.$isoWeekYear) as string | number));
    case "$dateToString": {
      const { format, date, onNull } = exprObj.$dateToString as Record<string, unknown>;
      const d = evaluateExpression(doc, date);
      if (d === null || d === undefined) return onNull || null;
      return formatDate(new Date(d as string | number), (format as string) || "%Y-%m-%dT%H:%M:%S.%LZ");
    }
    case "$dateFromString": {
      const { dateString, onNull, onError } = exprObj.$dateFromString as Record<string, unknown>;
      const str = evaluateExpression(doc, dateString);
      if (str === null || str === undefined) return onNull || null;
      try { return new Date(str as string); } catch { return onError || null; }
    }
    case "$dateDiff": {
      const { startDate, endDate, unit } = exprObj.$dateDiff as Record<string, unknown>;
      return dateDiff(new Date(evaluateExpression(doc, startDate) as string | number), new Date(evaluateExpression(doc, endDate) as string | number), (unit as string) || "day");
    }
    case "$dateAdd": {
      const { startDate, unit, amount } = exprObj.$dateAdd as Record<string, unknown>;
      return addToDate(new Date(evaluateExpression(doc, startDate) as string | number), (unit as string) || "day", evaluateExpression(doc, amount) as number);
    }
    case "$dateSubtract": {
      const { startDate, unit, amount } = exprObj.$dateSubtract as Record<string, unknown>;
      return addToDate(new Date(evaluateExpression(doc, startDate) as string | number), (unit as string) || "day", -(evaluateExpression(doc, amount) as number));
    }
    case "$toDate": return new Date(evaluateExpression(doc, exprObj.$toDate) as string | number);

    case "$type": {
      const val = evaluateExpression(doc, exprObj.$type);
      if (val === null) return "null";
      if (val === undefined) return "undefined";
      if (Array.isArray(val)) return "array";
      if (val instanceof Date) return "date";
      if (val instanceof RegExp) return "regex";
      return typeof val;
    }
    case "$convert": {
      const { input, to, onError, onNull } = exprObj.$convert as Record<string, unknown>;
      const val = evaluateExpression(doc, input);
      if (val === null || val === undefined) return onNull !== undefined ? onNull : null;
      try { return convertType(val, to as string); } catch { return onError !== undefined ? onError : null; }
    }
    case "$toString": {
      const val = evaluateExpression(doc, exprObj.$toString);
      return val !== null && val !== undefined ? String(val) : null;
    }
    case "$toInt": {
      const val = evaluateExpression(doc, exprObj.$toInt);
      return val !== null && val !== undefined ? parseInt(val as string, 10) : null;
    }
    case "$toLong": {
      const val = evaluateExpression(doc, exprObj.$toLong);
      return val !== null && val !== undefined ? parseInt(val as string, 10) : null;
    }
    case "$toDouble": {
      const val = evaluateExpression(doc, exprObj.$toDouble);
      return val !== null && val !== undefined ? parseFloat(val as string) : null;
    }
    case "$toBool": {
      const val = evaluateExpression(doc, exprObj.$toBool);
      return val !== null && val !== undefined ? Boolean(val) : null;
    }
    case "$toObjectId": return evaluateExpression(doc, exprObj.$toObjectId);
    case "$toDecimal": return evaluateExpression(doc, exprObj.$toDecimal);
    case "$isNumber": {
      const val = evaluateExpression(doc, exprObj.$isNumber);
      return typeof val === "number" && !isNaN(val);
    }
    case "$isArray": return Array.isArray(evaluateExpression(doc, exprObj.$isArray));

    case "$setEquals": {
      const sets = (exprObj.$setEquals as unknown[]).map((e: unknown) => evaluateExpression(doc, e) as unknown[]);
      const [first, ...rest] = sets;
      const firstSet = new Set(first);
      return rest.every((arr: unknown[]) => {
        const s = new Set(arr);
        return s.size === firstSet.size && [...firstSet].every(v => s.has(v));
      });
    }
    case "$setIntersection": {
      const sets = (exprObj.$setIntersection as unknown[]).map((e: unknown) => evaluateExpression(doc, e) as unknown[]);
      return sets.reduce((a: unknown[], b: unknown[]) => a.filter(v => b.includes(v)));
    }
    case "$setUnion": {
      const sets = (exprObj.$setUnion as unknown[]).map((e: unknown) => evaluateExpression(doc, e) as unknown[]);
      return [...new Set(sets.flat())];
    }
    case "$setDifference": {
      const [a, b] = (exprObj.$setDifference as unknown[]).map((e: unknown) => evaluateExpression(doc, e) as unknown[]);
      return a.filter((v: unknown) => !b.includes(v));
    }
    case "$setIsSubset": {
      const [a, b] = (exprObj.$setIsSubset as unknown[]).map((e: unknown) => evaluateExpression(doc, e) as unknown[]);
      return a.every((v: unknown) => b.includes(v));
    }
    case "$anyElementTrue": {
      const arr = evaluateExpression(doc, exprObj.$anyElementTrue);
      return Array.isArray(arr) && arr.some(v => Boolean(v));
    }
    case "$allElementsTrue": {
      const arr = evaluateExpression(doc, exprObj.$allElementsTrue);
      return Array.isArray(arr) && arr.every(v => Boolean(v));
    }

    case "$literal": return exprObj.$literal;
    case "$getField": {
      const { field, input } = exprObj.$getField as Record<string, unknown>;
      const obj = input ? evaluateExpression(doc, input) as Record<string, unknown> : doc;
      return obj ? obj[field as string] : undefined;
    }
    case "$mergeObjects": {
      const sources = Array.isArray(exprObj.$mergeObjects)
        ? (exprObj.$mergeObjects as unknown[]).map((e: unknown) => evaluateExpression(doc, e))
        : [evaluateExpression(doc, exprObj.$mergeObjects)];
      return Object.assign({}, ...sources.filter((s: unknown) => s !== null && typeof s === "object") as Record<string, unknown>[]);
    }
    case "$let": {
      const { vars, in: inExpr } = exprObj.$let as Record<string, unknown>;
      const context = { ...doc };
      for (const [varName, varExpr] of Object.entries(vars as Record<string, unknown>)) {
        context[`$$${varName}`] = evaluateExpression(doc, varExpr);
      }
      return evaluateExpression(context, inExpr);
    }

    default: {
      const { OperatorRegistry } = require("../OperatorRegistry");
      const registered = OperatorRegistry.getOperator(op);
      if (registered && registered.type === "expression") {
        return (registered.fn as any)(doc, exprObj[op]);
      }
      return expr;
    }
  }
}

function evaluateArithmetic(doc: Record<string, unknown>, args: unknown[], op: (a: number, b: number) => number): number {
  const values = args.map(e => evaluateExpression(doc, e));
  return values.reduce((a, b) => op(Number(a), Number(b))) as number;
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

function convertType(value: unknown, to: string): unknown {
  switch (to) {
    case "string": return String(value);
    case "int": case "long": return parseInt(value as string, 10);
    case "double": case "decimal": return parseFloat(value as string);
    case "bool": return Boolean(value);
    case "date": return new Date(value as string | number);
    case "objectId": return value;
    default: return value;
  }
}
