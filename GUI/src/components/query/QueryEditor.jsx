import CodeEditor from './CodeEditor'
import { getAllSuggestions, getSuggestions, validate } from './queryLanguage'

/**
 * The Query Console's editor: the shared {@link CodeEditor} shell bound to the query
 * language's completion and validation.
 */
const QueryEditor = ({ value, onChange, collectionName, onSubmit, diagnostics }) => (
  <CodeEditor
    value={value}
    onChange={onChange}
    diagnostics={diagnostics}
    onSubmit={onSubmit}
    ariaLabel='Query editor'
    suggest={(text, caret) => getSuggestions(text, caret, collectionName)}
    suggestAll={(text, caret) => getAllSuggestions(text, caret, collectionName)}
  />
)

export default QueryEditor
export { validate }
