import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../config/key'
import Page from '../components/ui/Page'
import Card, { CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import MetricCard from '../components/ui/MetricCard'
import { Alert, Badge, Skeleton } from '../components/ui/Feedback'
import { formatStorage } from '../utils/format'

/**
 * Server status.
 *
 * Reads the public `/api/health` liveness probe for up/down, and the authenticated
 * `/api/system` endpoint for operational detail. They are separate on purpose: /health is
 * unauthenticated for Docker's healthcheck, so host characteristics stay off it.
 */

const REFRESH_MS = 30000

/** "3d 4h 12m" - the largest two units are all anyone reads. */
function formatUptime (seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${Math.floor(seconds % 60)}s`
  return `${Math.floor(seconds)}s`
}

const DetailRow = ({ label, value, mono = false, loading }) => (
  <div className='flex items-center justify-between gap-4 px-5 py-3'>
    <dt className='shrink-0 text-sm text-ink-500'>{label}</dt>
    <dd className={`min-w-0 truncate text-sm font-medium text-ink-900 ${mono ? 'font-mono' : ''}`}>
      {loading ? <Skeleton className='h-4 w-24' /> : (value ?? '—')}
    </dd>
  </div>
)

const Status = () => {
  const [health, setHealth] = useState(null)
  const [system, setSystem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStatus = useCallback(async () => {
    setRefreshing(true)
    try {
      // Settled, not all: the detail endpoint failing must not make the server look down.
      const [healthResult, systemResult] = await Promise.allSettled([
        axios.get(`${BASE_API_URL}/api/health`),
        axios.get(`${BASE_API_URL}/api/system`)
      ])

      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value.data?.data ?? healthResult.value.data)
        setError(null)
      } else {
        setHealth(null)
        setError('The server did not answer the health check.')
      }

      setSystem(systemResult.status === 'fulfilled'
        ? systemResult.value.data?.data ?? null
        : null)

      setLastUpdated(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const isUp = health?.status === 'ok'
  const proc = system?.process ?? {}
  const memory = system?.memory ?? {}
  const cache = system?.cache ?? {}
  const instance = system?.instance ?? {}
  const services = system?.services ?? []

  return (
    <Page>
      <header className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl'>Status</h1>
          <p className='mt-1 text-sm text-ink-500'>
            Live health of this AxioDB instance. Refreshes every {REFRESH_MS / 1000} seconds.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          {lastUpdated && (
            <span className='text-xs text-ink-400'>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button variant='secondary' size='sm' loading={refreshing} onClick={fetchStatus}>
            Refresh
          </Button>
        </div>
      </header>

      {error && <Alert tone='danger' title='Server unreachable' className='mb-6'>{error}</Alert>}

      {/* Headline state */}
      <Card className={`mb-6 overflow-hidden border-l-4 ${isUp ? 'border-l-brand-500' : 'border-l-danger-500'}`}>
        <div className='flex flex-wrap items-center gap-5 p-6'>
          <span
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              isUp ? 'bg-brand-50 text-brand-600' : 'bg-danger-50 text-danger-600'
            }`}
          >
            {isUp && (
              <span className='absolute inline-flex h-full w-full animate-ping rounded-2xl bg-brand-400 opacity-20' />
            )}
            <svg className='relative h-7 w-7' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              {isUp
                ? <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                : <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />}
            </svg>
          </span>

          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-3'>
              <h2 className='text-xl font-bold text-ink-900'>
                {loading ? 'Checking…' : isUp ? 'All systems operational' : 'Server unavailable'}
              </h2>
              <Badge tone={isUp ? 'brand' : 'danger'} dot>
                {loading ? '…' : isUp ? 'Healthy' : 'Down'}
              </Badge>
            </div>
            <p className='mt-1 text-sm text-ink-500'>
              {health?.timestamp
                ? `Reported ${new Date(health.timestamp).toLocaleString()}`
                : 'Waiting for the first successful health check.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Runtime metrics */}
      <div className='stagger mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4'>
        <MetricCard
          label='Uptime'
          value={proc.uptimeSeconds ?? health?.uptimeSeconds ?? 0}
          loading={loading}
          accent='brand'
          footer={
            <p className='text-xs text-ink-500'>
              {formatUptime(proc.uptimeSeconds ?? health?.uptimeSeconds)}
              {proc.startedAt && ` · since ${new Date(proc.startedAt).toLocaleString()}`}
            </p>
          }
        />
        <MetricCard
          label='Heap used'
          value={memory.heapUsed ?? 0}
          unit='MB'
          decimals={2}
          loading={loading}
          accent='indigo'
          footer={
            <p className='text-xs text-ink-500'>
              of {memory.heapTotal ?? 0} MB allocated · RSS {memory.rss ?? 0} MB
            </p>
          }
        />
        <MetricCard
          label='Cache in use'
          value={cache.used ?? 0}
          unit='MB'
          decimals={2}
          loading={loading}
          accent='cyan'
          footer={<p className='text-xs text-ink-500'>{formatStorage(cache.max ?? 0)} ceiling</p>}
        />
        <MetricCard
          label='Databases'
          value={instance.totalDatabases ?? 0}
          loading={loading}
          accent='amber'
          footer={<p className='text-xs text-ink-500'>on this instance</p>}
        />
      </div>

      <div className='stagger grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Services */}
        <Card className='lg:col-span-2'>
          <CardHeader title='Services' subtitle='Ports are fixed in code - remap with Docker -p' />
          <ul className='divide-y divide-ink-100'>
            {loading
              ? [0, 1, 2].map((i) => (
                <li key={i} className='px-5 py-4'><Skeleton className='h-5 w-full' /></li>
                ))
              : services.length === 0
                ? <li className='px-5 py-4 text-sm text-ink-500'>Service detail unavailable.</li>
                : services.map((service) => (
                  <li key={service.name} className='flex flex-wrap items-center gap-3 px-5 py-4'>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${service.running ? 'bg-brand-500' : 'bg-ink-300'}`}
                      aria-hidden='true'
                    />
                    <span className='min-w-0 flex-1'>
                      <span className='block text-sm font-semibold text-ink-900'>{service.name}</span>
                      {service.note && <span className='block text-xs text-ink-500'>{service.note}</span>}
                    </span>
                    <span className='font-mono text-xs text-ink-500'>:{service.port}</span>
                    <Badge tone={service.running ? 'brand' : 'neutral'}>
                      {service.running ? 'Running' : 'Not enabled'}
                    </Badge>
                  </li>
                  ))}
          </ul>
        </Card>

        {/* Host + build */}
        <Card>
          <CardHeader title='Runtime' subtitle='Host this instance is running on' />
          <dl className='divide-y divide-ink-100'>
            <DetailRow label='AxioDB' value={instance.version} mono loading={loading} />
            <DetailRow label='Node.js' value={proc.nodeVersion} mono loading={loading} />
            <DetailRow label='Platform' value={proc.platform && `${proc.platform} / ${proc.arch}`} mono loading={loading} />
            <DetailRow label='CPU cores' value={proc.cpuCount} loading={loading} />
            <DetailRow label='Process ID' value={proc.pid} mono loading={loading} />
            <DetailRow label='Root name' value={instance.rootName} mono loading={loading} />
          </dl>
          {instance.path && (
            <div className='border-t border-ink-100 px-5 py-4'>
              <p className='text-xs text-ink-500'>Data directory</p>
              <p className='mt-1 break-all font-mono text-xs text-ink-700'>{instance.path}</p>
            </div>
          )}
        </Card>
      </div>
    </Page>
  )
}

export default Status
