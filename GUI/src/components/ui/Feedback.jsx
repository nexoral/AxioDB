/**
 * Small shared pieces of feedback: status badges, skeletons, empty states and alerts.
 * Kept together because they are each a handful of lines and are almost always imported
 * alongside one another.
 */

const BADGE_TONES = {
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
  warn: 'bg-warn-50 text-warn-700 ring-warn-200',
  info: 'bg-info-50 text-info-700 ring-info-200'
}

/** @param {'neutral'|'brand'|'danger'|'warn'|'info'} [tone] */
export const Badge = ({ tone = 'neutral', dot = false, className = '', children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${BADGE_TONES[tone]} ${className}`}
  >
    {dot && <span className='h-1.5 w-1.5 rounded-full bg-current' aria-hidden='true' />}
    {children}
  </span>
)

/**
 * Loading placeholder. Give it the dimensions of the content it stands in for - a skeleton
 * that doesn't match causes a layout jump the moment real data lands.
 */
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-md ${className}`} aria-hidden='true' />
)

/**
 * Shown when a list has no rows. Always offers the action that would create the first one -
 * an empty state without a next step is a dead end.
 */
export const EmptyState = ({ icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${className}`}>
    {icon && (
      <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400'>
        {icon}
      </div>
    )}
    <h3 className='text-base font-semibold text-ink-900'>{title}</h3>
    {description && <p className='mt-1.5 max-w-sm text-sm text-ink-500'>{description}</p>}
    {action && <div className='mt-6'>{action}</div>}
  </div>
)

const ALERT_TONES = {
  danger: 'border-danger-200 bg-danger-50 text-danger-700',
  warn: 'border-warn-200 bg-warn-50 text-warn-700',
  info: 'border-info-200 bg-info-50 text-info-700',
  brand: 'border-brand-200 bg-brand-50 text-brand-700'
}

/** @param {'danger'|'warn'|'info'|'brand'} [tone] */
export const Alert = ({ tone = 'info', title, className = '', children }) => (
  <div
    role={tone === 'danger' ? 'alert' : 'status'}
    className={`animate-fadeIn rounded-lg border px-4 py-3 text-sm ${ALERT_TONES[tone]} ${className}`}
  >
    {title && <p className='font-semibold'>{title}</p>}
    {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
  </div>
)
