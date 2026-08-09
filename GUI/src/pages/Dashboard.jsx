import { useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../config/key'
import DatabaseTreeView from '../components/dashboard/DatabaseTreeView'
import CollectionsChart from '../components/dashboard/CollectionsChart'
import StorageDonut from '../components/dashboard/StorageDonut'
import MetricCard from '../components/ui/MetricCard'
import { Alert } from '../components/ui/Feedback'

const iconClass = 'h-5 w-5'

const ICONS = {
  databases: (
    <svg className={iconClass} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <ellipse cx='12' cy='6' rx='8' ry='3' />
      <path d='M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6' />
      <path d='M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6' />
    </svg>
  ),
  collections: (
    <svg className={iconClass} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <rect x='3' y='3' width='7' height='7' rx='1.5' />
      <rect x='14' y='3' width='7' height='7' rx='1.5' />
      <rect x='3' y='14' width='7' height='7' rx='1.5' />
      <rect x='14' y='14' width='7' height='7' rx='1.5' />
    </svg>
  ),
  documents: (
    <svg className={iconClass} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
    </svg>
  )
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    axios
      .get(`${BASE_API_URL}/api/dashboard-stats`)
      .then((response) => {
        if (cancelled) return
        setStats(response.data.data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        // Previously a rejected request left the page spinning forever with no explanation.
        console.error('Error fetching dashboard stats:', err)
        setError(err.response?.data?.message || 'Could not load dashboard statistics.')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const storage = stats?.storageInfo ?? {}
  const cache = stats?.cacheStorage ?? {}

  return (
    <div className='mx-auto w-full max-w-[120rem] px-4 py-8 sm:px-6 lg:px-8'>
      <header className='mb-8'>
        <h1 className='text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl'>Dashboard</h1>
        <p className='mt-1 text-sm text-ink-500'>
          Live view of this AxioDB instance - storage, cache, and every database it holds.
        </p>
      </header>

      {error && <Alert tone='danger' title='Dashboard unavailable' className='mb-6'>{error}</Alert>}

      <div className='stagger mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
        <MetricCard
          label='Databases'
          value={stats?.totalDatabases ?? 0}
          icon={ICONS.databases}
          accent='brand'
          loading={loading}
        />
        <MetricCard
          label='Collections'
          value={stats?.totalCollections ?? 0}
          icon={ICONS.collections}
          accent='indigo'
          loading={loading}
        />
        <MetricCard
          label='Documents'
          value={stats?.totalDocuments ?? 0}
          icon={ICONS.documents}
          accent='cyan'
          loading={loading}
        />
      </div>

      <div className='stagger mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <StorageDonut
          title='Disk storage'
          subtitle='AxioDB data against total machine capacity'
          used={storage.total ?? 0}
          total={storage.machine ?? 0}
          unit={storage.matrixUnit ?? 'MB'}
          loading={loading}
          color='var(--color-viz-1)'
        />
        <StorageDonut
          title='In-memory cache'
          subtitle='Cached documents against the cache ceiling'
          used={cache.Storage ?? 0}
          total={cache.Max ?? 0}
          unit={cache.Unit ?? 'MB'}
          loading={loading}
          color='var(--color-viz-2)'
        />
      </div>

      <div className='stagger grid grid-cols-1 gap-5 xl:grid-cols-2'>
        <CollectionsChart nodeTree={stats?.nodeTree ?? []} loading={loading} />
        <DatabaseTreeView treeDB={stats?.nodeTree ?? []} loading={loading} />
      </div>
    </div>
  )
}

export default Dashboard
