import { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../config/key'
import Page from '../components/ui/Page'
import Card, { CardHeader } from '../components/ui/Card'
import { Alert, Badge, Skeleton } from '../components/ui/Feedback'

/**
 * Support page.
 *
 * Rebuilt onto the design system: the old version ran a blue→purple gradient hero over
 * blue/green/purple/yellow tinted panels, which is four accent hues competing on one screen
 * and none of them the app's. Colour is now carried by the slate chrome and a single emerald
 * accent, with tint reserved for genuine status (the reporting guidance).
 */

const CONTACT_ICONS = {
  email: (
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
  ),
  linkedin: (
    <path fillRule='evenodd' clipRule='evenodd' d='M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z' />
  ),
  github: (
    <path fillRule='evenodd' clipRule='evenodd' d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z' />
  )
}

const ContactRow = ({ href, external, label, value, children, filled = false }) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    className='group flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-raised'
  >
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
        filled ? 'bg-ink-900 text-white' : 'bg-brand-50 text-brand-600 group-hover:bg-brand-100'
      }`}
    >
      {children}
    </span>
    <span className='min-w-0'>
      <span className='block text-sm font-semibold text-ink-900'>{label}</span>
      <span className='block truncate text-sm text-ink-500'>{value}</span>
    </span>
  </a>
)

const REPORTING_CHECKLIST = [
  ['Detailed description', 'What happened, and what you expected instead.'],
  ['Steps to reproduce', 'The shortest sequence that triggers it, in order.'],
  ['Environment', 'Operating system, Node.js version, AxioDB version.'],
  ['Error messages', 'The complete message and stack trace, copied verbatim.'],
  ['Code sample', 'The smallest snippet that still reproduces it.']
]

const Support = () => {
  const [authorInfo, setAuthorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    axios
      .get(`${BASE_API_URL}/api/info`)
      .then((response) => {
        if (cancelled) return
        setAuthorInfo(response.data.data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Error fetching author info:', err)
        setError('Failed to load author information.')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const author = authorInfo?.AuthorDetails ?? {}
  const githubHandle = author.github?.split('/').pop()

  return (
    <Page>
      <header className='mb-8'>
        <h1 className='text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl'>Support</h1>
        <p className='mt-1 text-sm text-ink-500'>
          AxioDB is maintained by one developer. Here is how to get hold of them, and what to
          include so an issue can actually be fixed.
        </p>
      </header>

      {error && <Alert tone='danger' className='mb-6'>{error}</Alert>}

      <div className='stagger grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Maintainer */}
        <Card className='overflow-hidden lg:col-span-2'>
          <div className='relative overflow-hidden bg-ink-900 px-6 py-8 sm:px-8'>
            <div
              className='pointer-events-none absolute inset-0 opacity-50'
              style={{
                background:
                  'radial-gradient(40rem 24rem at 0% 0%, rgba(16,185,129,0.22), transparent 65%)'
              }}
              aria-hidden='true'
            />
            <div className='relative flex flex-wrap items-center gap-5'>
              <div className='h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/20'>
                {loading
                  ? <Skeleton className='h-full w-full' />
                  : (
                    <img
                      src={`https://github.com/${githubHandle}.png`}
                      alt=''
                      className='h-full w-full object-cover'
                      onError={(event) => { event.target.style.visibility = 'hidden' }}
                    />
                    )}
              </div>
              <div className='min-w-0'>
                <h2 className='text-xl font-bold text-white'>
                  {loading ? <Skeleton className='h-6 w-40' /> : author.name}
                </h2>
                <p className='mt-0.5 text-sm text-ink-300'>
                  {author.Designation || 'Software Engineer'}
                </p>
                <p className='mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-400'>
                  <span>{author.Country || 'India'}</span>
                  <span aria-hidden='true'>•</span>
                  <span>Solo maintainer</span>
                </p>
              </div>
            </div>
          </div>

          <div className='grid gap-3 p-6 sm:grid-cols-2 sm:p-8'>
            <ContactRow href={`mailto:${author.Email}`} label='Email' value={author.Email || '—'}>
              <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                {CONTACT_ICONS.email}
              </svg>
            </ContactRow>

            <ContactRow href={author.LinkedIn} external label='LinkedIn' value='Connect'>
              <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
                {CONTACT_ICONS.linkedin}
              </svg>
            </ContactRow>

            <ContactRow href={author.github} external label='GitHub' value='Source and issues' filled>
              <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
                {CONTACT_ICONS.github}
              </svg>
            </ContactRow>

            <ContactRow
              href='https://www.npmjs.com/package/axiodb'
              external
              label='npm'
              value={authorInfo?.Package_Name || 'axiodb'}
            >
              <svg className='h-5 w-5' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
              </svg>
            </ContactRow>
          </div>
        </Card>

        {/* Release facts */}
        <Card className='flex flex-col'>
          <CardHeader title='This build' subtitle='Reported by /api/info' />
          <dl className='flex-1 divide-y divide-ink-100'>
            {[
              ['Package', authorInfo?.Package_Name || 'axiodb', true],
              ['Version', authorInfo?.AxioDB_Version || '—', true],
              ['Licence', authorInfo?.License || 'MIT', false]
            ].map(([label, value, mono]) => (
              <div key={label} className='flex items-center justify-between gap-4 px-5 py-4'>
                <dt className='text-sm text-ink-500'>{label}</dt>
                <dd className={`truncate text-sm font-semibold text-ink-900 ${mono ? 'font-mono' : ''}`}>
                  {loading ? <Skeleton className='h-4 w-20' /> : value}
                </dd>
              </div>
            ))}
          </dl>
          <div className='border-t border-ink-100 px-5 py-4'>
            <Badge tone='brand' dot>Running locally</Badge>
            <p className='mt-2 text-xs leading-relaxed text-ink-500'>
              This dashboard talks only to the AxioDB process on your own machine. Nothing on
              this page is sent anywhere.
            </p>
          </div>
        </Card>

        {/* Reporting guidance */}
        <Card className='lg:col-span-2'>
          <CardHeader
            title='Reporting an issue'
            subtitle='Include all five and it can usually be fixed on the first pass'
          />
          <ol className='divide-y divide-ink-100'>
            {REPORTING_CHECKLIST.map(([title, detail], index) => (
              <li key={title} className='flex items-start gap-4 px-5 py-4'>
                <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700'>
                  {index + 1}
                </span>
                <div className='min-w-0'>
                  <p className='text-sm font-semibold text-ink-900'>{title}</p>
                  <p className='mt-0.5 text-sm text-ink-500'>{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* Expectations */}
        <div className='space-y-6'>
          <Alert tone='info' title='Expected response time'>
            Usually within 24-48 hours. Critical issues are prioritised.
          </Alert>
          <Alert tone='warn' title='One developer, so please be patient'>
            A detailed report is the single biggest thing that speeds up a fix - it is the
            difference between reproducing the bug in minutes and never reproducing it at all.
          </Alert>
        </div>
      </div>
    </Page>
  )
}

export default Support
