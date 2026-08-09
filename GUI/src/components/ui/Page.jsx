/**
 * Standard page container.
 *
 * Fluid up to 1920px rather than the old 1280px cap, so a 1080p or 1440p screen is actually
 * used instead of showing ~320px of empty gutter on each side. The cap only engages on
 * ultrawide displays, where an unbounded row of cards would stretch past the point of being
 * scannable.
 *
 * Prose is the exception - see `prose` below. Full-width body text is hard to read because
 * the eye loses its place on the return sweep, so text-heavy pages constrain the measure
 * even though their page frame is fluid.
 */
const Page = ({ className = '', children }) => (
  <div className={`mx-auto w-full max-w-[120rem] px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
)

/**
 * Page title block. Optional actions sit on the right and wrap underneath on small screens.
 */
export const PageHeader = ({ title, description, action, children, className = '' }) => (
  <header className={`mb-8 ${className}`}>
    {children}
    <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div className='min-w-0'>
        <h1 className='text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl'>{title}</h1>
        {description && <p className='mt-1 text-sm text-ink-500'>{description}</p>}
      </div>
      {action}
    </div>
  </header>
)

/** Constrains a column of body text to a readable measure (~75 characters). */
export const Prose = ({ className = '', children }) => (
  <div className={`max-w-[70ch] ${className}`}>{children}</div>
)

export default Page
