import { useId } from 'react'

/**
 * Labelled input. Bundles label, hint and error so a form field can't ship without a label
 * wired to its control, and so error styling is identical everywhere.
 */
export const Input = ({ label, hint, error, mono = false, className = '', ...rest }) => {
  const id = useId()

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className='mb-1.5 block text-sm font-medium text-ink-700'>
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-desc` : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition-all placeholder:text-ink-400 focus:outline-none focus:ring-2 ${
          error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/30'
            : 'border-ink-300 focus:border-brand-500 focus:ring-brand-500/25'
        } ${mono ? 'font-mono' : ''}`}
        {...rest}
      />
      {(error || hint) && (
        <p id={`${id}-desc`} className={`mt-1.5 text-xs ${error ? 'text-danger-600' : 'text-ink-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

/** Same contract as Input, for multi-line values. */
export const Textarea = ({ label, hint, error, mono = true, className = '', ...rest }) => {
  const id = useId()

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className='mb-1.5 block text-sm font-medium text-ink-700'>
          {label}
        </label>
      )}
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition-all placeholder:text-ink-400 focus:outline-none focus:ring-2 ${
          error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/30'
            : 'border-ink-300 focus:border-brand-500 focus:ring-brand-500/25'
        } ${mono ? 'font-mono' : ''}`}
        {...rest}
      />
      {(error || hint) && (
        <p className={`mt-1.5 text-xs ${error ? 'text-danger-600' : 'text-ink-500'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}
