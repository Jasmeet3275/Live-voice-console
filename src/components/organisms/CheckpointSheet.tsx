import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { CheckpointCard, type CheckpointTone } from '@/components/molecules/CheckpointCard'
import { WaveformTrack, generateBars } from '@/components/organisms/WaveformTrack'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * CheckpointSheet — the "focused" checkpoint: three blocks instead of
 * five. Header (what's blocked + cost of waiting) · question (one line,
 * plus a line of context) · options — stacked single-line rows, the AI's
 * pick teal at the top, the passive path dashed at the bottom, the key on
 * the right. Each option carries at most one qualifier — the thing that
 * decides between it and the pick. The old evidence panel, per-option
 * reasoning and readback are dropped: the detail lives behind the
 * decision, not in front of it. Matches "Checkpoint components - focused".
 * ------------------------------------------------------------------ */

export interface CheckpointOption {
  /** Unique id + keycap source, e.g. "Confirm · Enter" — the part after the
   *  last "·" is shown as the key hint on the right (Enter / 2 / 3 / ⌘⇧T). */
  key: string
  title: string
  /** The single qualifier — the one thing that decides this vs. the pick. */
  note?: string
  /** The AI's recommended option — teal (or ink, in a hand-off). */
  pick?: boolean
  /** The slower / safer path — rendered dashed. */
  dashed?: boolean
  onSelect?: () => void
}

/** "Confirm · Enter" → "Enter"; "Take over · ⌘⇧T" → "⌘⇧T". */
const keycap = (key: string) => key.split('·').pop()?.trim() ?? key

function OptionRow({
  opt, tone, showKey, onClick,
}: {
  opt: CheckpointOption; tone: CheckpointTone; showKey: boolean; onClick: () => void
}) {
  // The pick row carries the emphasis permanently (teal fill, or ink fill in a
  // hand-off) so the recommendation reads at a glance — there's no separate
  // "selected" state, because clicking a row commits the decision immediately.
  const inkPick = opt.pick && tone === 'ink'
  return (
    <button
      data-option
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        opt.pick
          ? inkPick
            ? 'border-[1.5px] border-text bg-text hover:bg-text/90'
            : 'border-[1.5px] border-accent bg-accent-subtle hover:bg-accent-subtle/70'
          : opt.dashed
            ? 'border border-dashed border-border-strong bg-bg-app hover:border-text/40'
            : 'border border-border-strong bg-bg-app hover:border-text/30',
      )}
    >
      <span className={cn('min-w-0 truncate text-[15px] font-medium leading-tight',
        inkPick ? 'text-text-inverse' : opt.pick ? 'text-success' : 'text-text')}>
        {opt.title}
      </span>
      {opt.pick && (
        <span className={cn('shrink-0 rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]',
          inkPick ? 'bg-white/20 text-white' : 'bg-accent text-accent-fg')}>
          AI’s pick
        </span>
      )}
      {opt.note
        ? <span className={cn('min-w-0 flex-1 truncate text-[12px]',
            inkPick ? 'text-text-inverse/70' : opt.pick ? 'text-success/90' : 'text-text-muted')}>{opt.note}</span>
        : <span className="flex-1" />}
      {showKey && (
        <span className={cn('shrink-0 text-[11.5px] font-semibold',
          inkPick ? 'text-text-inverse/80' : opt.pick ? 'text-accent' : 'text-text-secondary')}>
          {keycap(opt.key)}
        </span>
      )}
    </button>
  )
}

export function CheckpointSheet({
  label, cost, tone = 'hold',
  claim, subline, options,
  showKeys = true, indent = false, autoFocus = false, className,
}: {
  label: string
  cost?: string
  tone?: CheckpointTone
  /** The question — one line; embed the deciding number as <b className="text-warning">. */
  claim: React.ReactNode
  /** One line of context under the question (the facts, the state). */
  subline?: string
  options: CheckpointOption[]
  showKeys?: boolean
  indent?: boolean
  /** Move focus onto the AI's pick when the checkpoint opens (live console only;
   *  off in the static ?demo gallery so it doesn't hijack the page on load). */
  autoFocus?: boolean
  className?: string
}) {
  const groupRef = useRef<HTMLDivElement>(null)

  // When the checkpoint opens, move focus to the AI's pick so the operator can
  // act with the keyboard immediately (Enter/Space then commits it). The sheet
  // is remounted per checkpoint, so this fires once when it appears.
  useEffect(() => {
    if (!autoFocus) return
    const cards = groupRef.current?.querySelectorAll<HTMLButtonElement>('[data-option]')
    if (!cards?.length) return
    const pick = Math.max(0, options.findIndex((o) => o.pick))
    cards[pick]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Arrow keys rove focus down/up the stacked rows (Enter/Space then activates
  // the focused one). Home/End jump to the first/last.
  const onArrowNav = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return
    const cards = Array.from(groupRef.current?.querySelectorAll<HTMLButtonElement>('[data-option]') ?? [])
    const i = cards.indexOf(document.activeElement as HTMLButtonElement)
    if (i === -1) return
    e.preventDefault()
    const last = cards.length - 1
    const next = e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % cards.length
      : (i - 1 + cards.length) % cards.length
    cards[next]?.focus()
  }

  return (
    <CheckpointCard label={label} cost={cost} tone={tone} indent={indent} className={className}>
      <p className="text-[14.5px] font-semibold leading-[1.35] tracking-[-0.01em] text-text">{claim}</p>
      {subline && <p className="mt-1 text-[12.5px] leading-[1.5] text-text-muted">{subline}</p>}
      <div ref={groupRef} role="group" aria-label="Choose an option — Arrow keys to move, Enter to pick" onKeyDown={onArrowNav} className="mt-3 flex flex-col gap-[7px]">
        {options.map((o) => (
          <OptionRow
            key={o.key}
            opt={o}
            tone={tone}
            showKey={showKeys}
            onClick={() => o.onSelect?.()}
          />
        ))}
      </div>
    </CheckpointCard>
  )
}

/* ---- shared pieces (still exported for standalone use / stories) ---- */

/** "Jordan then hears …" — the spoken consequence of the choice. */
export function PreviewLine({ label = 'Jordan then hears', quote }: { label?: string; quote: string }) {
  return (
    <div className="rounded-xl bg-bg-app px-3 py-2.5">
      <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</div>
      <p className="text-[13px] italic leading-normal text-text-secondary">“{quote}”</p>
    </div>
  )
}

/** The 2s replay clip — its own resolution, self-driving playback. */
export function ClipPlayerRow({ label, durationMs = 2000 }: { label: string; durationMs?: number }) {
  const [bars] = useState(() => generateBars(24).map((b) => ({ ...b, tone: 'flag' as const })))
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!playing) return
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      setProgress(p)
      if (p >= 1) { setPlaying(false); return }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [playing, durationMs])

  const toggle = () => {
    if (playing) { setPlaying(false); return }
    setProgress((p) => (p >= 1 ? 0 : p))
    setPlaying(true)
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-bg-app px-3 py-2">
      <button data-clip-play aria-label={playing ? 'Pause clip' : 'Play clip'} onClick={toggle} className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-text text-text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app active:translate-y-px">
        {playing ? <span className="flex gap-[3px]"><span className="h-3 w-[3px] bg-current" /><span className="h-3 w-[3px] bg-current" /></span> : <Play size={11} className="ml-0.5 fill-current" />}
      </button>
      <WaveformTrack className="h-5 flex-1" height={20} bars={bars} progress={progress} aria-label="Replay clip" />
      <span className="tabular shrink-0 text-[11.5px] text-text-muted">{label}</span>
    </div>
  )
}
