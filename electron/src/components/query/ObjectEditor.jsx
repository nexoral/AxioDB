import { useMemo } from 'react'
import CodeEditor from './CodeEditor'
import { validateDocument, QUERY_OPERATORS } from './queryLanguage'

const COMMON_FIELDS = [
  'name', 'title', 'email', 'status', 'role', 'type', 'age', 'price',
  'city', 'state', 'country', 'address', 'zip', 'phone',
  'description', 'isActive', 'tags', 'metadata', 'userId', 'category', 'count'
]

const COMMON_LITERALS = [
  { label: 'true', detail: 'boolean', doc: 'Boolean true', insert: 'true' },
  { label: 'false', detail: 'boolean', doc: 'Boolean false', insert: 'false' },
  { label: 'null', detail: 'null', doc: 'Null value', insert: 'null' },
  { label: 'array', detail: '[]', doc: 'Empty array literal', insert: '[]' },
  { label: 'object', detail: '{}', doc: 'Empty object literal', insert: '{\n  \n}' },
  { label: '$set', detail: 'operator', doc: 'Update operator to set fields', insert: '$set: {}' },
  { label: '$unset', detail: 'operator', doc: 'Update operator to delete fields', insert: '$unset: {}' },
  { label: '$inc', detail: 'operator', doc: 'Increment numeric field', insert: '$inc: {}' },
  { label: '$push', detail: 'operator', doc: 'Append value to array', insert: '$push: {}' }
]

const extractKeysFromText = (text) => {
  const keys = new Set()
  const regex = /(?:[{,]\s*|\n\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match[1] !== '_id' && match[1] !== 'documentId' && match[1] !== 'updatedAt') {
      keys.add(match[1])
    }
  }
  return Array.from(keys)
}

const isKeyPosition = (before) => {
  const stripped = before.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""')
  const lastColon = stripped.lastIndexOf(':')
  const lastComma = stripped.lastIndexOf(',')
  const lastBrace = stripped.lastIndexOf('{')
  const lastBracket = stripped.lastIndexOf('[')
  const lastBoundary = Math.max(lastComma, lastBrace, lastBracket)
  return lastColon <= lastBoundary
}

const getObjectSuggestions = (text, caret, fields = []) => {
  const before = text.slice(0, caret)

  // If typing an operator ($...)
  const opMatch = /"?(\$[A-Za-z]*)$/.exec(before)
  if (opMatch) {
    const prefix = opMatch[1]
    return {
      items: QUERY_OPERATORS.filter((o) => o.label.toLowerCase().startsWith(prefix.toLowerCase())),
      replaceFrom: caret - prefix.length,
      replaceTo: caret,
      prefix
    }
  }

  // If typing a property/field name or literal (supports optional leading quote)
  const idMatch = /(['"]?)([A-Za-z_][A-Za-z0-9_]*)$/.exec(before)
  if (idMatch) {
    const quoteChar = idMatch[1]
    const prefix = idMatch[2]
    const prefixLower = prefix.toLowerCase()
    const isKey = isKeyPosition(before)

    // Calculate replace range, consuming any auto-paired closing quote if present
    const replaceFrom = quoteChar ? caret - prefix.length - 1 : caret - prefix.length
    const replaceTo = quoteChar && text[caret] === quoteChar ? caret + 1 : caret

    if (isKey) {
      const candidateSet = new Set([...fields, ...extractKeysFromText(text), ...COMMON_FIELDS])
      const items = []

      candidateSet.forEach((f) => {
        if (f.toLowerCase().startsWith(prefixLower)) {
          items.push({
            label: f,
            detail: 'field',
            doc: `Document property "${f}"`,
            insert: `${f}: ""`,
            caretOffset: f.length + 3
          })
        }
      })

      if (items.length > 0) {
        return {
          items,
          replaceFrom,
          replaceTo,
          prefix
        }
      }
    } else {
      // In value position: suggest literals (true, false, null, array, object, etc.)
      const items = []
      COMMON_LITERALS.forEach((lit) => {
        if (lit.label.toLowerCase().startsWith(prefixLower)) {
          items.push(lit)
        }
      })

      if (items.length > 0) {
        return {
          items,
          replaceFrom: caret - prefix.length,
          replaceTo: caret,
          prefix
        }
      }
    }
  }

  return { items: [], replaceFrom: caret, replaceTo: caret, prefix: '' }
}

const getAllObjectSuggestions = (text, caret, fields = []) => {
  const before = text.slice(0, caret)
  const isKey = isKeyPosition(before)

  if (isKey) {
    const candidateSet = new Set([...fields, ...extractKeysFromText(text), ...COMMON_FIELDS])
    const items = Array.from(candidateSet).map((f) => ({
      label: f,
      detail: 'field',
      doc: `Document property "${f}"`,
      insert: `${f}: ""`,
      caretOffset: f.length + 3
    }))
    return { items, replaceFrom: caret, replaceTo: caret, prefix: '' }
  }

  return { items: [...COMMON_LITERALS], replaceFrom: caret, replaceTo: caret, prefix: '' }
}

/**
 * Document editor: accepts JavaScript object-literal syntax (unquoted keys, single quotes, trailing commas)
 * with full autocomplete suggestions for fields, operators, and literals.
 */
const ObjectEditor = ({
  value,
  onChange,
  onSubmit,
  fields = [],
  minHeight = 220,
  maxHeight = 320
}) => {
  const diagnostics = useMemo(() => validateDocument(value), [value])

  return (
    <CodeEditor
      value={value}
      onChange={onChange}
      diagnostics={diagnostics}
      onSubmit={onSubmit}
      suggest={(text, caret) => getObjectSuggestions(text, caret, fields)}
      suggestAll={(text, caret) => getAllObjectSuggestions(text, caret, fields)}
      minHeight={minHeight}
      maxHeight={maxHeight}
      ariaLabel='Document editor'
    />
  )
}

export default ObjectEditor
export { validateDocument }
