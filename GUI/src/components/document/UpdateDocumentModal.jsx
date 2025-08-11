/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import axios from 'axios'
import { ExchangeKeyStore } from '../../store/store'
import { BASE_API_URL } from '../../config/key'

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
  const { TransactionKey } = ExchangeKeyStore((state) => state)

  useEffect(() => {
    if (document) {
      // Create a copy without the documentId and updatedAt
      const { documentId, updatedAt, ...docCopy } = document
      setDocumentData(JSON.stringify(docCopy, null, 2))
    }
  }, [document])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      // Validate JSON
      const parsedData = JSON.parse(documentData)
      setLoading(true)

      // Send to the API using the correct endpoint structure
      const response = await axios.put(
        `${BASE_API_URL}/api/operation/update/?dbName=${databaseName}&collectionName=${collectionName}&documentId=${document.documentId}&transactiontoken=${TransactionKey}`,
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
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your input.')
      } else {
        setError(`Error updating document: ${error.message}`)
      }
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center backdrop-blur-sm'>
      <div className='relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col'>
        <div className='flex justify-between items-center p-5 border-b'>
          <h3 className='text-xl font-semibold text-gray-900 flex items-center'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6 mr-2 text-indigo-500'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            Update Document
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-500 transition-colors'
          >
            <svg
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        <div className='p-6 overflow-y-auto flex-grow'>
          <div className='mb-4 flex items-center space-x-2 bg-indigo-50 p-3 rounded-md'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5 text-indigo-500'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                clipRule='evenodd'
              />
            </svg>
            <p className='text-sm text-indigo-700'>
              Edit the document data in JSON format
            </p>
          </div>

          {error && (
            <div className='mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700'>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className='mb-4'>
              <div className='flex justify-between items-center mb-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  Document Data (JSON)
                </label>
                <div className='flex items-center'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-5 w-5 mr-1 text-yellow-500'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                  <span className='text-xs text-gray-500 font-mono'>
                    ID: {document.documentId}
                  </span>
                </div>
              </div>
              <textarea
                value={documentData}
                onChange={(e) => setDocumentData(e.target.value)}
                className='w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-inner bg-gray-50'
                placeholder='Enter JSON document data'
                required
              />
              <p className='mt-2 text-xs text-gray-500'>
                You cannot change the document's ID. The updatedAt field will be
                automatically updated.
              </p>
            </div>

            <div className='flex justify-end space-x-3 mt-6'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className={`px-4 py-2 rounded-md text-white flex items-center ${
                  loading
                    ? 'bg-indigo-500'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } transition-colors shadow-md`}
              >
                {loading
                  ? (
                    <>
                      <svg
                        className='animate-spin h-5 w-5 mr-2'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        />
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        />
                      </svg>
                      Updating...
                    </>
                    )
                  : (
                      'Update Document'
                    )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
export default UpdateDocumentModal
