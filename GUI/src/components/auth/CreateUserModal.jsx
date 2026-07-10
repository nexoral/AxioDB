import { useState } from 'react'
import authApi from '../../api/authApi'

const MIN_PASSWORD_LENGTH = 4

const CreateUserModal = ({ isOpen, onClose, onUserCreated, roles }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setUsername('')
    setPassword('')
    setRole('')
    setError('')
    setIsSubmitting(false)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('Username is required')
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    const selectedRole = role || roles?.[0]?.roleName
    if (!selectedRole) {
      setError('Role is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await authApi.createUser(username, password, selectedRole)
      onUserCreated()
      handleClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn'>
      <div className='bg-white rounded-lg max-w-md w-full p-6'>
        <h3 className='text-xl font-bold text-gray-900 mb-4'>Create New User</h3>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label htmlFor='newUsername' className='block text-sm font-medium text-gray-700 mb-1'>
              Username
            </label>
            <input
              type='text'
              id='newUsername'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter username'
              disabled={isSubmitting}
            />
          </div>

          <div className='mb-4'>
            <label htmlFor='newPassword' className='block text-sm font-medium text-gray-700 mb-1'>
              Temporary Password
            </label>
            <input
              type='password'
              id='newPassword'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter a temporary password'
              disabled={isSubmitting}
            />
            <p className='mt-1 text-xs text-gray-500'>
              The user will be required to change this on first login.
            </p>
          </div>

          <div className='mb-4'>
            <label htmlFor='newUserRole' className='block text-sm font-medium text-gray-700 mb-1'>
              Role
            </label>
            <select
              id='newUserRole'
              value={role || roles?.[0]?.roleName || ''}
              onChange={(e) => setRole(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              disabled={isSubmitting}
            >
              {roles?.map((r) => (
                <option key={r.roleName} value={r.roleName}>
                  {r.roleName}
                </option>
              ))}
            </select>
          </div>

          {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}

          <div className='flex justify-end space-x-4 mt-6'>
            <button
              type='button'
              onClick={handleClose}
              className='px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors'
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type='submit'
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center ${
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
                    Creating...
                  </>
                  )
                : (
                    'Create User'
                  )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateUserModal
