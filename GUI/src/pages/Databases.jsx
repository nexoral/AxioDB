import { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../config/key'
import { DBInfoStore } from '../store/store'
import CreateDatabaseModal from '../components/database/CreateDatabaseModal'
import DeleteDatabaseModal from '../components/database/DeleteDatabaseModal'
import DatabaseList from '../components/database/DatabaseList'
import Button from '../components/ui/Button'
import { Alert } from '../components/ui/Feedback'

const PlusIcon = (
  <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
    <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
  </svg>
)

const Databases = () => {
  const [loading, setLoading] = useState(true)
  const [databases, setDatabases] = useState([])
  const [error, setError] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [dbToDelete, setDbToDelete] = useState('')
  const { Rootname } = DBInfoStore((state) => state)

  useEffect(() => {
    let cancelled = false

    axios
      .get(`${BASE_API_URL}/api/db/databases`)
      .then((response) => {
        if (cancelled) return
        setDatabases(response.data.data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Error fetching databases:', err)
        setError(err.response?.data?.message || 'Could not load databases.')
        setDatabases([])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const handleDeleteClick = (dbName) => {
    setDbToDelete(dbName)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = () => {
    setDatabases((prev) => ({
      ...prev,
      ListOfDatabases: prev.ListOfDatabases.filter((db) => db !== dbToDelete),
      TotalDatabases: `${prev.ListOfDatabases.length - 1} Databases`
    }))
    setShowDeleteModal(false)
    setDbToDelete('')
  }

  const handleCreateDatabase = (newDbName) => {
    setDatabases((prev) => ({
      ...prev,
      ListOfDatabases: [...prev.ListOfDatabases, newDbName],
      TotalDatabases: `${prev.ListOfDatabases.length + 1} Databases`,
      AllDatabasesPaths: [...prev.AllDatabasesPaths, `${prev.CurrentPath}/${newDbName}`]
    }))
  }

  return (
    <div className='mx-auto w-full max-w-[120rem] px-4 py-8 sm:px-6 lg:px-8'>
      <header className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl'>Databases</h1>
          <p className='mt-1 text-sm text-ink-500'>
            Every database inside <span className='font-medium text-ink-700'>{Rootname}</span>.
          </p>
        </div>
        <Button size='lg' icon={PlusIcon} onClick={() => setShowCreateModal(true)}>
          Create Database
        </Button>
      </header>

      {error && <Alert tone='danger' title='Could not load databases' className='mb-6'>{error}</Alert>}

      <DatabaseList
        databases={databases}
        onDeleteClick={handleDeleteClick}
        onCreateClick={() => setShowCreateModal(true)}
        loading={loading}
      />

      <CreateDatabaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onDatabaseCreated={handleCreateDatabase}
      />

      <DeleteDatabaseModal
        isOpen={showDeleteModal}
        dbName={dbToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  )
}

export default Databases
