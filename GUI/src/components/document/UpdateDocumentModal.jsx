/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../../config/key'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Alert } from '../ui/Feedback'
import ObjectEditor from '../query/ObjectEditor'
import { formatLiteral, parseLiteral, validateDocument } from '../query/queryLanguage'

const UpdateDocumentModal = ({
  isOpen,
  onClose,
  onDocumentUpdated,
  document,
  databaseName,
  collectionName
}) => {
  const [documentData, setDocumentData] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (document) {
      // Create a copy without the documentId and updatedAt
      const { documentId, updatedAt, ...docCopy } = document
      setDocumentData(formatLiteral(docCopy))
    }
  }, [document])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      // The editor speaks JS object literals; axios serialises the result to JSON.
      const parsedData = parseLiteral(documentData)
      setLoading(true)

      // Send to the API using the correct endpoint structure
      const response = await axios.put(
        `${BASE_API_URL}/api/operation/update/by-id/?dbName=${databaseName}&collectionName=${collectionName}&documentId=${document.documentId}`,
        {
          ...parsedData
        }
      )

      if (response.status === 200) {
        // Get the updated document data from the response or construct it
        const updatedDocument = response.data.data?.document || {
          ...parsedData,
          documentId: document.documentId,
          updatedAt: new Date().toISOString()
        }

        onDocumentUpdated(updatedDocument)
        onClose()
      } else {
        throw new Error('Failed to update document')
      }
    } catch (error) {
      setError(
        error.name === 'LiteralSyntaxError'
          ? error.message
          : `Error updating document: ${error.message}`
      )
      setLoading(false)
    }
  }

  const hasErrors = validateDocument(documentData).some((d) => d.severity === 'error')

  const PencilIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Update document'
      subtitle={document?.documentId}
      icon={PencilIcon}
      size='lg'
      footer={
        <>
          <Button variant='secondary' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={hasErrors}>
            Save changes
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
          {' '}saves. documentId and updatedAt are managed by AxioDB.
        </p>
        {error && <Alert tone='danger' className='mt-3'>{error}</Alert>}
      </form>

      <Alert tone='warn' className='mt-4' title='Updates are a shallow merge'>
        Fields you list replace their existing values; fields you omit are left untouched.
        There is no $set or $inc - nested objects are replaced wholesale, not merged.
      </Alert>
    </Modal>
  )
}

export default UpdateDocumentModal
