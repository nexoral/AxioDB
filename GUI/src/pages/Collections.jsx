import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CreateCollectionModal from '../components/collection/CreateCollectionModal'
import DeleteCollectionModal from '../components/collection/DeleteCollectionModal'
import { BASE_API_URL } from '../config/key'
import { DBInfoStore, ExchangeKeyStore } from '../store/store'

const Collections = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState('')
  const databaseName = searchParams.get('database')
  const { TransactionKey } = ExchangeKeyStore((state) => state)
  const { Rootname } = DBInfoStore((state) => state)

  // Extract the fetchCollections function so we can reuse it
  const fetchCollections = async () => {
    try {
      const response = await axios.get(
        `${BASE_API_URL}/api/collection/all/?databaseName=${databaseName}&transactiontoken=${TransactionKey}`
      )
      if (response.status === 200) {
        const collectionData = response.data.data || {}

        // Transform the collection data to match our component's expected format
        if (
          collectionData.ListOfCollections &&
          Array.isArray(collectionData.ListOfCollections)
        ) {
          const collectionSizeMap = collectionData.CollectionSizeMap || []
          const collectionMetaStatus =
            collectionData.collectionMetaStatus || []

          const formattedCollections = collectionData.ListOfCollections.map(
            (collectionName) => {
              // Find the corresponding size info in CollectionSizeMap
              const sizeInfo = collectionSizeMap.find((item) => {
                const pathParts = item.folderPath.split('/')
                const folderName = pathParts[pathParts.length - 1]
                return folderName === collectionName
              })

              // Find metadata for the collection
              const metadata = collectionMetaStatus.find(
                (meta) => meta.name === collectionName
              )

              return {
                name: collectionName,
                documentCount: sizeInfo ? sizeInfo.fileCount : 0,
                isEncrypted: metadata?.isEncrypted || false,
                isSchemaNeeded: metadata?.isSchemaNeeded || false
              }
            }
          )

          setCollections(formattedCollections)
        } else {
          setCollections([])
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
      setLoading(false)
      setCollections([])
    }
  }

  useEffect(() => {
    // If no database is specified, redirect to databases page
    if (!databaseName) {
      navigate('/databases')
      return
    }

    // Fetch collections for the specified database
    if (TransactionKey) {
      fetchCollections()
    }
  }, [TransactionKey, databaseName, navigate])

  const handleBackToDatabases = () => {
    navigate('/databases')
  }

  // Update this handler to re-fetch all collections instead of just adding the new one
  const handleCreateCollection = () => {
    // Refetch all collections to get the updated list
    fetchCollections()
  }

  const handleDeleteClick = (collectionName) => {
    setCollectionToDelete(collectionName)
    setShowDeleteModal(true)
  }

  // Similarly, update the delete handler to re-fetch instead of removing from state
  const handleCollectionDeleted = () => {
    // Refetch all collections to get the updated list
    fetchCollections()
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <div className='flex items-center mb-2'>
            <button
              onClick={handleBackToDatabases}
              className='text-blue-600 hover:text-blue-800 mr-3'
            >
              ← Back to Databases
            </button>
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>Collections</h1>
          <p className='text-gray-600'>
            Collections in database:{' '}
            <span className='font-medium'>{databaseName}</span>
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className='bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center transition-colors'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-5 w-5 mr-2'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z'
              clipRule='evenodd'
            />
          </svg>
          Create Collection
        </button>
      </div>

      <div className='bg-white rounded-lg shadow-md overflow-hidden'>
        <div className='border-b border-gray-200 bg-gray-50 px-6 py-4'>
          <h3 className='text-lg font-medium text-gray-900'>
            Collections in {databaseName}
          </h3>
          <p className='text-sm text-gray-500'>
            Total:{' '}
            {loading
              ? 'Loading...'
              : collections.length > 0
                ? `${collections.length} Collections`
                : '0 Collections'}
          </p>
        </div>

        {loading ? (
          <div className='p-6'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='animate-pulse flex items-center justify-between py-4 border-b border-gray-100'
              >
                <div>
                  <div className='h-6 bg-gray-200 rounded w-48 mb-2' />
                  <div className='h-4 bg-gray-100 rounded w-32' />
                </div>
                <div className='h-8 bg-gray-200 rounded w-24' />
              </div>
            ))}
          </div>
        ) : (
          <ul className='divide-y divide-gray-200'>
            {collections.length > 0 ? (
              collections.map((collection) => (
                <li
                  key={collection.name}
                  className='px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors'
                >
                  <div>
                    <h4 className='text-lg font-medium text-gray-900 flex items-center'>
                      {collection.name}
                      {/* Encryption Status Icon */}
                      {collection.isEncrypted
                        ? (
                          <span
                            className='ml-2 text-green-600'
                            title='Encrypted Collection'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-5 w-5'
                              viewBox='0 0 20 20'
                              fill='currentColor'
                            >
                              <path
                                fillRule='evenodd'
                                d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                                clipRule='evenodd'
                              />
                            </svg>
                          </span>
                          )
                        : (
                          <span
                            className='ml-2 text-gray-400'
                            title='Unencrypted Collection'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-5 w-5'
                              viewBox='0 0 20 20'
                              fill='currentColor'
                            >
                              <path d='M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z' />
                            </svg>
                          </span>
                          )}
                      {/* Schema Status Icon */}
                      {collection.isSchemaNeeded
                        ? (
                          <span
                            className='ml-2 text-blue-600'
                            title='Schema-based Collection'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-5 w-5'
                              viewBox='0 0 20 20'
                              fill='currentColor'
                            >
                              <path
                                fillRule='evenodd'
                                d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                                clipRule='evenodd'
                              />
                            </svg>
                          </span>
                          )
                        : (
                          <span
                            className='ml-2 text-gray-400'
                            title='Schema-less Collection'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-5 w-5'
                              viewBox='0 0 20 20'
                              fill='currentColor'
                            >
                              <path d='M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' />
                            </svg>
                          </span>
                          )}
                    </h4>
                    <p className='text-sm text-gray-500'>
                      {collection.documentCount} documents
                    </p>
                  </div>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() =>
                        navigate(
                          `/collections/documents?database=${databaseName}&collection=${collection.name}`
                        )}
                      className='text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors'
                    >
                      View Documents
                    </button>
                    <button
                      onClick={() => handleDeleteClick(collection.name)}
                      className='text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:border-red-400 transition-colors'
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className='px-6 py-8 text-center text-gray-500'>
                No collections found in this database. Click "Create Collection"
                to add one.
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCollectionCreated={handleCreateCollection}
          databaseName={databaseName}
        />
      )}

      {/* Delete Collection Modal */}
      {showDeleteModal && (
        <DeleteCollectionModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onCollectionDeleted={handleCollectionDeleted}
          databaseName={databaseName}
          collectionName={collectionToDelete}
        />
      )}
    </div>
  )
}

export default Collections
