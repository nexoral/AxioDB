import { useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../../config/key'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Alert } from '../ui/Feedback'

const DeleteDocumentModal = ({
  isOpen,
  onClose,
  onDocumentDeleted,
  documentId,
  databaseName,
  collectionName
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    try {
      setLoading(true)

      // Send to the API using the correct endpoint structure
      const response = await axios.delete(
        `${BASE_API_URL}/api/operation/delete/by-id/?dbName=${databaseName}&collectionName=${collectionName}&documentId=${documentId}`
      )

      if (response.status === 200) {
        onDocumentDeleted(documentId)
        onClose()
      } else {
        throw new Error('Failed to delete document')
      }
    } catch (error) {
      setError(`Error deleting document: ${error.message}`)
      setLoading(false)
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
      onClose={onClose}
      title='Delete document'
      subtitle={`${databaseName} \u203a ${collectionName}`}
      icon={WarningIcon}
      tone='danger'
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant='danger' onClick={handleDelete} loading={loading}>
            Delete document
          </Button>
        </>
      }
    >
      <Alert tone='danger' title='This cannot be undone'>
        The document file is removed from disk and its index entries are dropped.
      </Alert>

      <div className='mt-4 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3'>
        <p className='text-xs font-medium uppercase tracking-wide text-ink-500'>Document ID</p>
        <p className='mt-1 break-all font-mono text-sm text-ink-900'>{documentId}</p>
      </div>

      {error && <Alert tone='danger' className='mt-4'>{error}</Alert>}
    </Modal>
  )
}

export default DeleteDocumentModal
