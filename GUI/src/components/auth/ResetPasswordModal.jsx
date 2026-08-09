import { useState } from 'react'
import authApi from '../../api/authApi'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input } from '../ui/Field'
import { Alert } from '../ui/Feedback'

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

  const KeyIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Reset password'
      subtitle={username}
      icon={KeyIcon}
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!newPassword}>
            Reset password
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label='New password'
          type='password'
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete='new-password'
          autoFocus
          error={error || undefined}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        />
        <button type='submit' className='hidden' aria-hidden='true' tabIndex={-1} />
      </form>

      <Alert tone='warn' className='mt-4'>
        Every active session for <strong>{username}</strong> is revoked immediately, and they
        must change this password at next sign-in.
      </Alert>
    </Modal>
  )
}

export default ResetPasswordModal
