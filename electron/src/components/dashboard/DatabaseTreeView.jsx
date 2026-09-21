import { useEffect, useMemo, useState } from 'react'
import Card, { CardHeader } from '../ui/Card'
import { Badge, EmptyState, Skeleton } from '../ui/Feedback'

/**
 * Expandable database → collection tree.
 *
 * Loading is now driven by the caller's `loading` prop. The previous version ran its own
 * `setTimeout(500)` "to simulate loading" over data it already had in props, which just made
 * the dashboard feel half a second slower than it was.
 */
const DatabaseTreeView = ({ treeDB = [], loading = false }) => {
  const [expanded, setExpanded] = useState({})

  const tree = useMemo(
    () =>
      (Array.isArray(treeDB) ? treeDB : []).map((db, dbIndex) => ({
        id: `db${dbIndex + 1}`,
        name: db.name,
        collections: Array.isArray(db.collections)
          ? db.collections.map((collection, colIndex) => ({
              id: `db${dbIndex + 1}_col${colIndex + 1}`,
              // Handles both the current object shape and the older bare-string form.
              name: collection.name ?? collection,
              documentCount: collection.documentCount ?? 0
            }))
          : []
      })),
    [treeDB]
  )

  // Open the first database so the panel never reads as empty when data exists.
  useEffect(() => {
    if (tree.length > 0) setExpanded((current) => ({ [tree[0].id]: true, ...current }))
  }, [tree])

  const toggle = (id) => setExpanded((current) => ({ ...current, [id]: !current[id] }))

  return (
    <Card className='flex flex-col'>
      <CardHeader
        title='Database structure'
        subtitle={`${tree.length} database${tree.length === 1 ? '' : 's'}`}
      />

      <div className='max-h-[19rem] flex-1 overflow-y-auto'>
        {loading
          ? (
            <div className='space-y-3 p-5'>
              {[0, 1, 2].map((i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-7 w-3/5' />
                  <div className='space-y-1.5 pl-8'>
                    <Skeleton className='h-5 w-2/3' />
                    <Skeleton className='h-5 w-1/2' />
                  </div>
                </div>
              ))}
            </div>
            )
          : tree.length === 0
            ? (
              <EmptyState
                className='py-10'
                title='No databases yet'
                description='Databases you create will appear here with their collections.'
              />
              )
            : (
              <ul className='divide-y divide-ink-100'>
                {tree.map((db) => {
                  const isOpen = Boolean(expanded[db.id])

                  return (
                    <li key={db.id}>
                      <button
                        type='button'
                        onClick={() => toggle(db.id)}
                        aria-expanded={isOpen}
                        className='flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-ink-50'
                      >
                        <svg
                          className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                          fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'
                        >
                          <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
                        </svg>
                        <svg className='h-4 w-4 shrink-0 text-brand-600' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
                          <ellipse cx='12' cy='6' rx='8' ry='3' />
                          <path d='M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6' />
                        </svg>
                        <span className='min-w-0 flex-1 truncate text-sm font-semibold text-ink-900'>
                          {db.name}
                        </span>
                        <Badge tone='neutral'>{db.collections.length}</Badge>
                      </button>

                      {isOpen && (
                        <ul className='ml-[1.6rem] space-y-0.5 border-l border-ink-200 pb-2 pl-3'>
                          {db.collections.length === 0
                            ? <li className='py-2 pl-3 text-xs text-ink-400'>No collections</li>
                            : db.collections.map((collection) => (
                              <li
                                key={collection.id}
                                className='animate-fadeIn flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors hover:bg-ink-50'
                              >
                                <svg className='h-4 w-4 shrink-0 text-amber-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
                                  <path strokeLinecap='round' strokeLinejoin='round' d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' />
                                </svg>
                                <span className='min-w-0 flex-1 truncate text-sm text-ink-700'>
                                  {collection.name}
                                </span>
                                <span className='shrink-0 text-xs tabular-nums text-ink-500'>
                                  {collection.documentCount.toLocaleString()} docs
                                </span>
                              </li>
                            ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
              )}
      </div>
    </Card>
  )
}

export default DatabaseTreeView
