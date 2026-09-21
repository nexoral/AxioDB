import { useState } from 'react'
import authApi from '../../api/authApi'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input } from '../ui/Field'
import { Alert } from '../ui/Feedback'

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

  const UserIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Create user'
      icon={UserIcon}
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!username.trim() || !password}>
            Create user
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <Input
          label='Username'
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder='analyst'
          mono
          autoFocus
          autoComplete='off'
          hint='Letters, numbers and underscores only.'
        />

        <Input
          label='Temporary password'
          type='password'
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete='new-password'
          hint={`At least ${MIN_PASSWORD_LENGTH} characters. They must change it at first sign-in.`}
        />

        <div>
          <label htmlFor='new-user-role' className='mb-1.5 block text-sm font-medium text-ink-700'>
            Role
          </label>
          <select
            id='new-user-role'
            value={role || roles?.[0]?.roleName || ''}
            onChange={(event) => setRole(event.target.value)}
            className='w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25'
          >
            {(roles ?? []).map((entry) => (
              <option key={entry.roleName} value={entry.roleName}>{entry.roleName}</option>
            ))}
          </select>
          <p className='mt-1.5 text-xs text-ink-500'>
            Determines what this account can reach across the Dashboard, TCP and MCP surfaces.
          </p>
        </div>

        {error && <Alert tone='danger'>{error}</Alert>}
        <button type='submit' className='hidden' aria-hidden='true' tabIndex={-1} />
      </form>
    </Modal>
  )
}

export default CreateUserModal
