import { useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../../config/key'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Alert } from '../ui/Feedback'
import ObjectEditor from '../query/ObjectEditor'
import { parseLiteral, validateDocument } from '../query/queryLanguage'

const InsertDocumentModal = ({
  isOpen,
  onClose,
  onDocumentInserted,
  databaseName,
  collectionName,
  onSuccess
}) => {
  const [documentData, setDocumentData] = useState("{\n  \n}")
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      // The editor speaks JS object literals; axios serialises the result to JSON.
      const parsedData = parseLiteral(documentData)
      setLoading(true)

      // Send to the API using the correct endpoint structure
      const response = await axios.post(
        `${BASE_API_URL}/api/operation/create/?dbName=${databaseName}&collectionName=${collectionName}`,
        {
          ...parsedData
        }
      )

      if (response.status === 200 || response.status === 201) {
        // Extract the documentId from the response
        const documentId = response.data.data?.documentId

        // Construct the inserted document with the returned documentId
        const insertedDocument = {
          ...parsedData,
          documentId: documentId || `doc_${Date.now()}`,
          updatedAt: new Date().toISOString()
        }

        // Call the callback with the inserted document
        onDocumentInserted(insertedDocument)

        // Close the modal
        onClose()

        // Re-fetch documents to ensure the list is up to date
        if (typeof onSuccess === 'function') {
          onSuccess()
        }
      } else {
        throw new Error('Failed to insert document')
      }
    } catch (error) {
      setError(
        error.name === 'LiteralSyntaxError'
          ? error.message
          : `Error inserting document: ${error.message}`
      )
      setLoading(false)
    }
  }

  const hasErrors = validateDocument(documentData).some((d) => d.severity === 'error')

  const PlusIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Insert document'
      subtitle={`${databaseName} \u203a ${collectionName}`}
      icon={PlusIcon}
      size='lg'
      footer={
        <>
          <Button variant='secondary' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={hasErrors}>
            Insert document
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className='mb-1.5 block text-sm font-medium text-ink-700'>Document</label>
        <ObjectEditor
          value={documentData}
          onChange={setDocumentData}
          onSubmit={hasErrors ? undefined : handleSubmit}
        />
        <p className='mt-2 text-xs text-ink-500'>
          JavaScript object syntax - unquoted keys and single quotes are fine.{' '}
          <kbd className='rounded border border-ink-300 bg-ink-50 px-1 font-mono'>Ctrl</kbd>
          {' + '}
          <kbd className='rounded border border-ink-300 bg-ink-50 px-1 font-mono'>Enter</kbd>
          {' '}inserts. documentId and updatedAt are assigned automatically.
        </p>
        {error && <Alert tone='danger' className='mt-3'>{error}</Alert>}
      </form>

      <Alert tone='info' className='mt-4'>
        AxioDB is schema-less, so fields do not have to match the other documents in this
        collection.
      </Alert>
    </Modal>
  )
}

export default InsertDocumentModal
