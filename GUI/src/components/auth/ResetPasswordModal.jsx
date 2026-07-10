import { useState } from 'react'
import authApi from '../../api/authApi'

const MIN_PASSWORD_LENGTH = 4

const ResetPasswordModal = ({ isOpen, username, onClose, onPasswordReset }) => {
  const [newPassword, setNewPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setNewPassword('')
    setError('')
    setIsSubmitting(false)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await authApi.resetUserPassword(username, newPassword)
      onPasswordReset()
      handleClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn'>
      <div className='bg-white rounded-lg max-w-md w-full p-6'>
        <h3 className='text-xl font-bold text-gray-900 mb-4'>Reset Password for {username}</h3>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label
              htmlFor='resetNewPassword'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              New Password
            </label>
            <input
              type='password'
              id='resetNewPassword'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='Enter a new temporary password'
              disabled={isSubmitting}
            />
            <p className='mt-1 text-xs text-gray-500'>
              The user will be required to change this on their next login.
            </p>
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
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordModal
