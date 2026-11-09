import { useEffect, useState, useCallback } from 'react'
import apiClient from '../api/client'
import DatabaseTreeView from '../components/dashboard/DatabaseTreeView'
import CollectionsChart from '../components/dashboard/CollectionsChart'
import StorageDonut from '../components/dashboard/StorageDonut'
import PerformanceTrendsChart from '../components/dashboard/PerformanceTrendsChart'
import MetricCard from '../components/ui/MetricCard'
import Card, { CardHeader } from '../components/ui/Card'
import { Alert, Badge, Skeleton } from '../components/ui/Feedback'
import { formatUptime } from '../utils/format'
import { useConnectionStore } from '../store/connectionStore'

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

const formatServiceName = (name) => {
  if (name === 'Dashboard + HTTP API' || name === 'API' || name === 'HTTP API') return 'HTTP Server'
  if (name === 'AxioDBCloud TCP' || name === 'TCP') return 'TCP Server'
  if (name?.toLowerCase() === 'mcp server' || name?.toLowerCase() === 'mcp') return 'MCP Server'
  return name
}

const DetailRow = ({ label, value, mono = false, loading = false }) => (
  <div className='flex items-center justify-between gap-4 px-4 py-2.5'>
    <dt className='shrink-0 text-xs text-slate-500 font-sans'>{label}</dt>
    <dd className={`min-w-0 truncate text-xs font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>
      {loading ? <Skeleton className='h-3.5 w-16' /> : (value ?? '—')}
    </dd>
  </div>
)

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [systemInfo, setSystemInfo] = useState(null)
  const [healthInfo, setHealthInfo] = useState(null)
  const [error, setError] = useState(null)
  const [latency, setLatency] = useState(0)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const { isConnected } = useConnectionStore()

  const fetchMetricsAndStatus = useCallback(async () => {
    if (!isConnected) return

    const start = performance.now()
    try {
      const [statsResult, sysResult, healthResult] = await Promise.allSettled([
        apiClient.get('/api/dashboard-stats'),
        apiClient.get('/api/system'),
        apiClient.get('/api/health')
      ])

      setLatency(Math.max(1, Math.round(performance.now() - start)))

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data?.data ?? null)
        setError(null)
      } else {
        const err = statsResult.reason
        const isNetworkErr =
          !err?.response ||
          err?.code === 'ECONNREFUSED' ||
          err?.code === 'ERR_NETWORK' ||
          /ECONNREFUSED|network|offline|socket/i.test(err?.message || '')

        const fallback = isNetworkErr
          ? 'Unable to connect to AxioDB server. Please ensure the server is running.'
          : 'Could not load dashboard statistics.'

        const rawMsg = err?.response?.data?.message || err?.message || fallback
        setError(typeof rawMsg === 'string' ? rawMsg : fallback)
      }

      if (sysResult.status === 'fulfilled') {
        setSystemInfo(sysResult.value.data?.data ?? null)
      }

      if (healthResult.status === 'fulfilled') {
        setHealthInfo(healthResult.value.data?.data ?? healthResult.value.data ?? null)
      }

      setLastRefreshed(new Date())
    } catch (err) {
      setError(err?.message || 'Failed to refresh telemetry')
    } finally {
      setLoading(false)
    }
  }, [isConnected])

  useEffect(() => {
    fetchMetricsAndStatus()
    const timer = setInterval(fetchMetricsAndStatus, 30000)
    return () => clearInterval(timer)
  }, [fetchMetricsAndStatus])

  const storage = stats?.storageInfo ?? {}
  const cache = stats?.cacheStorage ?? {}
  const proc = systemInfo?.process ?? {}
  const memory = systemInfo?.memory ?? {}
  const instance = systemInfo?.instance ?? {}
  const services = systemInfo?.services ?? []
  const isHealthy = healthInfo?.status === 'ok'

  return (
    <div className='flex-1 overflow-y-auto bg-slate-50 p-6 font-sans select-none'>
      <div className='mx-auto max-w-7xl'>
        <header className='mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-slate-900'>Server Performance & Metrics</h1>
            <p className='mt-0.5 text-xs text-slate-500'>
              Real-time telemetry, runtime diagnostics, and memory ceiling for this AxioDB HTTP instance.
            </p>
          </div>
          {lastRefreshed && (
            <div className='flex items-center gap-2 text-xs text-slate-400 font-mono'>
              <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
              <span>Live · Updated {lastRefreshed.toLocaleTimeString()}</span>
            </div>
          )}
        </header>

        {error && <Alert tone='danger' title='Metrics unavailable' className='mb-6'>{error}</Alert>}

        {/* Headline metric cards */}
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

        {/* Disk & Cache Donuts */}
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

        {/* Charts */}
        <div className='stagger mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2'>
          <CollectionsChart nodeTree={stats?.nodeTree ?? []} loading={loading} />
          <PerformanceTrendsChart
            currentLatency={latency}
            storageUsed={storage.total ?? 0}
            cacheUsed={cache.Storage ?? 0}
          />
        </div>

        {/* Runtime & System Diagnostics Section */}
        <div className='stagger mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3'>
          {/* Running Services */}
          <Card className='lg:col-span-2'>
            <CardHeader
              title='Active Network Services'
              subtitle='Fixed network ports and daemons running on this instance'
              action={
                <Badge tone={isHealthy ? 'brand' : 'danger'} dot>
                  {isHealthy ? 'Operational' : 'Checking'}
                </Badge>
              }
            />
            <div className='divide-y divide-slate-100 p-2'>
              {services.length === 0 ? (
                <div className='p-4 text-xs text-slate-400 font-mono'>Loading service telemetry...</div>
              ) : (
                services.map((service) => (
                  <div key={service.name} className='flex items-center justify-between px-3 py-2.5'>
                    <div className='flex items-center gap-2.5'>
                      <span
                        className={`h-2 w-2 rounded-full ${service.running ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      />
                      <div>
                        <p className='text-xs font-semibold text-slate-800'>
                          {formatServiceName(service.name)}
                        </p>
                        {service.note && <p className='text-[10px] text-slate-400'>{service.note}</p>}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='font-mono text-[11px] text-slate-400'>:{service.port}</span>
                      <Badge tone={service.running ? 'brand' : 'neutral'}>
                        {service.running ? 'Running' : 'Not enabled'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Host & Runtime Detail */}
          <Card>
            <CardHeader title='Runtime Diagnostics' subtitle='Process & host environment' />
            <dl className='divide-y divide-slate-100'>
              <DetailRow
                label='Uptime'
                value={formatUptime(proc.uptimeSeconds ?? healthInfo?.uptimeSeconds)}
                mono
                loading={loading}
              />
              <DetailRow
                label='Heap Memory'
                value={memory.heapUsed !== undefined ? `${memory.heapUsed} MB` : undefined}
                mono
                loading={loading}
              />
              <DetailRow
                label='RSS Memory'
                value={memory.rss !== undefined ? `${memory.rss} MB` : undefined}
                mono
                loading={loading}
              />
              <DetailRow label='Node.js' value={proc.nodeVersion} mono loading={loading} />
              <DetailRow
                label='Platform'
                value={proc.platform && `${proc.platform} (${proc.arch})`}
                mono
                loading={loading}
              />
              <DetailRow label='CPU Cores' value={proc.cpuCount} loading={loading} />
              <DetailRow label='Process ID' value={proc.pid} mono loading={loading} />
            </dl>
            {instance.path && (
              <div className='border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 rounded-b-xl'>
                <p className='text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono'>Data Directory</p>
                <p className='mt-0.5 truncate font-mono text-[11px] text-slate-600' title={instance.path}>
                  {instance.path}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Database Tree */}
        <div className='stagger grid grid-cols-1 gap-4'>
          <DatabaseTreeView treeDB={stats?.nodeTree ?? []} loading={loading} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
