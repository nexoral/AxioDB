import axios from 'axios'
import { useState } from 'react'
import { BASE_API_URL } from '../../config/key'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input } from '../ui/Field'

const CreateCollectionModal = ({
  isOpen,
  onClose,
  onCollectionCreated,
  databaseName
}) => {
  const [collectionName, setCollectionName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset form state when modal is opened/closed
  const handleClose = () => {
    setCollectionName('')
    setError('')
    setIsSubmitting(false)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate input
    if (!collectionName.trim()) {
      setError('Collection name is required')
      return
    }

    // Alphanumeric validation (plus underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(collectionName)) {
      setError(
        'Collection name can only contain letters, numbers, and underscores'
      )
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Make API call to create collection
      const response = await axios.post(
        `${BASE_API_URL}/api/collection/create-collection`,
        {
          dbName: databaseName,
          collectionName
        }
      )

      if (
        response.data.statusCode === 200 ||
        response.data.statusCode === 201
      ) {
        // Format the new collection to match the format used in Collections.jsx
        onCollectionCreated({
          name: collectionName,
          documentCount: 0, // New collections start with 0 documents
          size: 'N/A' // We don't have size info yet
        })
        handleClose()
      } else {
        throw new Error('Failed to create collection')
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      setError(
        error.response?.data?.message ||
          'Failed to create collection. Please try again.'
      )
      setIsSubmitting(false)
    }
  }

  const FolderIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Create collection'
      subtitle={databaseName}
      icon={FolderIcon}
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!collectionName.trim()}>
            Create collection
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-4'>
        <Input label='Database' value={databaseName} disabled mono className='opacity-70' />

        <Input
          label='Collection name'
          value={collectionName}
          onChange={(event) => setCollectionName(event.target.value)}
          placeholder='users'
          mono
          autoFocus
          error={error || undefined}
          hint='Letters, numbers and underscores only. AxioDB is schema-less, so there is nothing else to define.'
        />

        {/* Lets Enter submit the form without rendering a second visible button. */}
        <button type='submit' className='hidden' aria-hidden='true' tabIndex={-1} />
      </form>
    </Modal>
  )
}

export default CreateCollectionModal
