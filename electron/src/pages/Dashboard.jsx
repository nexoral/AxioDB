import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import DatabaseTreeView from '../components/dashboard/DatabaseTreeView'
import CollectionsChart from '../components/dashboard/CollectionsChart'
import StorageDonut from '../components/dashboard/StorageDonut'
import PerformanceTrendsChart from '../components/dashboard/PerformanceTrendsChart'
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
  const [latency, setLatency] = useState(0)

  useEffect(() => {
    let cancelled = false
    const start = performance.now()

    apiClient
      .get('/api/dashboard-stats')
      .then((response) => {
        if (cancelled) return
        setLatency(Math.max(1, Math.round(performance.now() - start)))
        setStats(response.data?.data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Error fetching dashboard stats:', err)
        const isNetworkErr =
          !err.response ||
          err.code === 'ECONNREFUSED' ||
          err.code === 'ERR_NETWORK' ||
          /ECONNREFUSED|network|offline|socket/i.test(err.message || '')

        const fallback = isNetworkErr
          ? 'Unable to connect to AxioDB server. Please ensure the server is running.'
          : 'Could not load dashboard statistics.'

        const rawMsg = err.response?.data?.message || err.message || fallback
        const clean = typeof rawMsg === 'string'
          ? rawMsg
              .replace(/https?:\/\/[^\s),]+/gi, '')
              .replace(/Route\s+[A-Z]+:\s*\/[^\s]+(\s+not found)?/gi, 'Requested endpoint not found')
              .replace(/\(\s*\)/g, '')
              .replace(/\s{2,}/g, ' ')
              .trim()
          : fallback

        setError(clean || fallback)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const storage = stats?.storageInfo ?? {}
  const cache = stats?.cacheStorage ?? {}

  return (
    <div className='flex-1 overflow-y-auto bg-slate-50 p-6 font-sans'>
      <div className='mx-auto max-w-7xl'>
        <header className='mb-6'>
          <h1 className='text-2xl font-bold tracking-tight text-slate-900'>Server Performance & Metrics</h1>
          <p className='mt-1 text-xs text-slate-500'>
            Real-time telemetry for this AxioDB instance: in-memory cache ceiling, disk utilization, and collection tree.
          </p>
        </header>

        {error && <Alert tone='danger' title='Metrics unavailable' className='mb-6'>{error}</Alert>}

        <div className='stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <MetricCard
            label='Total Databases'
            value={stats?.totalDatabases ?? 0}
            icon={ICONS.databases}
            accent='brand'
            loading={loading}
          />
          <MetricCard
            label='Total Collections'
            value={stats?.totalCollections ?? 0}
            icon={ICONS.collections}
            accent='indigo'
            loading={loading}
          />
          <MetricCard
            label='Total Documents'
            value={stats?.totalDocuments ?? 0}
            icon={ICONS.documents}
            accent='cyan'
            loading={loading}
          />
        </div>

        <div className='stagger mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <StorageDonut
            title='Disk Storage'
            subtitle='AxioDB data files vs host filesystem capacity'
            used={storage.total ?? 0}
            total={storage.machine ?? 0}
            unit={storage.matrixUnit ?? 'MB'}
            loading={loading}
            color='var(--color-viz-1)'
          />
          <StorageDonut
            title='In-Memory Cache'
            subtitle='Current active documents cached vs configured RAM ceiling'
            used={cache.Storage ?? 0}
            total={cache.Max ?? 0}
            unit={cache.Unit ?? 'MB'}
            loading={loading}
            color='var(--color-viz-2)'
          />
        </div>

        <div className='stagger mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2'>
          <CollectionsChart nodeTree={stats?.nodeTree ?? []} loading={loading} />
          <PerformanceTrendsChart
            currentLatency={latency}
            storageUsed={storage.total ?? 0}
            cacheUsed={cache.Storage ?? 0}
          />
        </div>

        <div className='stagger grid grid-cols-1 gap-4'>
          <DatabaseTreeView treeDB={stats?.nodeTree ?? []} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
