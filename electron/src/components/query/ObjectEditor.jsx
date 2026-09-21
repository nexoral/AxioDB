import { useMemo } from 'react'
import CodeEditor from './CodeEditor'
import { validateDocument, QUERY_OPERATORS } from './queryLanguage'

const COMMON_FIELDS = [
  'name', 'title', 'email', 'status', 'role', 'type', 'age', 'price',
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

const getObjectSuggestions = (text, caret, fields = []) => {
  const before = text.slice(0, caret)

  // If typing an operator ($...)
  const opMatch = /"?(\$[A-Za-z]*)$/.exec(before)
  if (opMatch) {
    const prefix = opMatch[1]
    return {
      items: QUERY_OPERATORS.filter((o) => o.label.startsWith(prefix)),
      replaceFrom: caret - prefix.length,
      prefix
    }
  }

  // If typing a property/field name or literal
  const idMatch = /([A-Za-z_][A-Za-z0-9_]*)$/.exec(before)
  if (idMatch) {
    const prefix = idMatch[1]
    const candidateFields = fields && fields.length > 0 ? fields : COMMON_FIELDS
    const items = []

    candidateFields.forEach((f) => {
      if (f.startsWith(prefix)) {
        items.push({
          label: f,
          detail: 'field',
          doc: `Document property "${f}"`,
          insert: `${f}: `
        })
      }
    })

    COMMON_LITERALS.forEach((lit) => {
      if (lit.label.startsWith(prefix)) {
        items.push(lit)
      }
    })

    if (items.length > 0) {
      return {
        items,
        replaceFrom: caret - prefix.length,
        prefix
      }
    }
  }

  return { items: [], replaceFrom: caret, prefix: '' }
}

const getAllObjectSuggestions = (text, caret, fields = []) => {
  const candidateFields = fields && fields.length > 0 ? fields : COMMON_FIELDS
  const items = candidateFields.map((f) => ({
    label: f,
    detail: 'field',
    doc: `Document property "${f}"`,
    insert: `${f}: `
  }))

  items.push(...COMMON_LITERALS)
  return { items, replaceFrom: caret, prefix: '' }
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
