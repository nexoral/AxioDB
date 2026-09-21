/**
 * The one button. Variants exist so "primary action" is a decision made once here, not
 * re-picked per page - the old code had blue, indigo and green all playing that role.
 *
 * @param {'primary'|'secondary'|'ghost'|'danger'|'dangerGhost'} [variant]
 * @param {'sm'|'md'|'lg'} [size]
 * @param {boolean} [loading] - shows a spinner and blocks interaction
 * @param {React.ReactNode} [icon] - leading icon, hidden from assistive tech
 */
const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-ink-300',
  secondary:
    'bg-white text-ink-700 border border-ink-300 shadow-sm hover:bg-ink-50 hover:border-ink-400 active:bg-ink-100 disabled:text-ink-400',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200 disabled:text-ink-400',
  danger:
    'bg-danger-600 text-white shadow-sm hover:bg-danger-700 active:bg-danger-700 disabled:bg-ink-300',
  dangerGhost:
    'text-danger-600 border border-danger-200 hover:bg-danger-50 hover:border-danger-500 active:bg-danger-100 disabled:text-ink-400'
}

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl'
}

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon = null,
  className = '',
  children,
  disabled,
  ...rest
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    {...rest}
  >
    {loading
      ? (
        <svg className='h-4 w-4 shrink-0 animate-spin' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z' />
        </svg>
        )
      : icon
        ? <span className='shrink-0' aria-hidden='true'>{icon}</span>
        : null}
    {children}
  </button>
)

export default Button
