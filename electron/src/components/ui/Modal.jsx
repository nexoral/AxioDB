import { useEffect, useRef } from 'react'

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

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    returnFocusRef.current = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.()
    }
    document.addEventListener('keydown', onKeyDown)

    const focusTimer = requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector('input:not([disabled]), textarea:not([disabled]), button:not([disabled]), select:not([disabled]')
      if (firstFocusable instanceof HTMLElement) firstFocusable.focus()
      else panelRef.current?.focus()
    })

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      cancelAnimationFrame(focusTimer)
      document.body.style.overflow = overflow
      if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-xs select-none'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCloseRef.current?.()
      }}
    >
      <div
        ref={panelRef}
        role='dialog'
        aria-modal='true'
        aria-label={title}
        tabIndex={-1}
        className={`animate-popIn flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-xl bg-white shadow-xl border border-slate-200 outline-none`}
      >
        <div
          className={`flex items-center justify-between gap-4 px-5 py-3.5 border-b ${
            tone === 'danger'
              ? 'bg-red-50/80 border-red-200 text-red-900'
              : 'bg-slate-50/90 border-slate-200 text-slate-900'
          }`}
        >
          <div className='flex min-w-0 items-center gap-3'>
            {icon && (
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  tone === 'danger'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}
              >
                {icon}
              </span>
            )}
            <div className='min-w-0'>
              <h3 className='truncate text-sm font-bold text-slate-800'>{title}</h3>
              {subtitle && <p className='truncate font-mono text-xs text-slate-500'>{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label='Close dialog'
            className='shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700'
          >
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-5 text-slate-700'>{children}</div>

        {footer && (
          <div className='flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/80 px-5 py-3'>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
