import { useEffect, useRef } from 'react'

/**
 * Shared dialog shell. Every modal in the app renders through this so they behave
 * identically: Escape closes, backdrop click closes, focus moves in on open and returns to
 * the trigger on close, and the page behind cannot scroll.
 *
 * The backdrop blurs rather than dims - a black scrim on a light UI reads as a mode change,
 * a blur reads as focus.
 *
 * @param {'sm'|'md'|'lg'|'xl'} [size]
 * @param {'default'|'danger'} [tone] - tints the header for destructive confirmations
 */
const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon = null,
  size = 'md',
  tone = 'default',
  footer = null,
  children
}) => {
  const panelRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    returnFocusRef.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)

    // Focus the panel so screen readers announce the dialog and Tab starts inside it.
    const focusTimer = requestAnimationFrame(() => panelRef.current?.focus())

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      cancelAnimationFrame(focusTimer)
      document.body.style.overflow = overflow
      // Hand focus back to whatever opened the dialog.
      if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-ink-900/5 p-4 backdrop-blur-md'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label={title}
        tabIndex={-1}
        className={`animate-popIn flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-2xl bg-white shadow-modal ring-1 ring-ink-900/10 outline-none`}
      >
        <div
          className={`flex items-center justify-between gap-4 px-6 py-4 ${
            tone === 'danger'
              ? 'bg-gradient-to-r from-danger-600 to-danger-700'
              : 'bg-gradient-to-r from-ink-900 to-ink-800'
          }`}
        >
          <div className='flex min-w-0 items-center gap-3'>
            {icon && (
              <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-300'>
                {icon}
              </span>
            )}
            <div className='min-w-0'>
              <h3 className='truncate text-base font-semibold text-white'>{title}</h3>
              {subtitle && <p className='truncate font-mono text-xs text-ink-400'>{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label='Close dialog'
            className='shrink-0 rounded-md p-1 text-ink-400 transition-colors hover:bg-white/10 hover:text-white'
          >
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-6'>{children}</div>

        {footer && (
          <div className='flex items-center justify-end gap-3 border-t border-ink-200 bg-ink-50 px-6 py-4'>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
