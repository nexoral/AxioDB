/* eslint-disable no-unused-vars */
import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CreateCollectionModal from '../components/collection/CreateCollectionModal'
import DeleteCollectionModal from '../components/collection/DeleteCollectionModal'
import { BASE_API_URL } from '../config/key'
import { DBInfoStore } from '../store/store'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Badge, EmptyState, Skeleton } from '../components/ui/Feedback'

const Collections = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState([])
  const [collectionMetaStatus, setCollectionMetaStatus] = useState([]) // Store full metadata
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState('')
  const databaseName = searchParams.get('database')
  const { Rootname } = DBInfoStore((state) => state)

  // Extract the fetchCollections function so we can reuse it
  const fetchCollections = async () => {
    try {
      const response = await axios.get(
        `${BASE_API_URL}/api/collection/all/?databaseName=${databaseName}`
      )
      if (response.status === 200) {
        const collectionData = response.data.data || {}

        // Transform the collection data to match our component's expected format
        if (
          collectionData.ListOfCollections &&
          Array.isArray(collectionData.ListOfCollections)
        ) {
          const collectionSizeMap = collectionData.CollectionSizeMap || []
          const metaStatus = collectionData.collectionMetaStatus || []

          // Store the full metadata for later use
          setCollectionMetaStatus(metaStatus)

          const formattedCollections = collectionData.ListOfCollections.map(
            (collectionName) => {
              // Find the corresponding size info in CollectionSizeMap
              const sizeInfo = collectionSizeMap.find((item) => {
                const pathParts = item.folderPath.split('/')
                const folderName = pathParts[pathParts.length - 1]
                return folderName === collectionName
              })

              // Find metadata for the collection
              const metadata = metaStatus.find(
                (meta) => meta.name === collectionName
              )

              return {
                name: collectionName,
                documentCount: sizeInfo ? sizeInfo.fileCount : 0,
                isSchemaNeeded: metadata?.isSchemaNeeded || false,
                schema: metadata?.schema || {} // Include the schema
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
    fetchCollections()
  }, [databaseName, navigate])

  const handleBackToDatabases = () => {
    navigate('/operations')
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
    <div className='mx-auto w-full max-w-[120rem] px-4 py-8 sm:px-6 lg:px-8'>
      <header className='mb-8'>
        <button
          onClick={handleBackToDatabases}
          className='mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-brand-700'
        >
          <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15 19l-7-7 7-7' />
          </svg>
          Databases
        </button>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl'>Collections</h1>
            <p className='mt-1 text-sm text-ink-500'>
              Inside <span className='font-medium text-ink-700'>{databaseName}</span>
            </p>
          </div>
          <Button
            size='lg'
            onClick={() => setShowCreateModal(true)}
            icon={
              <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
              </svg>
            }
          >
            Create Collection
          </Button>
        </div>
      </header>

      {loading
        ? (
          <div className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
            {[0, 1, 2].map((i) => (
              <Card key={i} className='p-5'>
                <div className='flex items-start gap-3'>
                  <Skeleton className='h-12 w-12 rounded-xl' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-5 w-2/3' />
                    <Skeleton className='h-3 w-1/3' />
                  </div>
                </div>
                <Skeleton className='mt-5 h-9 w-full' />
              </Card>
            ))}
          </div>
          )
        : collections.length === 0
          ? (
            <Card>
              <EmptyState
                icon={
                  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' />
                  </svg>
                }
                title='No collections yet'
                description={`A collection holds documents, like a table holds rows. Create the first one in ${databaseName}.`}
                action={<Button onClick={() => setShowCreateModal(true)}>Create Collection</Button>}
              />
            </Card>
            )
          : (
            <div className='stagger grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
              {collections.map((collection) => (
                <Card key={collection.name} className='flex flex-col p-5'>
                  <div className='flex items-start gap-3'>
                    <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600'>
                      <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
                        <path strokeLinecap='round' strokeLinejoin='round' d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' />
                      </svg>
                    </span>
                    <div className='min-w-0 flex-1'>
                      <h3 className='truncate text-base font-semibold text-ink-900'>
                        {collection.name}
                      </h3>
                      <Badge tone='neutral' className='mt-1.5'>
                        {collection.documentCount.toLocaleString()}{' '}
                        {collection.documentCount === 1 ? 'document' : 'documents'}
                      </Badge>
                    </div>
                  </div>

                  <div className='mt-5 flex gap-2 border-t border-ink-100 pt-4'>
                    <Button
                      size='sm'
                      className='flex-1'
                      onClick={() =>
                        navigate(
                          `/collections/documents?database=${encodeURIComponent(databaseName)}&collection=${encodeURIComponent(collection.name)}`
                        )}
                    >
                      Documents
                    </Button>
                    <Button
                      size='sm'
                      variant='dangerGhost'
                      onClick={() => handleDeleteClick(collection.name)}
                      aria-label={`Delete collection ${collection.name}`}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            )}

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
