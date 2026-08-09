/**
 * Surface primitive. `interactive` adds the lift-on-hover treatment - only use it when the
 * whole card is genuinely clickable, otherwise it promises an affordance that isn't there.
 */
const Card = ({ interactive = false, className = '', children, ...rest }) => (
  <div
    className={`rounded-card border border-ink-200 bg-white shadow-card ${
      interactive
        ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-float'
        : ''
    } ${className}`}
    {...rest}
  >
    {children}
  </div>
)

/** Optional header strip: title on the left, actions on the right. */
export const CardHeader = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4 ${className}`}>
    <div className='min-w-0'>
      <h3 className='truncate text-sm font-semibold text-ink-900'>{title}</h3>
      {subtitle && <p className='mt-0.5 truncate text-xs text-ink-500'>{subtitle}</p>}
    </div>
    {action}
  </div>
)

export default Card
