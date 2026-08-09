import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card, { CardHeader } from '../ui/Card'
import { EmptyState, Skeleton } from '../ui/Feedback'

const VIZ = [
  'var(--color-viz-1)', 'var(--color-viz-2)', 'var(--color-viz-3)',
  'var(--color-viz-4)', 'var(--color-viz-5)', 'var(--color-viz-6)'
]

/** Recharts' default tooltip doesn't inherit the app's surface treatment. */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null

  return (
    <div className='rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-float'>
      <p className='text-xs font-semibold text-ink-900'>{label}</p>
      <p className='mt-0.5 text-xs tabular-nums text-ink-600'>
        {payload[0].value.toLocaleString()} documents
      </p>
      <p className='text-[10px] text-ink-400'>{payload[0].payload.database}</p>
    </div>
  )
}

/**
 * Documents per collection, flattened out of the dashboard's nodeTree.
 *
 * Horizontal bars because collection names are long and readable labels matter more than
 * chart convention here. Capped at the busiest 8 - beyond that the bars are too thin to
 * compare, and the tree view below already lists everything.
 */
const CollectionsChart = ({ nodeTree = [], loading = false }) => {
  const data = nodeTree
    .flatMap((db) =>
      (db.collections ?? []).map((collection) => ({
        name: collection.name ?? collection,
        database: db.name,
        documents: collection.documentCount ?? 0
      }))
    )
    .sort((a, b) => b.documents - a.documents)
    .slice(0, 8)

  return (
    <Card className='flex flex-col'>
      <CardHeader
        title='Documents per collection'
        subtitle={data.length === 8 ? 'Busiest 8 collections' : 'All collections'}
      />
      <div className='flex-1 p-5'>
        {loading
          ? <Skeleton className='h-56 w-full' />
          : data.length === 0
            ? (
              <EmptyState
                className='py-10'
                title='No collections yet'
                description='Create a collection and its document count will chart here.'
              />
              )
            : (
              <ResponsiveContainer width='100%' height={224}>
                <BarChart data={data} layout='vertical' margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} stroke='var(--color-ink-200)' />
                  <XAxis
                    type='number'
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'var(--color-ink-500)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    width={110}
                    tick={{ fontSize: 11, fill: 'var(--color-ink-600)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-ink-100)' }} />
                  <Bar dataKey='documents' radius={[0, 6, 6, 0]} animationDuration={800}>
                    {data.map((entry, index) => (
                      <Cell key={entry.name} fill={VIZ[index % VIZ.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              )}
      </div>
    </Card>
  )
}

export default CollectionsChart
