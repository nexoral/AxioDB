import { useMemo } from 'react'
import { formatLiteral, tokenize } from './queryLanguage'

/**
 * Read-only, syntax-highlighted rendering of a value as a JavaScript object literal.
 *
 * Shares the tokenizer and the VS Code Dark+ palette with the editors, so a document looks
 * the same whether you are reading it on a card or editing it in a dialog.
 */

const TOKEN_COLORS = {
  key: '#9cdcfe',
  operator: '#c586c0',
  string: '#ce9178',
  number: '#b5cea8',
  literal: '#569cd6',
  method: '#dcdcaa',
  identifier: '#4ec9b0',
  punctuation: '#d4d4d4',
  space: 'inherit'
}

const ObjectView = ({ value, className = '', maxHeight = 220 }) => {
  const nodes = useMemo(() => {
    const source = typeof value === 'string' ? value : formatLiteral(value)
    return tokenize(source).map((token, index) => (
      <span key={index} style={{ color: TOKEN_COLORS[token.type] ?? TOKEN_COLORS.punctuation }}>
        {token.value}
      </span>
    ))
  }, [value])

  return (
    <pre
      className={`m-0 overflow-auto rounded-lg px-3.5 py-3 text-[13px] leading-5 ${className}`}
      style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        maxHeight,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
      }}
    >
      {nodes}
    </pre>
  )
}

export default ObjectView
