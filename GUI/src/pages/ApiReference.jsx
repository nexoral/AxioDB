import { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../config/key'

const ApiReference = () => {
  const [apiRoutes, setApiRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedGroups, setExpandedGroups] = useState({})

  useEffect(() => {
    const fetchApiRoutes = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${BASE_API_URL}/api/routes`)

        // Extract the data from the response structure
        if (
          response.data &&
          response.data.data &&
          Array.isArray(response.data.data)
        ) {
          setApiRoutes(response.data.data)

          // Initialize all groups as expanded
          const initialExpandedState = {}
          response.data.data.forEach((group) => {
            initialExpandedState[group.groupName] = true
          })
          setExpandedGroups(initialExpandedState)
        } else {
          throw new Error('Invalid API response format')
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching API routes:', err)
        setError('Failed to load API reference. Please try again later.')
        setLoading(false)
      }
    }

    fetchApiRoutes()
  }, [])

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  // Method color mapping
  const getMethodColor = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-600'
      case 'POST':
        return 'bg-brand-600'
      case 'PUT':
        return 'bg-amber-600'
      case 'DELETE':
        return 'bg-red-600'
      default:
        return 'bg-ink-600'
    }
  }

  // Render JSON payload with basic formatting
  const renderPayload = (payload) => {
    return (
      <pre className='mt-2 p-3 bg-ink-800 text-ink-200 rounded-md overflow-x-auto text-sm'>
        {JSON.stringify(payload, null, 2)}
      </pre>
    )
  }

  if (loading) {
    return (
      <div className='mx-auto w-full max-w-[120rem] px-4 py-8 sm:px-6 lg:px-8'>
        <h1 className='text-2xl font-bold mb-6'>API Reference</h1>
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500' />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='mx-auto w-full max-w-[120rem] px-4 py-8 sm:px-6 lg:px-8'>
        <h1 className='text-2xl font-bold mb-6'>API Reference</h1>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto w-full max-w-[120rem] px-4 py-8 sm:px-6 lg:px-8'>
      <h1 className='text-2xl font-bold mb-2'>API Reference</h1>
      <p className='text-ink-600 mb-6'>
        Complete documentation for the AxioDB REST API
      </p>

      {apiRoutes.length === 0 && !loading && !error
        ? (
          <div className='bg-warn-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded'>
            <p>
              No API routes found. The server might not have returned any routes.
            </p>
          </div>
          )
        : (
          <div className='space-y-6'>
            {apiRoutes.map((group) => (
              <div
                key={group.groupName}
                className='border border-ink-200 rounded-lg overflow-hidden'
              >
                <div
                  className='bg-ink-50 px-4 py-3 flex justify-between items-center cursor-pointer'
                  onClick={() => toggleGroup(group.groupName)}
                >
                  <div>
                    <h2 className='text-lg font-medium text-ink-900'>
                      {group.groupName}
                    </h2>
                    <p className='text-sm text-ink-500'>{group.description}</p>
                  </div>
                  <div className='text-ink-500'>
                    {expandedGroups[group.groupName]
                      ? (
                        <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                          fillRule='evenodd'
                          d='M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z'
                          clipRule='evenodd'
                        />
                </svg>
                        )
                      : (
                        <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                          fillRule='evenodd'
                          d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z'
                          clipRule='evenodd'
                        />
                </svg>
                        )}
                  </div>
                </div>

                {expandedGroups[group.groupName] && (
                  <div className='divide-y divide-ink-200'>
                    {group.Paths.map((path, index) => (
                      <div key={index} className='p-4 hover:bg-ink-50'>
                        <div className='flex items-start'>
                  <span
                          className={`${getMethodColor(path.method)} text-white text-xs font-bold px-2 py-1 rounded mr-3 min-w-16 text-center`}
                        >
                          {path.method}
                        </span>
                  <div className='flex-1'>
                          <div className='font-mono text-sm bg-ink-100 p-2 rounded mb-2 overflow-x-auto'>
                            {path.path}
                          </div>
                          <p className='text-ink-700 mb-2'>
                            {path.description}
                          </p>

                          {path.payload && (
                            <div>
                              <h4 className='text-sm font-semibold text-ink-700 mt-2 mb-1'>
                                Payload:
                              </h4>
                              {renderPayload(path.payload)}
                            </div>
                          )}
                        </div>
                </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
    </div>
  )
}

export default ApiReference
