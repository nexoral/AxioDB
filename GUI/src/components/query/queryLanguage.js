/**
 * Parser, validator, and autocomplete engine for the AxioDB Query Console.
 * Supports chaining:
 *   COL.query({...}).Limit(20).Skip(0).Sort({ updatedAt: -1 }).project({ name: 1 }).exec()
 *   COL.aggregate([{ $match: {} }, ...]).exec()
 *   COL.update({...}).Sort({...}).UpdateOne({...}) / UpdateMany({...})
 *   COL.delete({...}).Sort({...}).deleteOne() / deleteMany()
 */

/** Root methods on collection */
export const METHODS = [
  {
    label: 'query',
    detail: '(filter) → Reader',
    doc: 'Find documents matching a filter object. Can chain .Limit(), .Skip(), .Sort(), .project(), .exec() in any order.',
    insert: 'query({}).exec()',
    caretOffset: 7
  },
  {
    label: 'aggregate',
    detail: '(pipeline) → Aggregation',
    doc: 'Run an aggregation pipeline array. The first stage must be a $match stage.',
    insert: 'aggregate([{ $match: {} }]).exec()',
    caretOffset: 22
  },
  {
    label: 'update',
    detail: '(filter) → UpdateOperation',
    doc: 'Target documents for update. Follow with .UpdateOne(data) or .UpdateMany(data).',
    insert: 'update({}).UpdateOne({})',
    caretOffset: 8
  },
  {
    label: 'delete',
    detail: '(filter) → DeleteOperation',
    doc: 'Target documents for deletion. Follow with .deleteOne() or .deleteMany().',
    insert: 'delete({}).deleteOne()',
    caretOffset: 8
  }
]

/** Query chaining methods */
export const QUERY_CHAIN_METHODS = [
  { label: 'Limit', detail: '(count) → Reader', doc: 'Maximum number of documents to return.', insert: 'Limit(20)', caretOffset: 6 },
  { label: 'Skip', detail: '(offset) → Reader', doc: 'Number of documents to skip before returning results.', insert: 'Skip(0)', caretOffset: 5 },
  { label: 'Sort', detail: '({ field: 1|-1 }) → Reader', doc: 'Sort results: 1 for ascending, -1 for descending.', insert: 'Sort({ updatedAt: -1 })', caretOffset: 5 },
  { label: 'project', detail: '({ field: 1|0 }) → Reader', doc: 'Specify fields to include (1) or exclude (0).', insert: 'project({})', caretOffset: 8 },
  { label: 'exec', detail: '() → Promise<result>', doc: 'Execute the query against the database.', insert: 'exec()' }
]

/** Update chaining methods */
export const UPDATE_CHAIN_METHODS = [
  { label: 'Sort', detail: '({ field: 1|-1 }) → UpdateOperation', doc: 'Sort order when selecting document to update.', insert: 'Sort({ updatedAt: -1 })', caretOffset: 5 },
  { label: 'UpdateOne', detail: '(updateData) → Promise<result>', doc: 'Update the first matching document.', insert: 'UpdateOne({})', caretOffset: 10 },
  { label: 'UpdateMany', detail: '(updateData) → Promise<result>', doc: 'Update all matching documents.', insert: 'UpdateMany({})', caretOffset: 11 }
]

/** Delete chaining methods */
export const DELETE_CHAIN_METHODS = [
  { label: 'Sort', detail: '({ field: 1|-1 }) → DeleteOperation', doc: 'Sort order when selecting document to delete.', insert: 'Sort({ updatedAt: -1 })', caretOffset: 5 },
  { label: 'deleteOne', detail: '() → Promise<result>', doc: 'Delete the first matching document.', insert: 'deleteOne()' },
  { label: 'deleteMany', detail: '() → Promise<result>', doc: 'Delete all matching documents.', insert: 'deleteMany()' }
]

/** Terminal calls across all workflows */
export const TERMINALS = [
  { label: 'exec', detail: '() → Promise<result>', doc: 'Executes the reader/aggregation chain.', insert: 'exec()' },
  { label: 'UpdateOne', detail: '(updateData) → Promise<result>', doc: 'Update the first matching document.', insert: 'UpdateOne({})', caretOffset: 10 },
  { label: 'UpdateMany', detail: '(updateData) → Promise<result>', doc: 'Update all matching documents.', insert: 'UpdateMany({})', caretOffset: 11 },
  { label: 'deleteOne', detail: '() → Promise<result>', doc: 'Delete the first matching document.', insert: 'deleteOne()' },
  { label: 'deleteMany', detail: '() → Promise<result>', doc: 'Delete all matching documents.', insert: 'deleteMany()' }
]

/** Query filter operators */
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
  { label: '$exists', detail: 'field present', doc: 'Matches documents where the field does or does not exist.', insert: '$exists: true' },
  { label: '$type', detail: 'value type', doc: 'Matches values of the given JavaScript type ("string", "number", etc.).', insert: "$type: 'string'" },
  { label: '$regex', detail: 'pattern match', doc: 'Matches strings against a regular expression. Pair with $options.', insert: "$regex: ''" },
  { label: '$options', detail: 'regex flags', doc: 'Flags for a sibling $regex (e.g., "i").', insert: "$options: 'i'" },
  { label: '$elemMatch', detail: 'array element match', doc: 'Matches arrays with at least one element matching all conditions.', insert: '$elemMatch: {}' },
  { label: '$not', detail: 'negate', doc: 'Inverts the enclosed condition.', insert: '$not: {}' },
  { label: '$and', detail: 'all of', doc: 'Every condition in the array must match.', insert: '$and: []' },
  { label: '$or', detail: 'any of', doc: 'At least one condition in the array must match.', insert: '$or: []' },
  { label: '$nor', detail: 'none of', doc: 'No condition in the array may match.', insert: '$nor: []' }
]

/** Aggregation pipeline stages and accumulators */
export const AGGREGATION_STAGES = [
  { label: '$match', detail: 'filter stage', doc: 'Filters documents. Pipeline must start with $match.', insert: '$match: {}' },
  { label: '$group', detail: 'group stage', doc: 'Groups documents by _id and computes accumulators.', insert: "$group: { _id: '$field' }" },
  { label: '$sort', detail: 'order stage', doc: 'Orders documents by field: 1 ascending, -1 descending.', insert: '$sort: {}' },
  { label: '$project', detail: 'shape stage', doc: 'Include (1), exclude (0), or compute new fields.', insert: '$project: {}' },
  { label: '$limit', detail: 'cap stage', doc: 'Keeps at most N documents.', insert: '$limit: 10' },
  { label: '$skip', detail: 'offset stage', doc: 'Discards the first N documents.', insert: '$skip: 0' },
  { label: '$unwind', detail: 'flatten stage', doc: 'Deconstructs an array field from input documents.', insert: "$unwind: '$field'" },
  { label: '$addFields', detail: 'add fields stage', doc: 'Adds new fields to documents.', insert: '$addFields: {}' },
  { label: '$set', detail: 'alias for $addFields', doc: 'Alias for $addFields.', insert: '$set: {}' },
  { label: '$unset', detail: 'remove fields', doc: 'Removes fields from documents.', insert: "$unset: ['field']" },
  { label: '$lookup', detail: 'join stage', doc: 'Performs a left outer join to an unsharded collection in the same database.', insert: "$lookup: { from: 'col', localField: 'id', foreignField: 'id', as: 'joined' }" },
  { label: '$count', detail: 'count stage', doc: 'Counts the number of documents input to the stage.', insert: "$count: 'total'" },
  { label: '$sum', detail: 'accumulator', doc: 'Calculates the sum of numeric values, or counts with 1.', insert: '$sum: 1' },
  { label: '$avg', detail: 'accumulator', doc: 'Returns the average value of numeric values.', insert: "$avg: '$field'" },
  { label: '$min', detail: 'accumulator', doc: 'Returns the lowest value in a group.', insert: "$min: '$field'" },
  { label: '$max', detail: 'accumulator', doc: 'Returns the highest value in a group.', insert: "$max: '$field'" },
  { label: '$first', detail: 'accumulator', doc: 'Returns the first document value in each group.', insert: "$first: '$field'" },
  { label: '$last', detail: 'accumulator', doc: 'Returns the last document value in each group.', insert: "$last: '$field'" },
  { label: '$push', detail: 'accumulator', doc: 'Returns an array of all values that result from applying an expression to each document in a group.', insert: "$push: '$field'" },
  { label: '$addToSet', detail: 'accumulator', doc: 'Returns an array of all unique values in a group.', insert: "$addToSet: '$field'" }
]

const QUERY_OPERATOR_NAMES = new Set(QUERY_OPERATORS.map((o) => o.label))
const AGGREGATION_NAMES = new Set(AGGREGATION_STAGES.map((s) => s.label))

/**
 * Tokenize string into syntax-colored segments.
 */
export function tokenize (text) {
  const tokens = []
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (/\s/.test(char)) {
      let space = ''
      while (i < text.length && /\s/.test(text[i])) space += text[i++]
      tokens.push({ type: 'space', value: space, start: i - space.length })
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      const quote = char
      let str = quote
      i++
      while (i < text.length && text[i] !== quote) {
        if (text[i] === '\\' && i + 1 < text.length) { str += text[i++]; str += text[i++] }
        else { str += text[i++] }
      }
      if (i < text.length) str += text[i++]
      tokens.push({ type: 'string', value: str, start: i - str.length })
      continue
    }

    if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(text[i + 1] ?? ''))) {
      let num = ''
      if (char === '-') num += text[i++]
      while (i < text.length && /[0-9.]/.test(text[i])) num += text[i++]
      tokens.push({ type: 'number', value: num, start: i - num.length })
      continue
    }

    if (char === '$') {
      let op = '$'
      i++
      while (i < text.length && /[A-Za-z0-9_]/.test(text[i])) op += text[i++]
      tokens.push({ type: 'operator', value: op, start: i - op.length })
      continue
    }

    if (/[A-Za-z_]/.test(char)) {
      let word = ''
      while (i < text.length && /[A-Za-z0-9_]/.test(text[i])) word += text[i++]
      if (word === 'true' || word === 'false' || word === 'null') {
        tokens.push({ type: 'literal', value: word, start: i - word.length })
      } else {
        tokens.push({ type: 'identifier', value: word, start: i - word.length })
      }
      continue
    }

    tokens.push({ type: 'punctuation', value: char, start: i })
    i++
  }

  for (let t = 0; t < tokens.length; t++) {
    const cur = tokens[t]
    if (cur.type === 'string' || cur.type === 'identifier') {
      let next = t + 1
      while (next < tokens.length && tokens[next].type === 'space') next++
      if (tokens[next]?.value === ':') {
        cur.type = 'key'
      } else if (tokens[next]?.value === '(') {
        cur.type = 'method'
      }
    }
  }

  return tokens
}

/**
 * Finds index of closing paren matching an open paren.
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

/** Error class for literal syntax parsing */
export class LiteralSyntaxError extends Error {
  constructor (message, offset) {
    super(message)
    this.name = 'LiteralSyntaxError'
    this.offset = offset
  }
}

/**
 * Parses JS object literal text into a JavaScript value without eval.
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
      } else {
        out += text[pos++]
      }
    }
    if (pos >= text.length) fail('Unclosed string literal')
    pos++
    return out
  }

  const parseNumber = () => {
    const start = pos
    if (text[pos] === '-') pos++
    while (pos < text.length && /[0-9]/.test(text[pos])) pos++
    if (text[pos] === '.') {
      pos++
      while (pos < text.length && /[0-9]/.test(text[pos])) pos++
    }
    const raw = text.slice(start, pos)
    const num = Number(raw)
    if (Number.isNaN(num)) fail(`Invalid number "${raw}"`)
    return num
  }

  const parseKey = () => {
    skipSpace()
    if (pos >= text.length) fail('Expected object key')
    const char = text[pos]
    if (char === '"' || char === "'" || char === '`') return parseString()
    const start = pos
    while (pos < text.length && /[A-Za-z0-9_$-]/.test(text[pos])) pos++
    if (start === pos) fail('Expected property name')
    return text.slice(start, pos)
  }

  const parseObject = () => {
    pos++ // '{'
    const obj = {}
    skipSpace()
    if (text[pos] === '}') { pos++; return obj }

    while (pos < text.length) {
      skipSpace()
      if (text[pos] === '}') { pos++; return obj }
      const key = parseKey()
      skipSpace()
      if (text[pos] !== ':') fail('Expected ":" after property name')
      pos++
      const val = parseValue()
      obj[key] = val
      skipSpace()
      if (text[pos] === ',') {
        pos++
        skipSpace()
        if (text[pos] === '}') { pos++; return obj }
        continue
      }
      if (text[pos] === '}') { pos++; return obj }
      fail('Expected "," or "}"')
    }
    fail('Unclosed object literal')
  }

  const parseArray = () => {
    pos++ // '['
    const arr = []
    skipSpace()
    if (text[pos] === ']') { pos++; return arr }

    while (pos < text.length) {
      arr.push(parseValue())
      skipSpace()
      if (text[pos] === ',') {
        pos++
        skipSpace()
        if (text[pos] === ']') { pos++; return arr }
        continue
      }
      if (text[pos] === ']') { pos++; return arr }
      fail('Expected "," or "]"')
    }
    fail('Unclosed array literal')
  }

  const parseValue = () => {
    skipSpace()
    if (pos >= text.length) fail('Expected a value')
    const char = text[pos]

    if (char === '{') return parseObject()
    if (char === '[') return parseArray()
    if (char === '"' || char === "'" || char === '`') return parseString()
    if (/[0-9]/.test(char) || (char === '-' && /[0-9]/.test(text[pos + 1] ?? ''))) return parseNumber()
    if (text.startsWith('true', pos)) { pos += 4; return true }
    if (text.startsWith('false', pos)) { pos += 5; return false }
    if (text.startsWith('null', pos)) { pos += 4; return null }
    if (text.startsWith('undefined', pos)) { pos += 9; return undefined }

    fail(`Unexpected "${char}"`)
  }

  skipSpace()
  if (pos >= text.length) throw new LiteralSyntaxError('Expected a value', 0)
  const val = parseValue()
  skipSpace()
  if (pos < text.length) fail(`Unexpected "${text[pos]}" after value`)
  return val
}

/**
 * Parses a full chain expression like:
 *   COL.query({...}).Limit(20).Skip(5).Sort({...}).exec()
 *   COL.update({...}).UpdateOne({...})
 *   COL.delete({...}).deleteOne()
 *   COL.aggregate([...]).exec()
 */
export function parseExpression (text) {
  const rootMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(text)
  if (!rootMatch) return null

  const collection = rootMatch[1]
  const rootMethod = rootMatch[2]
  const openParen = rootMatch[0].length - 1
  const closeParen = findMatchingParen(text, openParen)
  if (closeParen === -1) return null

  const rootArgs = text.slice(openParen + 1, closeParen)
  const chain = [{ name: rootMethod, args: rootArgs, argsStart: openParen + 1, argsEnd: closeParen }]

  let pos = closeParen + 1
  let terminalCall = null

  while (pos < text.length) {
    const nextCallMatch = /^\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(text.slice(pos))
    if (!nextCallMatch) break

    const callName = nextCallMatch[1]
    const callOpen = pos + nextCallMatch[0].length - 1
    const callClose = findMatchingParen(text, callOpen)
    if (callClose === -1) break

    const callArgs = text.slice(callOpen + 1, callClose)
    chain.push({ name: callName, args: callArgs, argsStart: callOpen + 1, argsEnd: callClose })
    pos = callClose + 1

    if (['exec', 'UpdateOne', 'UpdateMany', 'deleteOne', 'deleteMany'].includes(callName)) {
      terminalCall = callName
    }
  }

  const tail = text.slice(pos).trim()

  return {
    collection,
    rootMethod,
    method: rootMethod,
    args: rootArgs,
    argsStart: openParen + 1,
    chain,
    terminalCall,
    hasExec: terminalCall === 'exec',
    hasTerminal: Boolean(terminalCall),
    tail,
    tailStart: pos
  }
}

/**
 * Detects the root method currently being typed.
 */
function detectRootMethod (text) {
  return /^\s*[A-Za-z_][A-Za-z0-9_]*\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(text)?.[1] ?? null
}

/**
 * Validates the expression and returns VS Code-style diagnostics.
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
      message: `Expected ${collectionName}.query({ ... }).exec() or .aggregate([ ... ]).exec()`,
      severity: 'error'
    })
    return diagnostics
  }

  // Validate collection name
  if (parsed.collection !== collectionName) {
    const nameStart = text.indexOf(parsed.collection)
    diagnostics.push({
      start: nameStart,
      end: nameStart + parsed.collection.length,
      message: `Unknown collection "${parsed.collection}". This console is bound to "${collectionName}".`,
      severity: 'error'
    })
  }

  // Validate root method
  const validRoots = ['query', 'aggregate', 'update', 'delete']
  if (!validRoots.includes(parsed.rootMethod)) {
    const rootStart = text.indexOf(parsed.rootMethod)
    diagnostics.push({
      start: rootStart,
      end: rootStart + parsed.rootMethod.length,
      message: `"${parsed.rootMethod}" is not a valid collection method. Use query, aggregate, update, or delete.`,
      severity: 'error'
    })
    return diagnostics
  }

  // Validate chain methods
  const queryAllowed = ['Limit', 'Skip', 'Sort', 'project', 'exec']
  const updateAllowed = ['Sort', 'UpdateOne', 'UpdateMany']
  const deleteAllowed = ['Sort', 'deleteOne', 'deleteMany']

  for (let i = 1; i < parsed.chain.length; i++) {
    const call = parsed.chain[i]
    let allowed = []
    if (parsed.rootMethod === 'query') allowed = queryAllowed
    else if (parsed.rootMethod === 'aggregate') allowed = ['exec']
    else if (parsed.rootMethod === 'update') allowed = updateAllowed
    else if (parsed.rootMethod === 'delete') allowed = deleteAllowed

    if (!allowed.includes(call.name)) {
      const callStart = text.indexOf(call.name, parsed.chain[i - 1].argsEnd)
      diagnostics.push({
        start: callStart !== -1 ? callStart : 0,
        end: callStart !== -1 ? callStart + call.name.length : text.length,
        message: `Cannot call .${call.name}() on ${parsed.rootMethod}(). Allowed: ${allowed.map((m) => `.${m}()`).join(', ')}`,
        severity: 'error'
      })
    }
  }

  // Check terminal call
  if (!parsed.hasTerminal) {
    let expected = '.exec()'
    if (parsed.rootMethod === 'update') expected = '.UpdateOne(...) or .UpdateMany(...)'
    else if (parsed.rootMethod === 'delete') expected = '.deleteOne() or .deleteMany()'

    diagnostics.push({
      start: parsed.tailStart,
      end: text.length,
      message: `Missing terminal call (${expected}) to execute the operation.`,
      severity: 'error'
    })
  }

  // Validate root argument literal
  let rootValue
  try {
    rootValue = parseLiteral(parsed.args || '{}')
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

  // Method-specific validations
  if (parsed.rootMethod === 'aggregate') {
    if (!Array.isArray(rootValue)) {
      diagnostics.push({
        start: parsed.argsStart,
        end: parsed.argsStart + parsed.args.length,
        message: 'aggregate() takes an array of pipeline stages: [ { $match: { ... } }, ... ]',
        severity: 'error'
      })
      return diagnostics
    }
    if (rootValue.length === 0 || !Object.prototype.hasOwnProperty.call(rootValue[0] ?? {}, '$match')) {
      diagnostics.push({
        start: parsed.argsStart,
        end: parsed.argsStart + parsed.args.length,
        message: 'Aggregation pipeline must begin with a $match stage. Example: [{ $match: {} }]',
        severity: 'error'
      })
    }
  } else if (['query', 'update', 'delete'].includes(parsed.rootMethod)) {
    if (Array.isArray(rootValue) || typeof rootValue !== 'object' || rootValue === null) {
      diagnostics.push({
        start: parsed.argsStart,
        end: parsed.argsStart + parsed.args.length,
        message: `${parsed.rootMethod}() takes a filter object. Example: { status: 'active' }`,
        severity: 'error'
      })
    }
  }

  return diagnostics
}

/**
 * Suggestions for autocomplete at caret.
 */
export function getSuggestions (text, caret, collectionName, fields = []) {
  const before = text.slice(0, caret)

  // `).` - Chained method suggestions
  const chainedMatch = /\)\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)?$/.exec(before)
  if (chainedMatch) {
    const prefix = (chainedMatch[1] ?? '').toLowerCase()
    const root = detectRootMethod(text)
    let candidates = QUERY_CHAIN_METHODS

    if (root === 'update') candidates = UPDATE_CHAIN_METHODS
    else if (root === 'delete') candidates = DELETE_CHAIN_METHODS
    else if (root === 'aggregate') candidates = [{ label: 'exec', detail: '() → Promise', doc: 'Execute aggregation pipeline', insert: 'exec()' }]

    return {
      items: candidates.filter((c) => c.label.toLowerCase().startsWith(prefix)),
      replaceFrom: caret - (chainedMatch[1] ?? '').length,
      prefix: chainedMatch[1] ?? ''
    }
  }

  // `<Collection>.` - Root methods
  const rootMatch = new RegExp(`(?:${collectionName}|[A-Za-z_][A-Za-z0-9_]*)\\s*\\.\\s*([A-Za-z_][A-Za-z0-9_]*)?$`).exec(before)
  if (rootMatch) {
    const prefix = (rootMatch[1] ?? '').toLowerCase()
    return {
      items: METHODS.filter((m) => m.label.toLowerCase().startsWith(prefix)),
      replaceFrom: caret - (rootMatch[1] ?? '').length,
      prefix: rootMatch[1] ?? ''
    }
  }

  // `$operator` inside objects
  const opMatch = /"?(\$[A-Za-z0-9_]*)$/.exec(before)
  if (opMatch) {
    const prefix = opMatch[1]
    const root = detectRootMethod(text)
    const pool = root === 'aggregate'
      ? [...AGGREGATION_STAGES, ...QUERY_OPERATORS]
      : QUERY_OPERATORS
    const quoted = before.endsWith(prefix) && before[before.length - prefix.length - 1] === '"'

    return {
      items: pool
        .filter((item) => item.label.toLowerCase().startsWith(prefix.toLowerCase()))
        .map((item) => (quoted ? { ...item, insert: item.label } : item)),
      replaceFrom: caret - prefix.length - (quoted ? 1 : 0),
      prefix
    }
  }

  // Property identifier autocomplete from fields
  const idMatch = /([A-Za-z_][A-Za-z0-9_]*)$/.exec(before)
  if (idMatch && fields && fields.length > 0) {
    const prefix = idMatch[1].toLowerCase()
    const matches = fields
      .filter((f) => f.toLowerCase().startsWith(prefix))
      .map((f) => ({
        label: f,
        detail: 'field',
        doc: `Collection field "${f}"`,
        insert: `${f}: `
      }))
    if (matches.length > 0) {
      return {
        items: matches,
        replaceFrom: caret - idMatch[1].length,
        prefix: idMatch[1]
      }
    }
  }

  return { items: [], replaceFrom: caret, prefix: '' }
}

/**
 * Ctrl+Space fallback suggestions
 */
export function getAllSuggestions (text, caret, collectionName, fields = []) {
  const explicit = getSuggestions(text, caret, collectionName, fields)
  if (explicit.items.length > 0) return explicit

  const before = text.slice(0, caret)
  if (/\)\s*\.?$/.test(before)) {
    const root = detectRootMethod(text)
    let candidates = QUERY_CHAIN_METHODS
    if (root === 'update') candidates = UPDATE_CHAIN_METHODS
    else if (root === 'delete') candidates = DELETE_CHAIN_METHODS
    else if (root === 'aggregate') candidates = [{ label: 'exec', detail: '() → Promise', doc: 'Execute aggregation pipeline', insert: 'exec()' }]
    return { items: candidates, replaceFrom: caret, prefix: '' }
  }

  const root = detectRootMethod(text)
  if (!root) return { items: METHODS, replaceFrom: caret, prefix: '' }

  const items = root === 'aggregate'
    ? [...AGGREGATION_STAGES, ...QUERY_OPERATORS]
    : [...QUERY_OPERATORS]

  if (fields && fields.length > 0) {
    fields.forEach((f) => {
      items.push({
        label: f,
        detail: 'field',
        doc: `Collection field "${f}"`,
        insert: `${f}: `
      })
    })
  }

  return { items, replaceFrom: caret, prefix: '' }
}

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/**
 * Renders a value as a JavaScript object literal - the inverse of parseLiteral.
 */
export function formatLiteral (value, indent = 2) {
  const pad = (depth) => ' '.repeat(indent * depth)

  const render = (node, depth) => {
    if (node === null) return 'null'
    if (node === undefined) return 'undefined'

    const type = typeof node
    if (type === 'number' || type === 'boolean') return String(node)
    if (type === 'string') {
      const escaped = node.replace(/\\/g, '\\\\').replace(/\n/g, '\\n')
      return escaped.includes("'")
        ? `"${escaped.replace(/"/g, '\\"')}"`
        : `'${escaped}'`
    }

    if (Array.isArray(node)) {
      if (node.length === 0) return '[]'
      const items = node.map((item) => `${pad(depth + 1)}${render(item, depth + 1)}`)
      return `[\n${items.join(',\n')}\n${pad(depth)}]`
    }

    if (type === 'object') {
      const entries = Object.entries(node)
      if (entries.length === 0) return '{}'
      const rendered = entries.map(([key, item]) => {
        const safeKey = IDENTIFIER.test(key) ? key : `'${key}'`
        return `${pad(depth + 1)}${safeKey}: ${render(item, depth + 1)}`
      })
      return `{\n${rendered.join(',\n')}\n${pad(depth)}}`
    }

    return String(node)
  }

  return render(value, 0)
}

/**
 * Validates a standalone document literal.
 */
export function validateDocument (text) {
  if (!text.trim()) {
    return [{ start: 0, end: 0, message: 'Document is empty.', severity: 'error' }]
  }

  let value
  try {
    value = parseLiteral(text)
  } catch (error) {
    const start = Math.min(error.offset ?? 0, Math.max(text.length - 1, 0))
    return [{ start, end: start + 1, message: error.message, severity: 'error' }]
  }

  if (Array.isArray(value) || typeof value !== 'object' || value === null) {
    return [{
      start: 0,
      end: text.length,
      message: 'A document must be an object, for example { name: \'Ankan\' }.',
      severity: 'error'
    }]
  }

  return ['documentId', 'updatedAt']
    .filter((field) => Object.prototype.hasOwnProperty.call(value, field))
    .map((field) => {
      const at = Math.max(text.indexOf(field), 0)
      return {
        start: at,
        end: at + field.length,
        message: `"${field}" is managed by AxioDB and is ignored here.`,
        severity: 'warning'
      }
    })
}

