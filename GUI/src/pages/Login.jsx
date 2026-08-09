import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../api/authApi'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import { Alert } from '../components/ui/Feedback'

/**
 * Sign-in. Split layout: product panel on the left for context, form on the right.
 * The panel collapses on small screens so the form always leads on a phone.
 */
const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError('Username and password are required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await authApi.login(username, password)
      const { username: loggedInUsername, role, permissions, mustChangePassword } =
        response.data.data
      setSession({ username: loggedInUsername, role, permissions, mustChangePassword })
      navigate(mustChangePassword ? '/force-password-change' : '/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-sm transition-all placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:bg-ink-50'

  return (
    <div className='grid min-h-screen lg:grid-cols-2'>
      {/* Product panel */}
      <aside className='relative hidden overflow-hidden bg-ink-900 p-12 lg:flex lg:flex-col lg:justify-between'>
        <div
          className='pointer-events-none absolute inset-0 opacity-40'
          style={{
            background:
              'radial-gradient(60rem 40rem at 10% 0%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(50rem 40rem at 90% 100%, rgba(99,102,241,0.16), transparent 60%)'
          }}
          aria-hidden='true'
        />

        <div className='relative flex items-center gap-3'>
          <img src='/AXioDB.png' alt='' className='h-10 w-10 rounded-xl' />
          <span className='text-lg font-bold text-white'>AxioDB</span>
        </div>

        <div className='relative max-w-md'>
          <h2 className='text-3xl font-bold leading-tight tracking-tight text-white'>
            The pure-JavaScript alternative to SQLite.
          </h2>
          <p className='mt-4 text-sm leading-relaxed text-ink-300'>
            Embedded NoSQL for Node.js with MongoDB-style queries. No node-gyp, no
            electron-rebuild, no native binaries to match.
          </p>

          <ul className='mt-8 space-y-3'>
            {[
              'ACID transactions with write-ahead logging',
              'In-memory cache with cold-start recovery',
              'Dashboard, TCP server, and MCP tooling'
            ].map((item) => (
              <li key={item} className='flex items-start gap-2.5 text-sm text-ink-300'>
                <svg className='mt-0.5 h-4 w-4 shrink-0 text-brand-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5} aria-hidden='true'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className='relative text-xs text-ink-500'>
          Runs entirely on your machine. Nothing is sent anywhere.
        </p>
      </aside>

      {/* Form */}
      <main className='flex items-center justify-center bg-ink-50 px-4 py-12'>
        <div className='animate-riseIn w-full max-w-sm'>
          <div className='mb-8 text-center lg:text-left'>
            <img src='/AXioDB.png' alt='' className='mx-auto mb-4 h-12 w-12 rounded-xl lg:hidden' />
            <h1 className='text-2xl font-bold tracking-tight text-ink-900'>Welcome back</h1>
            <p className='mt-1 text-sm text-ink-500'>Sign in to manage your databases.</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label htmlFor='username' className='mb-1.5 block text-sm font-medium text-ink-700'>
                Username
              </label>
              <input
                type='text'
                id='username'
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={inputClass}
                placeholder='Enter your username'
                autoComplete='username'
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor='password' className='mb-1.5 block text-sm font-medium text-ink-700'>
                Password
              </label>
              <input
                type='password'
                id='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder='Enter your password'
                autoComplete='current-password'
                disabled={isSubmitting}
              />
            </div>

            {error && <Alert tone='danger'>{error}</Alert>}

            <Button type='submit' size='lg' loading={isSubmitting} className='w-full'>
              {isSubmitting ? 'Signing in' : 'Sign in'}
            </Button>
          </form>

          <p className='mt-8 text-center text-xs text-ink-400 lg:text-left'>
            First run? The seeded account is <code className='font-mono text-ink-600'>admin</code>,
            and you will be asked to change its password immediately.
          </p>
        </div>
      </main>
    </div>
  )
}

export default Login
