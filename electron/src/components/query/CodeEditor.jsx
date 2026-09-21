import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { tokenize } from './queryLanguage'

/** Light VS Code / GitHub Light palette */
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

const FONT = '13px/20px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const PADDING_Y = 10
const PADDING_X = 12
const GUTTER = 38
const LINE_HEIGHT = 20

const NO_SUGGESTIONS = { items: [], replaceFrom: 0, prefix: '' }

const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' }
const CLOSERS = new Set([')', ']', '}', '"', "'", '`'])
const QUOTES = new Set(['"', "'", '`'])

function useHighlighted (value, diagnostics) {
  return useMemo(
    () =>
      tokenize(value).map((token, index) => {
        const end = token.start + token.value.length
        const diagnostic = diagnostics.find((d) => d.start < end && d.end > token.start)

        return (
          <span
            key={index}
            style={{
              color: TOKEN_COLORS[token.type] ?? TOKEN_COLORS.punctuation,
              textDecoration: diagnostic ? 'underline wavy' : undefined,
              textDecorationColor: diagnostic
                ? diagnostic.severity === 'error' ? '#dc2626' : '#d97706'
                : undefined,
              textUnderlineOffset: diagnostic ? '3px' : undefined
            }}
          >
            {token.value}
          </span>
        )
      }),
    [value, diagnostics]
  )
}

const CodeEditor = ({
  value,
  onChange,
  diagnostics = [],
  onSubmit,
  suggest,
  suggestAll,
  minHeight = 170,
  maxHeight = 260,
  ariaLabel = 'Code editor'
}) => {
  const textareaRef = useRef(null)
  const highlightRef = useRef(null)
  const [suggestions, setSuggestions] = useState(NO_SUGGESTIONS)
  const [activeIndex, setActiveIndex] = useState(0)
  const [caret, setCaret] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)

  const highlighted = useHighlighted(value, diagnostics)
  const lineCount = useMemo(() => value.split('\n').length, [value])

  useLayoutEffect(() => {
    if (highlightRef.current) highlightRef.current.scrollTop = scrollTop
  }, [scrollTop])

  useEffect(() => setActiveIndex(0), [suggestions.items])

  const closeSuggestions = () => setSuggestions(NO_SUGGESTIONS)

  const refreshSuggestions = (text, position) => {
    setSuggestions(suggest ? suggest(text, position) : NO_SUGGESTIONS)
  }

  const handleChange = (event) => {
    const next = event.target.value
    const position = event.target.selectionStart
    onChange(next)
    setCaret(position)
    refreshSuggestions(next, position)
  }

  const applySuggestion = (item) => {
    const next = value.slice(0, suggestions.replaceFrom) + item.insert + value.slice(caret)
    const caretTarget = suggestions.replaceFrom + (item.caretOffset ?? item.insert.length)

    onChange(next)
    closeSuggestions()

    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(caretTarget, caretTarget)
      setCaret(caretTarget)
    })
  }

  const handleKeyDown = (event) => {
    const open = suggestions.items.length > 0

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      closeSuggestions()
      return
    }

    if (open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault()
      const delta = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => {
        const next = current + delta
        if (next < 0) return suggestions.items.length - 1
        if (next >= suggestions.items.length) return 0
        return next
      })
      return
    }

    if (open && (event.key === 'Enter' || event.key === 'Tab')) {
      event.preventDefault()
      applySuggestion(suggestions.items[activeIndex])
      return
    }

    if (event.code === 'Space' && (event.ctrlKey || event.metaKey) && suggestAll) {
      event.preventDefault()
      const position = event.target.selectionStart
      setCaret(position)
      setSuggestions(suggestAll(value, position))
      return
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      onSubmit?.()
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      const start = event.target.selectionStart
      const next = value.slice(0, start) + '  ' + value.slice(event.target.selectionEnd)
      onChange(next)
      requestAnimationFrame(() => textareaRef.current?.setSelectionRange(start + 2, start + 2))
      return
    }

    const start = event.target.selectionStart
    const end = event.target.selectionEnd
    const setCaretTo = (from, to = from) =>
      requestAnimationFrame(() => textareaRef.current?.setSelectionRange(from, to))

    if (CLOSERS.has(event.key) && start === end && value[start] === event.key) {
      event.preventDefault()
      setCaret(start + 1)
      setCaretTo(start + 1)
      return
    }

    if (Object.prototype.hasOwnProperty.call(PAIRS, event.key)) {
      const close = PAIRS[event.key]

      if (start !== end) {
        event.preventDefault()
        const selected = value.slice(start, end)
        onChange(`${value.slice(0, start)}${event.key}${selected}${close}${value.slice(end)}`)
        setCaretTo(start + 1, end + 1)
        return
      }

      const previous = value[start - 1] ?? ''
      if (QUOTES.has(event.key) && /[A-Za-z0-9_$]/.test(previous)) return

      event.preventDefault()
      onChange(`${value.slice(0, start)}${event.key}${close}${value.slice(start)}`)
      setCaret(start + 1)
      setCaretTo(start + 1)
      return
    }

    if (event.key === 'Backspace' && start === end && start > 0) {
      const before = value[start - 1]
      if (PAIRS[before] && value[start] === PAIRS[before]) {
        event.preventDefault()
        onChange(value.slice(0, start - 1) + value.slice(start + 1))
        setCaret(start - 1)
        setCaretTo(start - 1)
      }
    }
  }

  const handleSelect = (event) => {
    const position = event.target.selectionStart
    setCaret(position)
    if (suggestions.items.length > 0) refreshSuggestions(value, position)
  }

  const caretLine = value.slice(0, suggestions.replaceFrom).split('\n').length - 1
  const caretColumn =
    suggestions.replaceFrom - (value.lastIndexOf('\n', suggestions.replaceFrom - 1) + 1)
  const popupTop = PADDING_Y + (caretLine + 1) * LINE_HEIGHT - scrollTop + 4
  const popupLeft = Math.min(GUTTER + PADDING_X + caretColumn * 7.22, 340)

  const layerStyle = {
    font: FONT,
    padding: `${PADDING_Y}px ${PADDING_X}px`,
    paddingLeft: GUTTER + PADDING_X
  }

  return (
    <div className='relative'>
      <div
        className='relative overflow-hidden rounded-lg border border-slate-200 shadow-xs bg-slate-50'
      >
        {/* Line-number gutter */}
        <div
          aria-hidden='true'
          className='absolute bottom-0 left-0 top-0 select-none text-right'
          style={{
            width: GUTTER,
            padding: `${PADDING_Y}px 8px 0 0`,
            font: FONT,
            color: '#94a3b8',
            background: '#f1f5f9',
            borderRight: '1px solid #e2e8f0',
            zIndex: 2
          }}
        >
          <div style={{ transform: `translateY(-${scrollTop}px)` }}>
            {Array.from({ length: lineCount }, (_, index) => (
              <div key={index} style={{ height: LINE_HEIGHT }}>{index + 1}</div>
            ))}
          </div>
        </div>

        {/* Colour layer */}
        <pre
          ref={highlightRef}
          aria-hidden='true'
          className='m-0 overflow-hidden whitespace-pre-wrap break-words'
          style={{ ...layerStyle, minHeight, maxHeight, color: '#0f172a' }}
        >
          {highlighted}
          {'\n'}
        </pre>

        {/* Input layer */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onScroll={(event) => setScrollTop(event.target.scrollTop)}
          onBlur={() => setTimeout(closeSuggestions, 120)}
          spellCheck='false'
          autoComplete='off'
          autoCorrect='off'
          autoCapitalize='off'
          aria-label={ariaLabel}
          className='absolute inset-0 resize-none overflow-auto whitespace-pre-wrap break-words bg-transparent outline-none'
          style={{ ...layerStyle, color: 'transparent', caretColor: '#0f172a' }}
        />

        {/* Completion popup */}
        {suggestions.items.length > 0 && (
          <div
            className='absolute z-20 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl'
            style={{
              top: popupTop,
              left: popupLeft,
              width: 320
            }}
          >
            <ul className='max-h-48 overflow-y-auto py-1'>
              {suggestions.items.map((item, index) => (
                <li key={item.label}>
                  <button
                    type='button'
                    onMouseDown={(event) => {
                      event.preventDefault()
                      applySuggestion(item)
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className='flex w-full items-baseline gap-2 px-3 py-1 text-left transition-colors'
                    style={{
                      font: FONT,
                      background: index === activeIndex ? '#ecfdf5' : 'transparent',
                      color: index === activeIndex ? '#059669' : '#1e293b'
                    }}
                  >
                    <span style={{ color: '#0284c7' }}>{item.label}</span>
                    <span className='truncate text-xs text-slate-400'>
                      {item.detail}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {diagnostics.length > 0 && (
        <ul className='mt-2 space-y-1'>
          {diagnostics.map((diagnostic, index) => (
            <li
              key={index}
              className={`flex items-start gap-2 rounded-md border px-3 py-1.5 text-xs ${
                diagnostic.severity === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <span className='mt-px font-bold'>
                {diagnostic.severity === 'error' ? '✕' : '!'}
              </span>
              <span className='font-mono leading-relaxed'>{diagnostic.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default CodeEditor
