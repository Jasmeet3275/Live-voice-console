import { useMemo, useRef, type PointerEvent } from 'react'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * WaveformTrack — the call waveform. Bars are coloured by SPEAKER (teal
 * = AI, warm sand = caller, amber = low-confidence span), a playhead
 * marks the current position, and low-confidence flags float above.
 * Seekable by click/drag. Matches design_handoff transport waveform.
 * ------------------------------------------------------------------ */

export type BarTone = 'ai' | 'caller' | 'flag' | 'silence'
export interface WaveBar { h: number; tone: BarTone }
export interface WaveFlag { pos: number; label: string }

/* Colours resolve from CSS tokens so light/dark swap with the theme (the dark
   ramp is hand-tuned in tokens.css, not a straight invert — handoff §0b). */
const TONE: Record<BarTone, { loud: string; quiet: string }> = {
  ai: { loud: 'var(--wave-ai-loud)', quiet: 'var(--wave-ai-quiet)' },
  caller: { loud: 'var(--wave-caller-loud)', quiet: 'var(--wave-caller-quiet)' },
  flag: { loud: 'var(--wave-flag-loud)', quiet: 'var(--wave-flag-quiet)' },
  silence: { loud: 'var(--wave-silence)', quiet: 'var(--wave-silence)' },
}

/** Deterministic envelope so the bars don't reshuffle every render. */
export function generateBars(n = 84, flag?: { from: number; to: number }): WaveBar[] {
  return Array.from({ length: n }, (_, i) => {
    const p = i / n
    const env = Math.sin(Math.PI * Math.pow(p, 0.8))
    const syl = 0.55 + 0.45 * Math.abs(Math.sin(p * Math.PI * 9 + i))
    const h = Math.max(8, Math.min(100, 12 + 82 * env * syl))
    const tone: BarTone =
      p < 0.4 ? 'ai' : flag && p >= flag.from && p <= flag.to ? 'flag' : 'caller'
    return { h, tone }
  })
}

export function WaveformTrack({
  bars,
  progress = 1,
  onSeek,
  flags = [],
  height = 38,
  className,
  'aria-label': ariaLabel = 'Call audio',
}: {
  bars?: WaveBar[]
  /** Playhead position 0–1. A live call ends the window at now → pass ~1. */
  progress?: number
  onSeek?: (fraction: number) => void
  flags?: WaveFlag[]
  height?: number
  className?: string
  'aria-label'?: string
}) {
  const data = useMemo(() => bars ?? generateBars(110, { from: 0.62, to: 0.72 }), [bars])
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const interactive = Boolean(onSeek)

  const seek = (clientX: number) => {
    const el = trackRef.current
    if (!el || !onSeek) return
    const r = el.getBoundingClientRect()
    onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)))
  }
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive) return
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    seek(e.clientX)
  }
  const move = (e: PointerEvent<HTMLDivElement>) => { if (dragging.current) seek(e.clientX) }
  const up = (e: PointerEvent<HTMLDivElement>) => { dragging.current = false; e.currentTarget.releasePointerCapture?.(e.pointerId) }

  return (
    <div
      ref={trackRef}
      role={interactive ? 'slider' : 'img'}
      aria-label={ariaLabel}
      aria-valuenow={interactive ? Math.round(progress * 100) : undefined}
      aria-valuemin={interactive ? 0 : undefined}
      aria-valuemax={interactive ? 100 : undefined}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onKeyDown={(e) => {
        if (!onSeek) return
        const step = 1 / data.length
        if (e.key === 'ArrowRight') { onSeek(Math.min(1, progress + step)); e.preventDefault() }
        else if (e.key === 'ArrowLeft') { onSeek(Math.max(0, progress - step)); e.preventDefault() }
      }}
      style={{ height }}
      className={cn('relative flex select-none items-center justify-between overflow-hidden', interactive && 'cursor-pointer', className)}
    >
      {data.map((b, i) => {
        const c = TONE[b.tone]
        return (
          <span
            key={i}
            className="w-[3px] shrink-0 rounded-full"
            style={{ height: `${b.h}%`, background: b.h > 52 ? c.loud : c.quiet }}
          />
        )
      })}

      {flags.map((f, i) => (
        <span
          key={i}
          className="pointer-events-none absolute -top-[6px] -translate-x-1/2 rounded px-1 py-0.5 text-[9.5px] font-bold"
          style={{ left: `${Math.min(96, f.pos * 100)}%`, background: 'var(--wave-flag-label)', color: 'var(--wave-flag-label-fg)' }}
        >
          {f.label}
        </span>
      ))}

      <span aria-hidden className="pointer-events-none absolute inset-y-[-3px] w-0.5 bg-text" style={{ left: `${progress * 100}%` }} />
    </div>
  )
}
