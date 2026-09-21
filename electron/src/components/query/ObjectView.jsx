import { useMemo } from 'react'
import { formatLiteral, tokenize } from './queryLanguage'

/**
 * Read-only, syntax-highlighted rendering of a value as a JavaScript object literal.
 * Light VS Code / GitHub Light palette for maximum readability on white backgrounds.
 */
const TOKEN_COLORS = {
  key: '#0284c7', // sky-600
  operator: '#9333ea', // purple-600
  string: '#15803d', // green-700
  number: '#b45309', // amber-700
  literal: '#0369a1', // cyan-700
  method: '#7c3aed', // violet-600
  identifier: '#0f766e', // teal-700
  punctuation: '#475569', // slate-600
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
      className={`m-0 overflow-auto rounded-lg px-3.5 py-3 text-[12px] leading-5 border border-slate-200 bg-slate-50 ${className}`}
      style={{
        color: '#0f172a',
        maxHeight,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
      }}
    >
      {nodes}
    </pre>
  )
}

export default ObjectView
