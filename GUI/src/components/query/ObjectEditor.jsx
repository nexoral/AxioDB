import { useMemo } from 'react'
import CodeEditor from './CodeEditor'
import { validateDocument } from './queryLanguage'

/**
 * Document editor: the shared {@link CodeEditor} shell with object-literal validation and
 * no completion - there is no vocabulary to suggest for a document's own field names, and
 * suggesting them would mean reading your data.
 *
 * Accepts JavaScript object-literal syntax, so a document reads the same here as it would in
 * a .js file: unquoted keys, single quotes, trailing commas.
 */
const ObjectEditor = ({ value, onChange, onSubmit, minHeight = 220, maxHeight = 320 }) => {
  const diagnostics = useMemo(() => validateDocument(value), [value])

  return (
    <CodeEditor
      value={value}
      onChange={onChange}
      diagnostics={diagnostics}
      onSubmit={onSubmit}
      minHeight={minHeight}
      maxHeight={maxHeight}
      ariaLabel='Document editor'
    />
  )
}

export default ObjectEditor
export { validateDocument }
