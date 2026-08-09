import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  getAllSuggestions,
  getSuggestions,
  tokenize,
  validate
} from './queryLanguage'

/**
 * A small syntax-highlighting editor built on a transparent <textarea> layered over a
 * coloured <pre>. The textarea keeps native caret, selection, undo, and IME behaviour;
 * the <pre> underneath supplies the colour. Both use identical font metrics and padding,
 * so the two layers stay aligned - that alignment is the whole trick, and any padding
 * change has to be made in both places.
 *
 * Deliberately not Monaco/CodeMirror: this needs ~6 token types and one popup, which is
 * far less code than the ~300KB those pull in.
 */

/** VS Code Dark+ palette. */
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

const FONT = '13px/20px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const PADDING_Y = 12
const PADDING_X = 14
const GUTTER = 40
const LINE_HEIGHT = 20

/** Splits text into per-line coloured spans, so diagnostics can underline exact ranges. */
function useHighlighted (value, diagnostics) {
  return useMemo(() => {
    const tokens = tokenize(value)
    const nodes = []

    tokens.forEach((token, index) => {
      const end = token.start + token.value.length
      const diagnostic = diagnostics.find((d) => d.start < end && d.end > token.start)
      const color = TOKEN_COLORS[token.type] ?? TOKEN_COLORS.punctuation

      nodes.push(
        <span
          key={index}
          style={{
            color,
            textDecoration: diagnostic ? 'underline wavy' : undefined,
            textDecorationColor: diagnostic
              ? diagnostic.severity === 'error' ? '#f14c4c' : '#cca700'
              : undefined,
            textUnderlineOffset: diagnostic ? '3px' : undefined
          }}
        >
          {token.value}
        </span>
      )
    })

    return nodes
  }, [value, diagnostics])
}

const QueryEditor = ({ value, onChange, collectionName, onSubmit, diagnostics }) => {
  const textareaRef = useRef(null)
  const highlightRef = useRef(null)
  const [suggestions, setSuggestions] = useState({ items: [], replaceFrom: 0, prefix: '' })
  const [activeIndex, setActiveIndex] = useState(0)
  const [caret, setCaret] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)

  const highlighted = useHighlighted(value, diagnostics)
  const lineCount = useMemo(() => value.split('\n').length, [value])

  // Keep the colour layer scrolled exactly with the textarea.
  useLayoutEffect(() => {
    if (highlightRef.current) highlightRef.current.scrollTop = scrollTop
  }, [scrollTop])

  useEffect(() => {
    setActiveIndex(0)
  }, [suggestions.items])

  const closeSuggestions = () => setSuggestions({ items: [], replaceFrom: 0, prefix: '' })

  const refreshSuggestions = (text, position) => {
    setSuggestions(getSuggestions(text, position, collectionName))
  }

  const handleChange = (event) => {
    const next = event.target.value
    const position = event.target.selectionStart
    onChange(next)
    setCaret(position)
    refreshSuggestions(next, position)
  }

  /** Replaces the typed prefix with the chosen completion and restores focus. */
  const applySuggestion = (item) => {
    const before = value.slice(0, suggestions.replaceFrom)
    const after = value.slice(caret)
    const next = before + item.insert + after
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

    // Ctrl/Cmd+Space - explicit completion request, VS Code's binding.
    if (event.code === 'Space' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      const position = event.target.selectionStart
      setCaret(position)
      setSuggestions(getAllSuggestions(value, position, collectionName))
      return
    }

    // Ctrl/Cmd+Enter runs, matching the footer hint.
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
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(start + 2, start + 2)
      })
    }
  }

  const handleSelect = (event) => {
    const position = event.target.selectionStart
    setCaret(position)
    if (suggestions.items.length > 0) refreshSuggestions(value, position)
  }

  // Popup sits under the caret. Monospace makes this pure arithmetic - no mirror element.
  const caretLine = value.slice(0, suggestions.replaceFrom).split('\n').length - 1
  const caretColumn = suggestions.replaceFrom - (value.lastIndexOf('\n', suggestions.replaceFrom - 1) + 1)
  const popupTop = PADDING_Y + (caretLine + 1) * LINE_HEIGHT - scrollTop + 4
  const popupLeft = Math.min(GUTTER + PADDING_X + caretColumn * 7.22, 340)

  return (
    <div className='relative'>
      <div
        className='relative overflow-hidden rounded-lg border border-gray-700 shadow-inner'
        style={{ background: '#1e1e1e' }}
      >
        {/* Line-number gutter */}
        <div
          aria-hidden='true'
          className='absolute left-0 top-0 bottom-0 select-none text-right'
          style={{
            width: GUTTER,
            padding: `${PADDING_Y}px 8px 0 0`,
            font: FONT,
            color: '#858585',
            background: '#1e1e1e',
            borderRight: '1px solid #2d2d2d',
            zIndex: 2
          }}
        >
          <div style={{ transform: `translateY(-${scrollTop}px)` }}>
            {Array.from({ length: lineCount }, (_, index) => (
              <div key={index} style={{ height: LINE_HEIGHT }}>{index + 1}</div>
            ))}
          </div>
        </div>

        {/* Colour layer - mirrors the textarea exactly */}
        <pre
          ref={highlightRef}
          aria-hidden='true'
          className='m-0 overflow-hidden whitespace-pre-wrap break-words'
          style={{
            font: FONT,
            padding: `${PADDING_Y}px ${PADDING_X}px`,
            paddingLeft: GUTTER + PADDING_X,
            minHeight: 190,
            maxHeight: 260,
            color: '#d4d4d4'
          }}
        >
          {highlighted}
          {'\n'}
        </pre>

        {/* Input layer - transparent text, visible caret */}
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
          aria-label='Query editor'
          className='absolute inset-0 resize-none overflow-auto whitespace-pre-wrap break-words bg-transparent outline-none'
          style={{
            font: FONT,
            padding: `${PADDING_Y}px ${PADDING_X}px`,
            paddingLeft: GUTTER + PADDING_X,
            color: 'transparent',
            caretColor: '#aeafad'
          }}
        />

        {/* Completion popup */}
        {suggestions.items.length > 0 && (
          <div
            className='absolute z-20 overflow-hidden rounded-md border shadow-2xl'
            style={{
              top: popupTop,
              left: popupLeft,
              width: 340,
              background: '#252526',
              borderColor: '#454545'
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
                    className='flex w-full items-baseline gap-2 px-3 py-1.5 text-left'
                    style={{
                      font: FONT,
                      background: index === activeIndex ? '#04395e' : 'transparent',
                      color: '#d4d4d4'
                    }}
                  >
                    <span style={{ color: '#c586c0' }}>{item.label}</span>
                    <span className='truncate text-xs' style={{ color: '#858585' }}>
                      {item.detail}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {suggestions.items[activeIndex] && (
              <div
                className='border-t px-3 py-2 text-xs leading-relaxed'
                style={{ borderColor: '#454545', background: '#1e1e1e', color: '#9d9d9d' }}
              >
                {suggestions.items[activeIndex].doc}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diagnostics - VS Code's Problems panel, in miniature */}
      {diagnostics.length > 0 && (
        <ul className='mt-2 space-y-1'>
          {diagnostics.map((diagnostic, index) => (
            <li
              key={index}
              className={`flex items-start gap-2 rounded-md px-3 py-2 text-xs ${
                diagnostic.severity === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
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

export default QueryEditor
export { validate }
