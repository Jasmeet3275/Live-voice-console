import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { cn } from '@/lib/cn'

export interface WaveformProps {
  /** Amplitude bars, values 0–1. */
  data: number[]
  /** Playback position 0–1. */
  progress: number
  /** Called with a 0–1 fraction when the user seeks (click / drag / keys). */
  onSeek?: (fraction: number) => void
  height?: number
  className?: string
  'aria-label'?: string
  /** Human position for screen readers, e.g. "1:23 of 3:00" (announced instead of a %). */
  valueText?: string
  /** CSS color for played bars + playhead (defaults to the accent). */
  playedColor?: string
  /** CSS color for upcoming bars. */
  upcomingColor?: string
}

/** Playback waveform: bars behind the playhead are "played" (accent), ahead are
 *  "upcoming" (muted). Seekable by click, drag, and keyboard. */
export function Waveform({
  data,
  progress,
  onSeek,
  height = 48,
  className,
  'aria-label': ariaLabel = 'Call audio position',
  valueText,
  playedColor = 'var(--accent)',
  upcomingColor = 'var(--border-strong)',
}: WaveformProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const interactive = Boolean(onSeek)

  const seekFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el || !onSeek) return
    const rect = el.getBoundingClientRect()
    const frac = (clientX - rect.left) / rect.width
    onSeek(Math.min(1, Math.max(0, frac)))
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    seekFromClientX(e.clientX)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) seekFromClientX(e.clientX)
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onSeek) return
    const step = 1 / Math.max(1, data.length)
    if (e.key === 'ArrowRight') onSeek(Math.min(1, progress + step))
    else if (e.key === 'ArrowLeft') onSeek(Math.max(0, progress - step))
    else if (e.key === 'Home') onSeek(0)
    else if (e.key === 'End') onSeek(1)
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={trackRef}
      role={interactive ? 'slider' : 'img'}
      aria-label={ariaLabel}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? 100 : undefined}
      aria-valuenow={interactive ? Math.round(progress * 100) : undefined}
      aria-valuetext={interactive ? valueText : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      style={{ height }}
      className={cn(
        'relative flex w-full items-center gap-[2px] select-none rounded-md',
        interactive && 'cursor-pointer',
        className,
      )}
    >
      {data.map((amp, i) => {
        const barFrac = (i + 0.5) / data.length
        const played = barFrac <= progress
        return (
          <span
            key={i}
            className="flex-1 rounded-full transition-colors"
            style={{
              height: `${Math.max(8, amp * 100)}%`,
              minWidth: 2,
              background: played ? playedColor : upcomingColor,
            }}
          />
        )
      })}

      {/* Playhead */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 w-px"
        style={{ left: `${progress * 100}%`, background: playedColor }}
      >
        <span
          className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full shadow-e1"
          style={{ background: playedColor }}
        />
      </span>
    </div>
  )
}
