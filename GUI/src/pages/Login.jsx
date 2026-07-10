import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../api/authApi'
import { useAuthStore } from '../store/authStore'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const handleSubmit = async (e) => {
    e.preventDefault()

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

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-indigo-800 px-4'>
      <div className='bg-white rounded-lg shadow-lg max-w-md w-full p-8 animate-fadeIn'>
        <div className='flex flex-col items-center mb-6'>
          <img src='/AXioDB.png' alt='AxioDB Logo' className='h-12 w-12 mb-3' />
          <h1 className='text-2xl font-bold text-gray-900'>AxioDB Control Hub</h1>
          <p className='text-sm text-gray-500 mt-1'>Sign in to manage your databases</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label htmlFor='username' className='block text-sm font-medium text-gray-700 mb-1'>
              Username
            </label>
            <input
              type='text'
              id='username'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter your username'
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className='mb-4'>
            <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
              Password
            </label>
            <input
              type='password'
              id='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter your password'
              disabled={isSubmitting}
            />
          </div>

          {error && <p className='mb-4 text-sm text-red-600'>{error}</p>}

          <button
            type='submit'
            className={`w-full px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors flex items-center justify-center ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (
                <>
                  <svg
                    className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Signing in...
                </>
                )
              : (
                  'Sign In'
                )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
