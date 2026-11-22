import { useState, useEffect, useRef } from 'react'
import apiClient, { insertManyDocuments } from '../../api/client'
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
  fields = [],
  onSuccess
}) => {
  const [mode, setMode] = useState('single') // 'single' | 'bulk'
  const [documentData, setDocumentData] = useState("{\n  \n}")
  const [bulkData, setBulkData] = useState("[\n  \n]")
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bulkCount, setBulkCount] = useState(0)
  const fileInputRef = useRef(null)

  // Reset modal state cleanly whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setMode('single')
      setDocumentData("{\n  \n}")
      setBulkData("[\n  \n]")
      setError('')
      setLoading(false)
      setBulkCount(0)
    }
  }, [isOpen])

  // Parse bulk count preview dynamically - only counts non-empty objects
  useEffect(() => {
    if (mode === 'bulk') {
      try {
        const parsed = JSON.parse(bulkData)
        if (Array.isArray(parsed)) {
          const validDocs = parsed.filter(
            (d) => d && typeof d === 'object' && !Array.isArray(d) && Object.keys(d).length > 0
          )
          setBulkCount(validDocs.length)
        } else {
          setBulkCount(0)
        }
      } catch {
        setBulkCount(0)
      }
    }
  }, [bulkData, mode])

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result
        if (typeof content !== 'string') return

        const parsed = JSON.parse(content)
        if (Array.isArray(parsed)) {
          setBulkData(JSON.stringify(parsed, null, 2))
          setBulkCount(parsed.length)
          setError('')
        } else if (typeof parsed === 'object' && parsed !== null) {
          // Wrapped in array for bulk
          setBulkData(JSON.stringify([parsed], null, 2))
          setBulkCount(1)
          setError('')
        } else {
          setError('JSON file must contain an array of documents or a document object')
        }
      } catch (err) {
        setError(`Failed to read JSON file: ${err.message}`)
      }
    }
    reader.onerror = () => setError('Failed to read file from disk')
    reader.readAsText(file)
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setError('')
    setLoading(true)

    try {
      if (mode === 'single') {
        const parsedData = parseLiteral(documentData)
        if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
          throw new Error('Document must be a valid JSON object')
        }

        const response = await apiClient.post(
          `/api/operation/create/?dbName=${encodeURIComponent(databaseName)}&collectionName=${encodeURIComponent(collectionName)}`,
          {
            ...parsedData
          }
        )

        if (response.status === 200 || response.status === 201) {
          const documentId = response.data.data?.documentId
          const insertedDocument = {
            ...parsedData,
            documentId: documentId || `doc_${Date.now()}`,
            updatedAt: new Date().toISOString()
          }
          onDocumentInserted(insertedDocument)
          onClose()
          if (typeof onSuccess === 'function') onSuccess()
        } else {
          throw new Error('Failed to insert document')
        }
      } else {
        // Bulk Insert
        let parsedDocuments
        try {
          parsedDocuments = JSON.parse(bulkData)
        } catch {
          parsedDocuments = parseLiteral(bulkData)
        }

        if (!Array.isArray(parsedDocuments) || parsedDocuments.length === 0) {
          throw new Error('Bulk insert requires a non-empty JSON array of objects')
        }

        for (let i = 0; i < parsedDocuments.length; i++) {
          const doc = parsedDocuments[i]
          if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
            throw new Error(`Item at index ${i} is not a valid document object`)
          }
        }

        const response = await insertManyDocuments(databaseName, collectionName, parsedDocuments)

        if (response.statusCode === 200 || response.statusCode === 201 || response.status === true) {
          onDocumentInserted({ count: parsedDocuments.length, bulk: true })
          onClose()
          if (typeof onSuccess === 'function') onSuccess()
        } else {
          throw new Error(response.message || 'Failed to insert documents in bulk')
        }
      }
    } catch (error) {
      setError(
        error.name === 'LiteralSyntaxError'
          ? error.message
          : `Error inserting document(s): ${error.message}`
      )
    } finally {
      setLoading(false)
    }
  }

  const hasSingleErrors = mode === 'single' && validateDocument(documentData).some((d) => d.severity === 'error')

  const PlusIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Insert documents'
      subtitle={`${databaseName} \u203a ${collectionName}`}
      icon={PlusIcon}
      size='lg'
      footer={
        <>
          <Button variant='secondary' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={mode === 'single' ? hasSingleErrors : bulkCount === 0}
          >
            {mode === 'single' ? 'Insert document' : `Insert ${bulkCount} document${bulkCount === 1 ? '' : 's'}`}
          </Button>
        </>
      }
    >
      <div className='mb-4 flex items-center justify-between border-b border-ink-100 pb-3'>
        <div className='flex p-0.5 bg-ink-100 rounded-lg text-xs font-medium text-ink-600'>
          <button
            type='button'
            onClick={() => setMode('single')}
            className={`px-3 py-1 rounded-md transition-all ${
              mode === 'single'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'hover:text-ink-900'
            }`}
          >
            Single document
          </button>
          <button
            type='button'
            onClick={() => setMode('bulk')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              mode === 'bulk'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'hover:text-ink-900'
            }`}
          >
            Bulk insert (JSON / File)
          </button>
        </div>

        {mode === 'bulk' && (
          <div>
            <input
              type='file'
              accept='.json'
              ref={fileInputRef}
              onChange={handleFileUpload}
              className='hidden'
            />
            <Button
              size='sm'
              variant='secondary'
              onClick={() => fileInputRef.current?.click()}
              className='flex items-center gap-1.5'
            >
              <svg className='w-3.5 h-3.5 text-emerald-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' />
              </svg>
              Upload JSON file
            </Button>
          </div>
        )}
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSubmit}>
          <label className='mb-1.5 block text-sm font-medium text-ink-700'>Document</label>
          <ObjectEditor
            value={documentData}
            onChange={setDocumentData}
            onSubmit={hasSingleErrors ? undefined : handleSubmit}
            fields={fields}
          />
          <p className='mt-2 text-xs text-ink-500'>
            JavaScript object syntax — unquoted keys and single quotes are fine.{' '}
            <kbd className='rounded border border-ink-300 bg-ink-50 px-1 font-mono'>Ctrl</kbd>
            {' + '}
            <kbd className='rounded border border-ink-300 bg-ink-50 px-1 font-mono'>Enter</kbd>
            {' '}inserts. documentId and updatedAt are assigned automatically.
          </p>
        </form>
      ) : (
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium text-ink-700'>JSON Documents Array</label>
            <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
              bulkCount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-ink-100 text-ink-500'
            }`}>
              {bulkCount} {bulkCount === 1 ? 'document' : 'documents'} detected
            </span>
          </div>

          <textarea
            rows={10}
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            placeholder='[\n  {\n    "name": "Doc 1"\n  },\n  {\n    "name": "Doc 2"\n  }\n]'
            className='w-full font-mono text-xs p-3 bg-ink-50 border border-ink-200 rounded-lg text-ink-900 focus:outline-hidden focus:border-emerald-500 focus:bg-white resize-y'
          />
          <p className='text-xs text-ink-500'>
            Paste a JSON array of documents or upload a .json file. Works over both HTTP and TCP.
          </p>
        </div>
      )}

      {error && <Alert tone='danger' className='mt-3'>{error}</Alert>}

      <Alert tone='info' className='mt-4'>
        AxioDB is schema-less. You can insert any arbitrary document structure, including vectors or nested fields.
      </Alert>
    </Modal>
  )
}

export default InsertDocumentModal
