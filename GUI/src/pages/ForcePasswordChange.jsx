import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../api/authApi'
import { useAuthStore } from '../store/authStore'

const MIN_PASSWORD_LENGTH = 4

const ForcePasswordChange = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await authApi.changePassword(currentPassword, newPassword)
      const { username, role, permissions, mustChangePassword } = response.data.data
      setSession({ username, role, permissions, mustChangePassword })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-700 to-indigo-800 px-4'>
      <div className='bg-white rounded-lg shadow-lg max-w-md w-full p-8 animate-fadeIn'>
        <h1 className='text-xl font-bold text-gray-900 mb-1'>Change Your Password</h1>
        <p className='text-sm text-gray-500 mb-6'>
          For security, you must set a new password before continuing.
        </p>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label
              htmlFor='currentPassword'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Current Password
            </label>
            <input
              type='password'
              id='currentPassword'
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className='mb-4'>
            <label htmlFor='newPassword' className='block text-sm font-medium text-gray-700 mb-1'>
              New Password
            </label>
            <input
              type='password'
              id='newPassword'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              disabled={isSubmitting}
            />
          </div>

          <div className='mb-4'>
            <label
              htmlFor='confirmPassword'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Confirm New Password
            </label>
            <input
              type='password'
              id='confirmPassword'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ForcePasswordChange
