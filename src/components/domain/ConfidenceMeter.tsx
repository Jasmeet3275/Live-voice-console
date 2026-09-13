import { cn } from '@/lib/cn'

const HIGH = 0.85
const LOW = 0.65

function toneOf(value: number): { color: string; label: string } {
  if (value >= HIGH) return { color: 'var(--success)', label: 'High' }
  if (value >= LOW) return { color: 'var(--warning-solid)', label: 'Medium' }
  return { color: 'var(--error)', label: 'Low' }
}

/** Compact confidence readout: a thin bar filled to `value`, colored by the
 *  same thresholds as the transcript (high / medium / low), with a % label. */
export function ConfidenceMeter({
  value,
  label,
  showLabel = true,
  className,
}: {
  value: number
  /** Optional leading label, e.g. the word being assessed. */
  label?: string
  showLabel?: boolean
  className?: string
}) {
  const v = Math.min(1, Math.max(0, value))
  const pct = Math.round(v * 100)
  const tone = toneOf(v)

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={`${label ? label + ' ' : ''}confidence ${tone.label}, ${pct}%`}
    >
      {label && (
        <span className="shrink-0 text-caption font-medium text-text">
          {label}
        </span>
      )}
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: tone.color }}
        />
      </div>
      {showLabel && (
        <span
          className="tabular shrink-0 text-caption font-medium"
          style={{ color: tone.color }}
        >
          {pct}%
        </span>
      )}
    </div>
  )
}
