import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_API_URL } from '../../config/key'
import { ExchangeKeyStore } from '../../store/store'

const DatabaseList = ({ databases, onDeleteClick, loading }) => {
  const navigate = useNavigate()
  const { TransactionKey } = ExchangeKeyStore((state) => state)
  // State for animation when items are added or removed
  const [animatingItems, setAnimatingItems] = useState({})

  // This would be used if we wanted entrance animations for newly added databases
  const handleItemAnimationEnd = (dbName) => {
    setAnimatingItems((prev) => ({
      ...prev,
      [dbName]: false
    }))
  }

  const handleViewCollections = (dbName) => {
    navigate(`/collections?database=${encodeURIComponent(dbName)}`)
  }

  const handleExportDatabase = async (dbName) => {
    try {
      console.log('Starting export for database:', dbName)
      console.log('Transaction Key:', TransactionKey)
      console.log(
        'API URL:',
        `${BASE_API_URL}/api/db/export-database/?transactiontoken=${TransactionKey}&dbName=${encodeURIComponent(dbName)}`
      )

      const response = await axios.get(
        `${BASE_API_URL}/api/db/export-database/?transactiontoken=${TransactionKey}&dbName=${encodeURIComponent(dbName)}`,
        {
          responseType: 'blob'
        }
      )

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      console.log('Response data type:', typeof response.data)
      console.log('Response data size:', response.data?.size)

      // Check if the response is actually JSON (error response) disguised as blob
      if (
        response.data instanceof Blob &&
        response.data.type === 'application/json'
      ) {
        const text = await response.data.text()
        console.error('Received JSON error response:', text)
        alert(`Export failed: ${text}`)
        return
      }

      // Check if response data exists and has size
      if (!response.data || response.data.size === 0) {
        console.error('Empty response received')
        alert('Export failed: Empty file received')
        return
      }

      // Create blob link to download
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url

      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition']
      let filename = `${dbName}.tar.gz`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      console.log('Downloading file as:', filename)

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      console.log('Download initiated successfully')
    } catch (error) {
      console.error('Error exporting database:', error)
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
        console.error('Error response headers:', error.response.headers)

        // Try to read the error response if it's a blob
        if (error.response.data instanceof Blob) {
          try {
            const errorText = await error.response.data.text()
            console.error('Error response text:', errorText)
            alert(`Export failed: ${errorText}`)
          } catch (readError) {
            console.error('Could not read error response:', readError)
            alert('Failed to export database. Please try again.')
          }
        } else {
          alert(
            `Export failed: ${error.response.data?.message || error.message}`
          )
        }
      } else {
        alert('Failed to export database. Please try again.')
      }
    }
  }

  return (
    <div className='bg-white rounded-lg shadow-md overflow-hidden'>
      <div className='border-b border-gray-200 bg-gray-50 px-6 py-4'>
        <h3 className='text-lg font-medium text-gray-900'>Your Databases</h3>
        <p className='text-sm text-gray-500'>
          Total: {loading ? 'Loading...' : databases?.TotalDatabases}
        </p>
      </div>

      {loading ? (
        // Loading animation for database list
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
          {databases?.ListOfDatabases &&
          databases?.ListOfDatabases.length > 0
            ? (
                databases.ListOfDatabases.map((dbName, index) => (
                  <li
                    key={dbName}
                    className={`px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-300 ${
                  animatingItems[dbName] ? 'animate-slideIn' : 'animate-fadeIn'
                }`}
                    onAnimationEnd={() => handleItemAnimationEnd(dbName)}
                  >
                    <div>
                      <h4 className='text-lg font-medium text-gray-900'>
                        {dbName}
                      </h4>
                      <p className='text-sm text-gray-500'>
                        Path: {databases.AllDatabasesPaths[index]}
                      </p>
                    </div>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => handleViewCollections(dbName)}
                        className='text-blue-600 hover:text-blue-800 px-3 py-1 rounded border border-blue-200 hover:border-blue-400 transition-colors'
                      >
                        View Collections
                      </button>
                      <button
                        onClick={() => handleExportDatabase(dbName)}
                        className='text-green-600 hover:text-green-800 px-3 py-1 rounded border border-green-200 hover:border-green-400 transition-colors'
                      >
                        Export DB
                      </button>
                      <button
                        onClick={() => onDeleteClick(dbName)}
                        className='text-red-600 hover:text-red-800 px-3 py-1 rounded border border-red-200 hover:border-red-400 transition-colors'
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))
              )
            : (
              <li className='px-6 py-8 text-center text-gray-500'>
                No databases found. Click "Create Database" to add one.
              </li>
              )}
        </ul>
      )}
    </div>
  )
}

export default DatabaseList
