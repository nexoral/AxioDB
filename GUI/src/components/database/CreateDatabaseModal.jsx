import { useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../../config/key'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input } from '../ui/Field'

const CreateDatabaseModal = ({ isOpen, onClose, onDatabaseCreated }) => {
  const [databaseName, setDatabaseName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Reset form state when modal is opened/closed
  const handleClose = () => {
    setDatabaseName('')
    setError('')
    setIsSubmitting(false) // Ensure submission state is reset when closing
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate input
    if (!databaseName.trim()) {
      setError('Database name is required')
      return
    }

    // Alphanumeric validation (plus underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) {
      setError(
        'Database name can only contain letters, numbers, and underscores'
      )
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Make actual API call to create database
      const response = await axios.post(
        `${BASE_API_URL}/api/db/create-database`,
        { name: databaseName }
      )

      if (
        response.data.statusCode === 200 ||
        response.data.statusCode === 201
      ) {
        onDatabaseCreated(databaseName)
        setIsSubmitting(false) // Reset submission state on success
        handleClose()
      } else {
        setIsSubmitting(false) // Reset submission state on success
        throw new Error('Failed to create database')
      }
    } catch (error) {
      console.error('Error creating database:', error)
      setError(
        error.response?.data?.message ||
          'Failed to create database. Please try again.'
      )
      setIsSubmitting(false)
    }
  }
  const DatabaseIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <ellipse cx='12' cy='6' rx='8' ry='3' />
      <path d='M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Create database'
      icon={DatabaseIcon}
      size='md'
      footer={
        <>
          <Button variant='secondary' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting} disabled={!databaseName.trim()}>
            Create database
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Input
          label='Database name'
          value={databaseName}
          onChange={(event) => setDatabaseName(event.target.value)}
          placeholder='AppDB'
          mono
          autoFocus
          error={error || undefined}
          hint='Letters, numbers and underscores only. The name "config" is reserved by AxioDB.'
        />

        {/* Lets Enter submit the form without rendering a second visible button. */}
        <button type='submit' className='hidden' aria-hidden='true' tabIndex={-1} />
      </form>
    </Modal>
  )
}

export default CreateDatabaseModal
