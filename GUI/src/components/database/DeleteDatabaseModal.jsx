import { useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../../config/key'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Alert } from '../ui/Feedback'

const WarningIcon = (
  <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' />
  </svg>
)

/**
 * Destructive confirmation. Requires the database name to be typed back before the delete
 * button unlocks - this removes every collection and document underneath it, and there is no
 * undo, so a single mis-aimed click should not be enough.
 */
const DeleteDatabaseModal = ({ isOpen, dbName, onClose, onConfirmDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState(null)

  const handleClose = () => {
    setConfirmation('')
    setError(null)
    onClose()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await axios.delete(`${BASE_API_URL}/api/db/delete-database`, {
        params: { dbName }
      })

      if (response.status !== 200) throw new Error('Failed to delete database')

      setConfirmation('')
      onConfirmDelete()
    } catch (err) {
      console.error('Error deleting database:', err)
      setError(err.response?.data?.message || 'Failed to delete database. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Delete database'
      subtitle={dbName}
      icon={WarningIcon}
      tone='danger'
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant='danger'
            onClick={handleDelete}
            loading={isDeleting}
            disabled={confirmation !== dbName}
          >
            Delete permanently
          </Button>
        </>
      }
    >
      <Alert tone='danger' title='This cannot be undone'>
        Deleting <strong>{dbName}</strong> removes every collection and document inside it
        from disk.
      </Alert>

      <label htmlFor='confirm-db-name' className='mt-5 block text-sm text-ink-700'>
        Type <span className='font-mono font-semibold text-ink-900'>{dbName}</span> to confirm:
      </label>
      <input
        id='confirm-db-name'
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        autoComplete='off'
        placeholder={dbName}
        className='mt-2 w-full rounded-lg border border-ink-300 px-3 py-2 font-mono text-sm shadow-sm transition-all focus:border-danger-500 focus:outline-none focus:ring-2 focus:ring-danger-500/25'
      />

      {error && <Alert tone='danger' className='mt-4'>{error}</Alert>}
    </Modal>
  )
}

export default DeleteDatabaseModal
