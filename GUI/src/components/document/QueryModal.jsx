import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { BASE_API_URL } from '../../config/key'
import QueryEditor from '../query/QueryEditor'
import { parseExpression, parseLiteral, validate } from '../query/queryLanguage'

/**
 * One console for both read paths - `Collection.query({...})` and
 * `Collection.aggregate([...])`. They were two modals before; the expression itself now
 * says which endpoint to call, so there is one editor, one validator, and one result path.
 */
const QueryModal = ({
  isOpen,
  onClose,
  databaseName,
  collectionName,
  onQueryResults,
  onAggregationResults
}) => {
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const examples = useMemo(
    () => [
      { label: 'All documents', code: `${collectionName}.query({}).exec()` },
      { label: 'Exact match', code: `${collectionName}.query({ name: 'Ankan' }).exec()` },
      { label: 'Comparison', code: `${collectionName}.query({ age: { $gte: 18 } }).exec()` },
      { label: 'Any of', code: `${collectionName}.query({ city: { $in: ['New York', 'Delhi'] } }).exec()` },
      { label: 'Pattern', code: `${collectionName}.query({ name: { $regex: '^An', $options: 'i' } }).exec()` },
      { label: 'Group & count', code: `${collectionName}.aggregate([{ $match: {} }, { $group: { _id: '$city', total: { $sum: 1 } } }]).exec()` }
    ],
    [collectionName]
  )

  // Reset to a runnable starting point each time the console opens.
  useEffect(() => {
    if (isOpen) {
      setSource(`${collectionName}.query({}).exec()`)
      setError(null)
    }
  }, [isOpen, collectionName])

  const diagnostics = useMemo(
    () => validate(source, collectionName),
    [source, collectionName]
  )
  const hasErrors = diagnostics.some((d) => d.severity === 'error')

  const handleRun = async () => {
    const parsed = parseExpression(source)
    if (!parsed || hasErrors) return

    try {
      setLoading(true)
      setError(null)
      // The editor speaks JS object literals; the wire speaks JSON. axios serialises for us.
      const payload = parseLiteral(parsed.args)

      if (parsed.method === 'aggregate') {
        const response = await axios.post(
          `${BASE_API_URL}/api/operation/aggregate/?dbName=${databaseName}&collectionName=${collectionName}`,
          { aggregation: payload },
          { headers: { 'Content-Type': 'application/json' } }
        )
        if (response.data?.data) {
          onAggregationResults(response.data.data.documents || response.data.data, payload)
          onClose()
        }
        return
      }

      onQueryResults(payload)
      onClose()
    } catch (err) {
      console.error('Query error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to run query')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/5 p-4 backdrop-blur-md'>
      <div className='flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-ink-200 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4'>
          <div className='flex items-center gap-3'>
            <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-white/10'>
              <svg className='h-5 w-5 text-emerald-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 9l3 3-3 3m5 0h3' />
                <rect x='3' y='4' width='18' height='16' rx='2' strokeWidth={2} />
              </svg>
            </span>
            <div>
              <h3 className='text-base font-semibold text-white'>Query Console</h3>
              <p className='font-mono text-xs text-slate-400'>
                {databaseName} › {collectionName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label='Close query console'
            className='rounded-md p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white'
          >
            <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto p-6'>
          <QueryEditor
            value={source}
            onChange={setSource}
            collectionName={collectionName}
            diagnostics={diagnostics}
            onSubmit={hasErrors ? undefined : handleRun}
          />

          <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500'>
            <kbd className='rounded border border-ink-300 bg-ink-50 px-1.5 py-0.5 font-mono'>Ctrl</kbd>
            <span>+</span>
            <kbd className='rounded border border-ink-300 bg-ink-50 px-1.5 py-0.5 font-mono'>Space</kbd>
            <span className='mr-2'>suggestions</span>
            <kbd className='rounded border border-ink-300 bg-ink-50 px-1.5 py-0.5 font-mono'>Ctrl</kbd>
            <span>+</span>
            <kbd className='rounded border border-ink-300 bg-ink-50 px-1.5 py-0.5 font-mono'>Enter</kbd>
            <span className='mr-2'>run</span>
            <span>
              Type <code className='font-mono text-ink-700'>{collectionName}.</code> or{' '}
              <code className='font-mono text-ink-700'>$</code> to see what fits.
            </span>
          </div>

          {/* Examples */}
          <div className='mt-5'>
            <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500'>
              Examples
            </p>
            <div className='flex flex-wrap gap-2'>
              {examples.map((example) => (
                <button
                  key={example.label}
                  type='button'
                  onClick={() => setSource(example.code)}
                  title={example.code}
                  className='rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className='mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between border-t border-ink-200 bg-ink-50 px-6 py-4'>
          <p className='text-xs text-ink-500'>
            Suggestions cover syntax only - never your data.
          </p>
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='rounded-lg border border-ink-300 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100'
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              disabled={loading || hasErrors}
              className='flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-ink-300'
            >
              {loading
                ? (
                  <>
                    <svg className='h-4 w-4 animate-spin' viewBox='0 0 24 24' fill='none'>
                      <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                      <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z' />
                    </svg>
                    Running
                  </>
                  )
                : (
                  <>
                    <svg className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                      <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z' clipRule='evenodd' />
                    </svg>
                    Run
                  </>
                  )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QueryModal
