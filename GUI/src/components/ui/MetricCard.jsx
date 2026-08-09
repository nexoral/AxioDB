import { useEffect, useRef, useState } from 'react'
import Card from './Card'
import { Skeleton } from './Feedback'

/**
 * Counts from the previous value to the next one instead of snapping. Uses rAF and eases
 * out, so the number settles rather than stopping dead.
 *
 * Respects prefers-reduced-motion by jumping straight to the target - an animated number is
 * decoration, and for anyone who has asked for less motion it is also hard to read.
 */
function useCountUp (target, duration = 700) {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = fromRef.current

    if (reduced || from === target) {
      fromRef.current = target
      setDisplay(target)
      return
    }

    let frame
    const start = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (target - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else fromRef.current = target
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return display
}

const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  pink: 'bg-pink-50 text-pink-600'
}

/**
 * A single headline number.
 *
 * @param {string} label
 * @param {number} value
 * @param {string} [unit] - rendered smaller, after the number
 * @param {React.ReactNode} [icon]
 * @param {'brand'|'indigo'|'amber'|'cyan'|'pink'} [accent]
 * @param {boolean} [loading]
 * @param {number} [decimals]
 * @param {React.ReactNode} [footer] - sparkline, progress bar, or a secondary figure
 */
const MetricCard = ({
  label,
  value = 0,
  unit,
  icon,
  accent = 'brand',
  loading = false,
  decimals = 0,
  footer = null
}) => {
  const animated = useCountUp(loading ? 0 : value)

  return (
    <Card className='p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs font-medium uppercase tracking-wide text-ink-500'>{label}</p>
          {loading
            ? <Skeleton className='mt-2 h-8 w-24' />
            : (
              <p className='mt-1.5 flex items-baseline gap-1 text-2xl font-bold tabular-nums text-ink-900'>
                {animated.toLocaleString(undefined, {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals
                })}
                {unit && <span className='text-sm font-medium text-ink-500'>{unit}</span>}
              </p>
              )}
        </div>
        {icon && (
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ACCENTS[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      {footer && <div className='mt-4'>{loading ? <Skeleton className='h-2 w-full' /> : footer}</div>}
    </Card>
  )
}

export default MetricCard
