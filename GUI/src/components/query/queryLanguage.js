/**
 * The little language the Query console understands:
 *
 *   <Collection>.query({ name: 'Ankan' }).exec()
 *   <Collection>.aggregate([{ $match: {} }]).exec()
 *
 * `.exec()` is required because the real API is chainable and nothing runs without it -
 * `collection.query({})` on its own just builds a chain object. Accepting it here without
 * the terminal call would teach a syntax that does nothing in a .js file.
 *
 * Those are the only two shapes the Dashboard HTTP API exposes for reading
 * (`POST /api/operation/all/by-query/` and `POST /api/operation/aggregate/`), so they are
 * the only two offered. `.Limit()`, `.Skip()` and `.Sort()` exist on the embedded library
 * but the REST layer fixes them itself, so suggesting them here would be a lie.
 *
 * The argument is a JavaScript object literal, not JSON - unquoted keys, bare `$gt`, and
 * single quotes all work, so what you type here is what you would type in a .js file using
 * the package. `parseLiteral` below turns it into a real value, which the caller serialises
 * to JSON for the wire. It is a hand-written recursive-descent parser rather than `eval` or
 * `new Function`: this string comes from a text box, and handing that to the engine would be
 * arbitrary code execution in the dashboard.
 *
 * Everything below is syntax only - no document data is ever inspected or suggested.
 */

/** Methods offered after `<Collection>.` */
export const METHODS = [
  {
    label: 'query',
    detail: '(filter) → documents',
    doc: 'Find documents matching a MongoDB-style filter object. `{}` returns everything.',
    insert: 'query({}).exec()',
    caretOffset: 7
  },
  {
    label: 'aggregate',
    detail: '(pipeline) → documents',
    doc: 'Run an aggregation pipeline. The pipeline is an array and must start with a $match stage.',
    insert: 'aggregate([{ $match: {} }]).exec()',
    caretOffset: 22
  }
]

/** Terminal call. Offered after the closing `)` of query()/aggregate(). */
export const TERMINALS = [
  {
    label: 'exec',
    detail: '() → Promise<result>',
    doc: 'Runs the chain. The API is lazy - nothing touches the database until exec() is called.',
    insert: 'exec()'
  }
]

/** Operators accepted by the query engine (source/utility/Searcher.utils.ts). */
export const QUERY_OPERATORS = [
  { label: '$eq', detail: 'equals', doc: 'Matches values equal to the given value.', insert: '$eq: ' },
  { label: '$ne', detail: 'not equal', doc: 'Matches values not equal to the given value.', insert: '$ne: ' },
  { label: '$gt', detail: 'greater than', doc: 'Matches values greater than the given value.', insert: '$gt: ' },
  { label: '$gte', detail: 'greater or equal', doc: 'Matches values greater than or equal to the given value.', insert: '$gte: ' },
  { label: '$lt', detail: 'less than', doc: 'Matches values less than the given value.', insert: '$lt: ' },
  { label: '$lte', detail: 'less or equal', doc: 'Matches values less than or equal to the given value.', insert: '$lte: ' },
  { label: '$in', detail: 'in array', doc: 'Matches any value present in the given array.', insert: '$in: []' },
  { label: '$nin', detail: 'not in array', doc: 'Matches values absent from the given array.', insert: '$nin: []' },
  { label: '$all', detail: 'contains all', doc: 'Matches arrays containing every listed element.', insert: '$all: []' },
  { label: '$size', detail: 'array length', doc: 'Matches arrays with exactly this many elements.', insert: '$size: 0' },
  { label: '$exists', detail: 'field present', doc: 'Matches documents where the field does (true) or does not (false) exist.', insert: '$exists: true' },
  { label: '$type', detail: 'value type', doc: 'Matches values of the given JavaScript type, e.g. "string" or "number".', insert: "$type: 'string'" },
  { label: '$regex', detail: 'pattern match', doc: 'Matches strings against a regular expression. Pair with $options for flags.', insert: "$regex: ''" },
  { label: '$options', detail: 'regex flags', doc: 'Flags for a sibling $regex, e.g. "i" for case-insensitive.', insert: "$options: 'i'" },
  { label: '$elemMatch', detail: 'array element match', doc: 'Matches arrays with at least one element satisfying every listed condition.', insert: '$elemMatch: {}' },
  { label: '$not', detail: 'negate', doc: 'Inverts the enclosed condition.', insert: '$not: {}' },
  { label: '$and', detail: 'all of', doc: 'Every condition in the array must match.', insert: '$and: []' },
  { label: '$or', detail: 'any of', doc: 'At least one condition in the array must match.', insert: '$or: []' },
  { label: '$nor', detail: 'none of', doc: 'No condition in the array may match.', insert: '$nor: []' }
]

/** Pipeline stages accepted by the aggregation engine (source/Services/Aggregation). */
export const AGGREGATION_STAGES = [
  { label: '$match', detail: 'filter stage', doc: 'Filters documents. Required as the first stage of every pipeline.', insert: '$match: {}' },
  { label: '$group', detail: 'group stage', doc: 'Groups by _id. Accumulators available here are $sum and $avg.', insert: "$group: { _id: '$field' }" },
  { label: '$project', detail: 'shape stage', doc: 'Chooses which fields to keep. Inclusion only.', insert: '$project: {}' },
  { label: '$sort', detail: 'order stage', doc: 'Orders documents. 1 ascending, -1 descending.', insert: '$sort: {}' },
  { label: '$limit', detail: 'cap stage', doc: 'Keeps at most N documents.', insert: '$limit: 10' },
  { label: '$skip', detail: 'offset stage', doc: 'Discards the first N documents.', insert: '$skip: 0' },
  { label: '$unwind', detail: 'flatten stage', doc: 'Expands an array field into one document per element.', insert: "$unwind: '$field'" },
  { label: '$addFields', detail: 'add fields stage', doc: 'Adds computed fields to each document.', insert: '$addFields: {}' },
  { label: '$sum', detail: 'accumulator', doc: 'Inside $group: totals a field, or counts with a literal 1.', insert: '$sum: 1' },
  { label: '$avg', detail: 'accumulator', doc: 'Inside $group: averages a numeric field.', insert: "$avg: '$field'" }
]

const QUERY_OPERATOR_NAMES = new Set(QUERY_OPERATORS.map((o) => o.label))
const AGGREGATION_NAMES = new Set(AGGREGATION_STAGES.map((s) => s.label))

/**
 * Splits source into coloured tokens. Single left-to-right pass, no lookbehind - a string
 * is re-classified as a key once we see the `:` that follows it.
 *
 * @param {string} text
 * @returns {Array<{type: string, value: string, start: number}>}
 */
export function tokenize (text) {
  const tokens = []
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (char === '"' || char === "'" || char === '`') {
      let end = i + 1
      while (end < text.length && (text[end] !== char || text[end - 1] === '\\')) end++
      const value = text.slice(i, Math.min(end + 1, text.length))
      const inner = value.slice(1, -1)
      tokens.push({
        type: inner.startsWith('$') ? 'operator' : 'string',
        value,
        start: i
      })
      i = end + 1
      continue
    }

    if (/\s/.test(char)) {
      let end = i
      while (end < text.length && /\s/.test(text[end])) end++
      tokens.push({ type: 'space', value: text.slice(i, end), start: i })
      i = end
      continue
    }

    if (/[0-9-]/.test(char) && /[0-9]/.test(text[i + 1] ?? char)) {
      let end = i
      while (end < text.length && /[0-9.eE+-]/.test(text[end])) end++
      tokens.push({ type: 'number', value: text.slice(i, end), start: i })
      i = end
      continue
    }

    if (/[A-Za-z_$]/.test(char)) {
      let end = i
      while (end < text.length && /[A-Za-z0-9_$]/.test(text[end])) end++
      const word = text.slice(i, end)
      const isLiteral = word === 'true' || word === 'false' || word === 'null' || word === 'undefined'
      const isMethod = text[end] === '('
      tokens.push({
        type: isLiteral
          ? 'literal'
          : isMethod
            ? 'method'
            : word.startsWith('$') ? 'operator' : 'identifier',
        value: word,
        start: i
      })
      i = end
      continue
    }

    tokens.push({ type: 'punctuation', value: char, start: i })
    i++
  }

  // Anything immediately followed by `:` is a property key, not a value. `$operator` keys
  // keep their own colour - that distinction is the whole point of highlighting them.
  for (let t = 0; t < tokens.length; t++) {
    if (tokens[t].type !== 'string' && tokens[t].type !== 'identifier') continue
    let next = t + 1
    while (next < tokens.length && tokens[next].type === 'space') next++
    if (tokens[next]?.value === ':') tokens[t].type = 'key'
  }

  return tokens
}

/**
 * Index of the `)` closing the `(` at `open`, or -1. Counts depth and skips quoted
 * sections, so a paren inside a string value cannot close the call.
 */
function findMatchingParen (text, open) {
  let depth = 0
  let quote = null

  for (let i = open; i < text.length; i++) {
    const char = text[i]

    if (quote) {
      if (char === '\\') i++
      else if (char === quote) quote = null
      continue
    }

    if (char === '"' || char === "'" || char === '`') { quote = char; continue }
    if (char === '(') depth++
    else if (char === ')') {
      depth--
      if (depth === 0) return i
    }
  }

  return -1
}

/**
 * Pulls `<Collection>.<method>(<args>)` - and the trailing `.exec()` if present - out of
 * the source.
 *
 * @returns {{collection: string, method: string, args: string, argsStart: number,
 *            hasExec: boolean, tail: string, tailStart: number} | null}
 */
export function parseExpression (text) {
  const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(text)
  if (!match) return null

  const open = match[0].length - 1
  const close = findMatchingParen(text, open)
  if (close === -1) return null

  const tail = text.slice(close + 1)

  return {
    collection: match[1],
    method: match[2],
    args: text.slice(open + 1, close),
    argsStart: open + 1,
    hasExec: /^\s*\.\s*exec\s*\(\s*\)\s*;?\s*$/.test(tail),
    tail,
    tailStart: close + 1
  }
}

/**
 * The method being called, without requiring the call to be closed yet.
 *
 * {@link parseExpression} needs a matching `)` and so returns null for everything the user is
 * still typing - which is exactly when suggestions matter. This only needs the opening paren,
 * so `Coll.aggregate([{ $ma` still resolves to `aggregate`.
 *
 * @returns {string | null}
 */
function detectMethod (text) {
  return /^\s*[A-Za-z_][A-Za-z0-9_]*\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(text)?.[1] ?? null
}

/** Thrown by {@link parseLiteral} with the offset of the offending character. */
export class LiteralSyntaxError extends Error {
  constructor (message, offset) {
    super(message)
    this.name = 'LiteralSyntaxError'
    this.offset = offset
  }
}

/**
 * Parses a JavaScript object-literal subset into a real value: objects, arrays, strings
 * (single, double, or backtick without interpolation), numbers, true/false/null, unquoted
 * and `$`-prefixed keys, and trailing commas.
 *
 * Deliberately hand-written - `eval`/`new Function` on text box contents would be arbitrary
 * code execution. Nothing here can call out, only build plain data.
 *
 * @param {string} text
 * @returns {*} the parsed value
 * @throws {LiteralSyntaxError} on malformed input, carrying the character offset
 */
export function parseLiteral (text) {
  let pos = 0

  const skipSpace = () => {
    while (pos < text.length && /\s/.test(text[pos])) pos++
  }

  const fail = (message) => {
    throw new LiteralSyntaxError(message, Math.min(pos, Math.max(text.length - 1, 0)))
  }

  const parseString = () => {
    const quote = text[pos]
    pos++
    let out = ''
    while (pos < text.length && text[pos] !== quote) {
      if (text[pos] === '\\') {
        const escapes = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }
        const next = text[pos + 1]
        out += escapes[next] ?? next
        pos += 2
        continue
      }
      out += text[pos]
      pos++
    }
    if (pos >= text.length) fail('Unterminated string')
    pos++
    return out
  }

  const parseNumber = () => {
    const start = pos
    if (text[pos] === '+' || text[pos] === '-') pos++
    while (pos < text.length && /[0-9.eE+-]/.test(text[pos])) pos++
    const raw = text.slice(start, pos)
    const value = Number(raw)
    if (Number.isNaN(value)) fail(`Invalid number "${raw}"`)
    return value
  }

  /** Object keys: quoted, or a bare identifier that may start with `$` or `_`. */
  const parseKey = () => {
    if (text[pos] === '"' || text[pos] === "'" || text[pos] === '`') return parseString()
    const start = pos
    while (pos < text.length && /[A-Za-z0-9_$]/.test(text[pos])) pos++
    if (pos === start) fail(`Expected a property name but found "${text[pos] ?? 'end of input'}"`)
    return text.slice(start, pos)
  }

  const parseObject = () => {
    pos++ // {
    const out = {}
    skipSpace()
    if (text[pos] === '}') { pos++; return out }

    for (;;) {
      skipSpace()
      if (text[pos] === '}') { pos++; return out } // trailing comma
      const key = parseKey()
      skipSpace()
      if (text[pos] !== ':') fail(`Expected ":" after property "${key}"`)
      pos++
      skipSpace()
      out[key] = parseValue()
      skipSpace()
      if (text[pos] === ',') { pos++; continue }
      if (text[pos] === '}') { pos++; return out }
      fail('Expected "," or "}"')
    }
  }

  const parseArray = () => {
    pos++ // [
    const out = []
    skipSpace()
    if (text[pos] === ']') { pos++; return out }

    for (;;) {
      skipSpace()
      if (text[pos] === ']') { pos++; return out } // trailing comma
      out.push(parseValue())
      skipSpace()
      if (text[pos] === ',') { pos++; continue }
      if (text[pos] === ']') { pos++; return out }
      fail('Expected "," or "]"')
    }
  }

  const parseValue = () => {
    skipSpace()
    if (pos >= text.length) fail('Unexpected end of input')

    const char = text[pos]
    if (char === '{') return parseObject()
    if (char === '[') return parseArray()
    if (char === '"' || char === "'" || char === '`') return parseString()
    if (/[0-9+-]/.test(char)) return parseNumber()

    if (text.startsWith('true', pos)) { pos += 4; return true }
    if (text.startsWith('false', pos)) { pos += 5; return false }
    if (text.startsWith('null', pos)) { pos += 4; return null }
    if (text.startsWith('undefined', pos)) { pos += 9; return undefined }

    fail(`Unexpected "${char}"`)
  }

  skipSpace()
  if (pos >= text.length) throw new LiteralSyntaxError('Expected a value', 0)
  const value = parseValue()
  skipSpace()
  if (pos < text.length) fail(`Unexpected "${text[pos]}" after the value`)
  return value
}

/**
 * Every `$word` used as a property *key*, with its offset - the basis for flagging unknown
 * operators. Only keys count: `{ _id: '$city' }` uses `$city` as a field reference, and
 * flagging that as an unknown operator would be wrong.
 */
function collectOperators (tokens) {
  const operators = []

  for (let t = 0; t < tokens.length; t++) {
    if (tokens[t].type !== 'operator') continue
    let next = t + 1
    while (next < tokens.length && tokens[next].type === 'space') next++
    if (tokens[next]?.value !== ':') continue

    const raw = tokens[t].value
    const quoted = raw.startsWith('"') || raw.startsWith("'") || raw.startsWith('`')
    operators.push({
      name: quoted ? raw.slice(2, -1) : raw.slice(1),
      start: tokens[t].start,
      end: tokens[t].start + raw.length
    })
  }

  return operators
}

/**
 * Validates the expression and returns VS Code-style diagnostics.
 *
 * @param {string} text - Editor contents.
 * @param {string} collectionName - The collection this console is bound to.
 * @returns {Array<{start: number, end: number, message: string, severity: 'error'|'warning'}>}
 */
export function validate (text, collectionName) {
  const diagnostics = []
  const trimmed = text.trim()
  if (!trimmed) return diagnostics

  const parsed = parseExpression(text)
  if (!parsed) {
    diagnostics.push({
      start: 0,
      end: text.length,
      message: `Expected ${collectionName}.query({ ... }).exec() or ${collectionName}.aggregate([ ... ]).exec()`,
      severity: 'error'
    })
    return diagnostics
  }

  if (!parsed.hasExec) {
    const empty = parsed.tail.trim().length === 0
    diagnostics.push({
      start: parsed.tailStart,
      end: empty ? text.length : parsed.tailStart + parsed.tail.length,
      message: empty
        ? 'Missing .exec() - the chain is lazy, so nothing runs without it.'
        : `Only .exec() can follow ${parsed.method}() here. Ordering and paging are set by the dashboard.`,
      severity: 'error'
    })
  }

  const nameStart = text.indexOf(parsed.collection)
  if (parsed.collection !== collectionName) {
    diagnostics.push({
      start: nameStart,
      end: nameStart + parsed.collection.length,
      message: `Unknown collection "${parsed.collection}". This console is bound to "${collectionName}".`,
      severity: 'error'
    })
  }

  const method = METHODS.find((m) => m.label === parsed.method)
  if (!method) {
    const methodStart = text.indexOf(parsed.method, nameStart + parsed.collection.length)
    diagnostics.push({
      start: methodStart,
      end: methodStart + parsed.method.length,
      message: `"${parsed.method}" is not available here. Use ${METHODS.map((m) => m.label).join(' or ')}.`,
      severity: 'error'
    })
    return diagnostics
  }

  let value
  try {
    value = parseLiteral(parsed.args)
  } catch (error) {
    const start = parsed.argsStart + (error.offset ?? 0)
    diagnostics.push({
      start: Math.min(start, Math.max(text.length - 1, 0)),
      end: Math.min(start + 1, text.length),
      message: error.message,
      severity: 'error'
    })
    return diagnostics
  }

  const tokens = tokenize(parsed.args)
  const known = parsed.method === 'aggregate'
    ? new Set([...AGGREGATION_NAMES, ...QUERY_OPERATOR_NAMES])
    : QUERY_OPERATOR_NAMES

  for (const operator of collectOperators(tokens)) {
    // `$field` references (e.g. "$age" inside $group/$unwind) are values, not operators.
    if (known.has(`$${operator.name}`)) continue
    if (parsed.method === 'aggregate') continue
    diagnostics.push({
      start: parsed.argsStart + operator.start,
      end: parsed.argsStart + operator.end,
      message: `Unknown operator "$${operator.name}".`,
      severity: 'warning'
    })
  }

  if (parsed.method === 'query') {
    if (Array.isArray(value) || typeof value !== 'object' || value === null) {
      diagnostics.push({
        start: parsed.argsStart,
        end: parsed.argsStart + parsed.args.length,
        message: 'query() takes a filter object, for example { "age": { "$gt": 25 } }.',
        severity: 'error'
      })
    }
    return diagnostics
  }

  // aggregate() - the engine throws unless the pipeline is an array starting with $match.
  if (!Array.isArray(value)) {
    diagnostics.push({
      start: parsed.argsStart,
      end: parsed.argsStart + parsed.args.length,
      message: 'aggregate() takes an array of pipeline stages.',
      severity: 'error'
    })
    return diagnostics
  }

  if (value.length === 0) {
    diagnostics.push({
      start: parsed.argsStart,
      end: parsed.argsStart + parsed.args.length,
      message: 'Pipeline is empty. The first stage must be $match.',
      severity: 'error'
    })
    return diagnostics
  }

  if (!Object.prototype.hasOwnProperty.call(value[0] ?? {}, '$match')) {
    const firstStage = parsed.args.indexOf('{')
    const stageStart = parsed.argsStart + (firstStage === -1 ? 0 : firstStage)
    const firstKey = tokens.find((token) => token.type === 'operator')
    diagnostics.push({
      start: firstKey ? parsed.argsStart + firstKey.start : stageStart,
      end: firstKey ? parsed.argsStart + firstKey.start + firstKey.value.length : stageStart + 1,
      message: 'Pipeline must have a $match stage at top. Use [{ $match: {} }, ...] to start from every document.',
      severity: 'error'
    })
  }

  return diagnostics
}

/**
 * Decides what to offer at the caret.
 *
 * @param {string} text - Editor contents.
 * @param {number} caret - Caret offset.
 * @param {string} collectionName
 * @returns {{items: Array<object>, replaceFrom: number, prefix: string}}
 */
export function getSuggestions (text, caret, collectionName) {
  const before = text.slice(0, caret)

  // `).` - the terminal call.
  const terminalContext = /\)\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)?$/.exec(before)
  if (terminalContext) {
    const prefix = terminalContext[1] ?? ''
    return {
      items: TERMINALS.filter((t) => t.label.startsWith(prefix)),
      replaceFrom: caret - prefix.length,
      prefix
    }
  }

  // `<Collection>.` or a partly-typed method name after it.
  const methodContext = new RegExp(`${collectionName}\\s*\\.\\s*([A-Za-z_][A-Za-z0-9_]*)?$`).exec(before)
  if (methodContext) {
    const prefix = methodContext[1] ?? ''
    return {
      items: METHODS.filter((m) => m.label.startsWith(prefix)),
      replaceFrom: caret - prefix.length,
      prefix
    }
  }

  // A `$operator`, typed either bare or already inside quotes.
  const operatorContext = /"?(\$[A-Za-z]*)$/.exec(before)
  if (operatorContext) {
    const prefix = operatorContext[1]
    const pool = detectMethod(text) === 'aggregate'
      ? [...AGGREGATION_STAGES, ...QUERY_OPERATORS]
      : QUERY_OPERATORS
    const quoted = before.endsWith(prefix) && before[before.length - prefix.length - 1] === '"'
    return {
      items: pool
        .filter((item) => item.label.startsWith(prefix))
        .map((item) => (quoted ? { ...item, insert: item.label } : item)),
      replaceFrom: caret - prefix.length - (quoted ? 1 : 0),
      prefix
    }
  }

  return { items: [], replaceFrom: caret, prefix: '' }
}

/** Ctrl+Space with no prefix: offer everything that makes sense at the caret. */
export function getAllSuggestions (text, caret, collectionName) {
  const explicit = getSuggestions(text, caret, collectionName)
  if (explicit.items.length > 0) return explicit

  const method = detectMethod(text)
  if (!method) return { items: METHODS, replaceFrom: caret, prefix: '' }

  return {
    items: method === 'aggregate'
      ? [...AGGREGATION_STAGES, ...QUERY_OPERATORS]
      : QUERY_OPERATORS,
    replaceFrom: caret,
    prefix: ''
  }
}
