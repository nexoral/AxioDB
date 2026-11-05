import CodeEditor from './CodeEditor'
import { getAllSuggestions, getSuggestions, validate } from './queryLanguage'

/**
 * The Query Console's editor: the shared {@link CodeEditor} shell bound to the query
 * language's completion, fields auto-completion, and validation.
 */
const QueryEditor = ({
  value,
  onChange,
  collectionName,
  fields = [],
  onSubmit,
  diagnostics,
  minHeight = 140,
  maxHeight = 220
}) => (
  <CodeEditor
    value={value}
    onChange={onChange}
    diagnostics={diagnostics}
    onSubmit={onSubmit}
    minHeight={minHeight}
    maxHeight={maxHeight}
    ariaLabel='Query editor'
    suggest={(text, caret) => getSuggestions(text, caret, collectionName, fields)}
    suggestAll={(text, caret) => getAllSuggestions(text, caret, collectionName, fields)}
  />
)

export default QueryEditor
export { validate }
