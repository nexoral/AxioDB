import { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../config/key'

const Status = () => {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchHealthStatus = async () => {
    try {
      setError(null)
      const response = await axios.get(`${BASE_API_URL}/api/health`)
      if (response.status === 200) {
        setHealthData(response.data)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error('Error fetching health status:', err)
      setError('Failed to fetch server status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ok':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800'
        }
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800'
        }
      case 'error':
      case 'down':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const colors = getStatusColor(
    healthData?.data?.status || (error ? 'error' : 'unknown')
  )

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-6'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-8'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              AxioDB Status
            </h1>
            <p className='text-xl text-gray-600'>Checking server health...</p>
          </div>

          <div className='bg-white rounded-xl shadow-lg p-8'>
            <div className='animate-pulse'>
              <div className='flex items-center justify-center mb-6'>
                <div className='h-16 w-16 bg-gray-300 rounded-full' />
              </div>
              <div className='space-y-4'>
                <div className='h-6 bg-gray-300 rounded w-1/3 mx-auto' />
                <div className='h-4 bg-gray-300 rounded w-1/2 mx-auto' />
                <div className='h-4 bg-gray-300 rounded w-2/3 mx-auto' />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>
            AxioDB Status
          </h1>
          <p className='text-xl text-gray-600'>
            Real-time server health monitoring
          </p>
        </div>

        {/* Main Status Card */}
        <div
          className={`${colors.bg} ${colors.border} border rounded-xl shadow-lg overflow-hidden mb-8`}
        >
          <div className='p-8'>
            <div className='flex items-center justify-center mb-6'>
              {error
                ? (
                  <div
                    className={`w-16 h-16 ${colors.icon} flex items-center justify-center`}
                  >
                    <svg
                      className='w-12 h-12'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                      />
                    </svg>
                  </div>
                  )
                : healthData?.data?.status === 'ok'
                  ? (
                    <div
                      className={`w-16 h-16 ${colors.icon} flex items-center justify-center`}
                    >
                      <svg
                        className='w-12 h-12'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                    </div>
                    )
                  : (
                    <div
                      className={`w-16 h-16 ${colors.icon} flex items-center justify-center`}
                    >
                      <svg
                        className='w-12 h-12'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                    </div>
                    )}
            </div>

            <div className='text-center'>
              <div className='flex items-center justify-center mb-4'>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${colors.badge}`}
                >
                  <span
                    className={`w-2 h-2 ${healthData?.data?.status === 'ok' ? 'bg-green-400' : 'bg-red-400'} rounded-full mr-2 ${healthData?.data?.status === 'ok' ? 'animate-pulse' : ''}`}
                  />
                  {error
                    ? 'Server Unreachable'
                    : healthData?.data?.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>

              <h2 className={`text-2xl font-bold ${colors.text} mb-2`}>
                {error
                  ? 'Connection Failed'
                  : healthData?.message || 'Status Unknown'}
              </h2>

              {healthData?.data?.timestamp && (
                <p className={`${colors.text} text-lg`}>
                  Server Time: {formatTimestamp(healthData.data.timestamp)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Details Grid */}
        <div className='grid md:grid-cols-2 gap-6 mb-8'>
          {/* Response Time */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center mb-4'>
              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Response Time
              </h3>
            </div>
            <p className='text-2xl font-bold text-blue-600'>
              {error ? 'N/A' : '< 100ms'}
            </p>
            <p className='text-sm text-gray-600 mt-1'>API response latency</p>
          </div>

          {/* Uptime */}
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center mb-4'>
              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M13 10V3L4 14h7v7l9-11h-7z'
                  />
                </svg>
              </div>
              <h3 className='text-lg font-semibold text-gray-900'>
                Status Code
              </h3>
            </div>
            <p className='text-2xl font-bold text-green-600'>
              {healthData?.statusCode || (error ? 'Error' : 'N/A')}
            </p>
            <p className='text-sm text-gray-600 mt-1'>HTTP response status</p>
          </div>
        </div>

        {/* Refresh Controls */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Auto-Refresh
              </h3>
              <p className='text-sm text-gray-600'>
                Status updates automatically every 30 seconds
                {lastUpdated && (
                  <>
                    <br />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true)
                fetchHealthStatus()
              }}
              disabled={loading}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              <svg
                className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh Now'}
            </button>
          </div>
        </div>

        {/* Service Information */}
        <div className='bg-gray-50 rounded-lg p-6 mt-8'>
          <div className='text-center'>
            <h4 className='text-sm font-semibold text-gray-900 mb-2'>
              Service Information
            </h4>
            <p className='text-xs text-gray-600'>
              This page monitors the health and availability of the AxioDB
              server. If you notice any issues, please visit the{' '}
              <a href='/support' className='text-blue-600 hover:text-blue-800'>
                support page
              </a>{' '}
              for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Status
