import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_API_URL } from '../../config/key'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { Alert, EmptyState, Skeleton } from '../ui/Feedback'

const DatabaseIcon = (
  <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={1.8}>
    <ellipse cx='12' cy='6' rx='8' ry='3' />
    <path d='M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6' />
    <path d='M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3' />
  </svg>
)

/**
 * Database cards. One card per database with its path and actions.
 *
 * Export failures now surface as an inline alert rather than `window.alert()` - a native
 * dialog blocks the whole page and can't show the server's message legibly.
 */
const DatabaseList = ({ databases, onDeleteClick, onCreateClick, loading }) => {
  const navigate = useNavigate()
  const [exporting, setExporting] = useState(null)
  const [exportError, setExportError] = useState(null)

  const handleExportDatabase = async (dbName) => {
    setExporting(dbName)
    setExportError(null)

    try {
      const response = await axios.get(
        `${BASE_API_URL}/api/db/export-database/?dbName=${encodeURIComponent(dbName)}`,
        { responseType: 'blob' }
      )

      // The server answers errors as JSON even on a blob request, so an "ok" response can
      // still be a failure wearing a Blob.
      if (response.data instanceof Blob && response.data.type === 'application/json') {
        setExportError(`Export failed: ${await response.data.text()}`)
        return
      }

      if (!response.data || response.data.size === 0) {
        setExportError('Export failed: the server returned an empty file.')
        return
      }

      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url

      const disposition = response.headers['content-disposition']
      const match = disposition?.match(/filename="(.+)"/)
      link.setAttribute('download', match ? match[1] : `${dbName}.tar.gz`)

      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting database:', error)
      const payload = error.response?.data
      const message =
        payload instanceof Blob
          ? await payload.text().catch(() => null)
          : payload?.message
      setExportError(`Export failed: ${message || error.message}`)
    } finally {
      setExporting(null)
    }
  }

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
        {[0, 1, 2].map((i) => (
          <Card key={i} className='p-5'>
            <div className='flex items-start gap-3'>
              <Skeleton className='h-12 w-12 rounded-xl' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-5 w-2/3' />
                <Skeleton className='h-3 w-full' />
              </div>
            </div>
            <Skeleton className='mt-5 h-9 w-full' />
          </Card>
        ))}
      </div>
    )
  }

  const list = databases?.ListOfDatabases ?? []

  if (list.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={DatabaseIcon}
          title='No databases yet'
          description='A database groups related collections. Create your first one to get started.'
          action={onCreateClick && <Button onClick={onCreateClick}>Create Database</Button>}
        />
      </Card>
    )
  }

  return (
    <>
      {exportError && (
        <Alert tone='danger' className='mb-5'>{exportError}</Alert>
      )}

      <div className='stagger grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
        {list.map((dbName, index) => (
          <Card key={dbName} className='flex flex-col p-5'>
            <div className='flex items-start gap-3'>
              <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600'>
                {DatabaseIcon}
              </span>
              <div className='min-w-0 flex-1'>
                <h3 className='truncate text-base font-semibold text-ink-900'>{dbName}</h3>
                <p
                  className='truncate font-mono text-xs text-ink-500'
                  title={databases.AllDatabasesPaths?.[index]}
                >
                  {databases.AllDatabasesPaths?.[index]}
                </p>
              </div>
            </div>

            <div className='mt-5 flex flex-wrap gap-2 border-t border-ink-100 pt-4'>
              <Button
                size='sm'
                className='flex-1'
                onClick={() => navigate(`/collections?database=${encodeURIComponent(dbName)}`)}
              >
                Collections
              </Button>
              <Button
                size='sm'
                variant='secondary'
                loading={exporting === dbName}
                onClick={() => handleExportDatabase(dbName)}
              >
                Export
              </Button>
              <Button
                size='sm'
                variant='dangerGhost'
                onClick={() => onDeleteClick(dbName)}
                aria-label={`Delete database ${dbName}`}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

export default DatabaseList
