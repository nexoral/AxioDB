import axios from 'axios'
import { useState } from 'react'
import { BASE_API_URL } from '../../config/key'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Alert } from '../ui/Feedback'

const DeleteCollectionModal = ({
  isOpen,
  onClose,
  onCollectionDeleted,
  databaseName,
  collectionName
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset form state when modal is opened/closed
  const handleClose = () => {
    setError('')
    setIsSubmitting(false)
    onClose()
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      // Make API call to delete collection
      const response = await axios.delete(
        `${BASE_API_URL}/api/collection/delete-collection/?dbName=${databaseName}&collectionName=${collectionName}`
      )

      if (response.data.statusCode === 200) {
        onCollectionDeleted(collectionName)
        handleClose()
      } else {
        throw new Error('Failed to delete collection')
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      setError(
        error.response?.data?.message ||
          'Failed to delete collection. Please try again.'
      )
      setIsSubmitting(false)
    }
  }

  const WarningIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Delete collection'
      subtitle={`${databaseName} \u203a ${collectionName}`}
      icon={WarningIcon}
      tone='danger'
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant='danger' onClick={handleDelete} loading={isSubmitting}>
            Delete permanently
          </Button>
        </>
      }
    >
      <Alert tone='danger' title='This cannot be undone'>
        Deleting <strong>{collectionName}</strong> removes every document it holds, along
        with its indexes.
      </Alert>

      {error && <Alert tone='danger' className='mt-4'>{error}</Alert>}
    </Modal>
  )
}

export default DeleteCollectionModal
