import { useEffect, useState } from 'react'
import DatabaseTreeView from '../components/dashboard/DatabaseTreeView'
import InMemoryCacheCard from '../components/dashboard/InMemoryCacheCard'
import StorageUsageCard from '../components/dashboard/StorageUsageCard'
import TotalCollectionsCard from '../components/dashboard/TotalCollectionsCard'
import TotalDatabasesCard from '../components/dashboard/TotalDatabasesCard'
import TotalDocumentsCard from '../components/dashboard/TotalDocumentsCard'

import axios from 'axios'
import { BASE_API_URL } from '../config/key'
import { DBInfoStore } from '../store/store'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [AllInstanceInfo, setAllInstanceInfo] = useState(null)

  useEffect(() => {
    axios
      .get(`${BASE_API_URL}/api/dashboard-stats`)
      .then((response) => {
        if (response.status === 200) {
          setAllInstanceInfo(response.data.data)
          setLoading(false)
        }
      })
  }, [])

  return (
    <div className='container mx-auto px-4 py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
      </div>

      {loading ? (
        // Loading skeleton for metrics
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className='h-32 bg-gray-200 rounded-lg animate-pulse'
            />
          ))}
        </div>
      ) : (
        // Stats cards row
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8'>
          <TotalDatabasesCard
            totalDatabases={AllInstanceInfo?.totalDatabases || 0}
          />
          <TotalCollectionsCard
            totalCollections={AllInstanceInfo?.totalCollections || 0}
          />
          <TotalDocumentsCard
            totalDocuments={AllInstanceInfo?.totalDocuments || 0}
          />
          <StorageUsageCard storageInfo={AllInstanceInfo?.storageInfo || {}} />
          <InMemoryCacheCard
            CacheStorageInfo={AllInstanceInfo?.cacheStorage || {}}
          />
        </div>
      )}

      {/* Database Tree View */}
      <div className='mb-8'>
        <DatabaseTreeView treeDB={AllInstanceInfo?.nodeTree || []} />
      </div>
    </div>
  )
}

export default Dashboard
