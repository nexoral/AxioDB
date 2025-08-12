import { DocumentTextIcon } from '@heroicons/react/outline'
import { useEffect, useState } from 'react'

/**
 * Component to display the total number of documents in the AxioDB system
 */
const TotalDocumentsCard = ({ totalDocuments }) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = () => {
      setTimeout(() => {
        setLoading(false)
      }, 700)
    }

    fetchData()
  }, [])

  return (
    <div className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'>
      <div className='flex justify-between'>
        <div>
          <h3 className='text-lg font-medium text-gray-900'>Total Documents</h3>
          {loading
            ? (
              <div className='h-8 mt-2 bg-gray-200 rounded animate-pulse w-20' />
              )
            : (
              <p className='text-3xl font-bold text-purple-600 mt-2'>
                {totalDocuments}
              </p>
              )}
          <p className='text-sm text-gray-500 mt-1'>Across all collections</p>
        </div>
        <div className='p-3 bg-purple-100 rounded-full'>
          <DocumentTextIcon className='h-8 w-8 text-purple-600' />
        </div>
      </div>
    </div>
  )
}

export default TotalDocumentsCard
