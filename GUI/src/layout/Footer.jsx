import { Link } from 'react-router-dom'

/**
 * Footer. Internal routes use <Link> so they no longer force a full page reload - the old
 * version used raw <a href> for /support and /status, which threw away the SPA and the
 * in-memory session state on every click.
 */
const LINKS = [
  { to: '/support', label: 'Support' },
  { to: '/api', label: 'API Reference' },
  { to: '/status', label: 'Status' }
]

const Footer = () => (
  <footer className='mt-auto border-t border-ink-200 bg-white'>
    <div className='mx-auto w-full max-w-[120rem] px-4 sm:px-6 lg:px-8 py-8'>
      <div className='flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <img src='/AXioDB.png' alt='' className='h-9 w-9 rounded-lg' />
          <div>
            <p className='text-sm font-bold text-ink-900'>AxioDB</p>
            <p className='text-xs text-ink-500'>Embedded NoSQL database for Node.js</p>
          </div>
        </div>

        <nav className='flex flex-wrap items-center gap-x-6 gap-y-2'>
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className='text-sm text-ink-600 transition-colors hover:text-brand-700'
            >
              {link.label}
            </Link>
          ))}
          <a
            href='https://github.com/nexoral/AxioDB'
            target='_blank'
            rel='noreferrer noopener'
            className='inline-flex items-center gap-1.5 text-sm text-ink-600 transition-colors hover:text-brand-700'
          >
            GitHub
            <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
            </svg>
          </a>
        </nav>
      </div>

      <p className='mt-6 border-t border-ink-100 pt-6 text-xs text-ink-400'>
        © {new Date().getFullYear()} AxioDB. Released under the MIT licence.
      </p>
    </div>
  </footer>
)

export default Footer
