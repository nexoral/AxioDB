import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import Card, { CardHeader } from '../ui/Card'
import { Skeleton } from '../ui/Feedback'
import { formatStorage } from '../../utils/format'

/**
 * Used-vs-free ring for a storage figure, with the percentage in the middle.
 *
 * A donut is the right shape here because the question is "how much of the whole is gone",
 * not "how has it changed" - there is no time series behind these numbers.
 */
const StorageDonut = ({ title, subtitle, used = 0, total = 0, unit = 'MB', loading = false, color = 'var(--color-viz-1)' }) => {
  const safeTotal = total > 0 ? total : 1
  const percent = Math.min((used / safeTotal) * 100, 100)
  const data = [
    { name: 'Used', value: Math.max(used, 0) },
    { name: 'Free', value: Math.max(safeTotal - used, 0) }
  ]

  return (
    <Card className='flex flex-col'>
      <CardHeader title={title} subtitle={subtitle} />
      <div className='flex flex-1 items-center gap-5 p-5'>
        {loading
          ? <Skeleton className='h-32 w-32 rounded-full' />
          : (
            <div className='relative h-32 w-32 shrink-0'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey='value'
                    innerRadius='72%'
                    outerRadius='100%'
                    startAngle={90}
                    endAngle={-270}
                    stroke='none'
                    animationDuration={800}
                    animationEasing='ease-out'
                  >
                    <Cell fill={color} />
                    <Cell fill='var(--color-ink-200)' />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                <span className='text-xl font-bold tabular-nums text-ink-900'>
                  {percent.toFixed(percent < 10 ? 1 : 0)}%
                </span>
                <span className='text-[10px] uppercase tracking-wide text-ink-400'>used</span>
              </div>
            </div>
            )}

        <dl className='min-w-0 flex-1 space-y-3'>
          <div>
            <dt className='text-xs text-ink-500'>Used</dt>
            <dd className='text-sm font-semibold tabular-nums text-ink-900'>
              {loading ? <Skeleton className='h-4 w-20' /> : formatStorage(used, unit)}
            </dd>
          </div>
          <div>
            <dt className='text-xs text-ink-500'>Available</dt>
            <dd className='text-sm font-semibold tabular-nums text-ink-900'>
              {loading
                ? <Skeleton className='h-4 w-20' />
                : formatStorage(Math.max(total - used, 0), unit)}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  )
}

export default StorageDonut
