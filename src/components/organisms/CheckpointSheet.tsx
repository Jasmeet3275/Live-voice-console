import { useEffect, useRef, useState } from 'react'
import { Play, Check } from 'lucide-react'
import { CheckpointCard, type CheckpointTone } from '@/components/molecules/CheckpointCard'
import { WaveformTrack, generateBars } from '@/components/organisms/WaveformTrack'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * CheckpointSheet — one component, every variant. The frame never
 * changes: claim (deciding number in amber) · what's blocked · an
 * evidence block the operator checks · 2–3 decision cards (AI's pick
 * marked, last is the dashed slower/safer path) · readback.
 * ------------------------------------------------------------------ */

export interface CheckpointOption {
  /** Keycap hint line, e.g. "Confirm · Enter". */
  key: string
  title: string
  rationale: string
  /** The AI's recommended option — teal (or ink, in a hand-off). */
  pick?: boolean
  /** The slower / safer path — rendered dashed. */
  dashed?: boolean
  onSelect?: () => void
}

function OptionCard({
  opt, tone, active, showKey, onClick,
}: {
  opt: CheckpointOption; tone: CheckpointTone; active: boolean; showKey: boolean; onClick: () => void
}) {
  // The selected card carries the emphasis (teal fill, or ink fill in a hand-off);
  // the "AI's pick" badge stays on its card so the recommendation is always visible.
  const darkActive = active && tone === 'ink'
  return (
    <button
      data-option
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex w-full flex-col rounded-xl p-3 text-left transition-transform duration-150 hover:-translate-y-0.5 sm:w-auto sm:min-w-[190px] sm:flex-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        active
          ? darkActive ? 'border-[1.5px] border-text bg-text' : 'border-[1.5px] border-accent bg-accent-subtle'
          : opt.dashed ? 'border border-dashed border-border-strong bg-bg-app' : 'border border-border-strong bg-bg-app',
      )}
    >
      {/* header row — top-aligned across cards */}
      <div className="mb-1.5 flex items-start gap-1.5">
        <span className={cn('text-[14.5px] font-semibold leading-tight', darkActive ? 'text-text-inverse' : active ? 'text-success' : 'text-text')}>
          {opt.title}
        </span>
        {opt.pick && (
          <span className={cn('mt-0.5 shrink-0 rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]', darkActive ? 'bg-white/20 text-white' : active ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-text-secondary')}>AI’s pick</span>
        )}
        {active && <Check size={15} className={cn('ml-auto mt-0.5 shrink-0', darkActive ? 'text-text-inverse' : 'text-accent')} />}
      </div>
      {/* rationale grows so the key row bottom-aligns across cards */}
      <p className={cn('flex-1 text-[11.5px] leading-[1.45]', darkActive ? 'text-text-inverse/80' : active ? 'text-success' : 'text-text-muted')}>{opt.rationale}</p>
      {showKey && <p className={cn('mt-2 text-[11px] font-semibold', darkActive ? 'text-text-inverse/90' : active ? 'text-accent' : 'text-text-secondary')}>{opt.key}</p>}
    </button>
  )
}

export function CheckpointSheet({
  label, category, cost, tone = 'hold',
  claim, subline, evidence, options, readback, readbackLabel,
  showKeys = true, indent = false, autoFocus = false, className,
}: {
  label: string
  category?: string
  cost?: string
  tone?: CheckpointTone
  /** One sentence; embed the deciding number as <b className="text-warning">. */
  claim: React.ReactNode
  subline?: string
  /** The block the operator checks the claim against (clip, record, trace…). */
  evidence?: React.ReactNode
  options: CheckpointOption[]
  /** What the caller hears the moment you choose. */
  readback?: string
  /** Override the readback eyebrow (default "Jordan then hears"). */
  readbackLabel?: string
  showKeys?: boolean
  indent?: boolean
  /** Move focus onto the AI's pick when the checkpoint opens (live console only;
   *  off in the static ?demo gallery so it doesn't hijack the page on load). */
  autoFocus?: boolean
  className?: string
}) {
  // Selection starts on the AI's pick; clicking a card moves it (and fires onSelect).
  const [selected, setSelected] = useState(() => options.find((o) => o.pick)?.key ?? options[0]?.key)
  const groupRef = useRef<HTMLDivElement>(null)
  const evidenceRef = useRef<HTMLDivElement>(null)

  // When the checkpoint opens, move focus to the natural starting point so the
  // operator can act with the keyboard immediately (no hunting for it). If the
  // evidence has a replay clip (the "Held — you decide" word check), that's the
  // clip's play button — you listen before you decide; otherwise the AI's pick.
  // The sheet is remounted per checkpoint, so this fires once when it appears.
  useEffect(() => {
    if (!autoFocus) return
    const clip = evidenceRef.current?.querySelector<HTMLButtonElement>('[data-clip-play]')
    if (clip) { clip.focus(); return }
    const cards = groupRef.current?.querySelectorAll<HTMLButtonElement>('[data-option]')
    if (!cards?.length) return
    const pick = Math.max(0, options.findIndex((o) => o.pick))
    cards[pick]?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Arrow keys rove focus across the decision cards (Enter/Space then activates
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
    <CheckpointCard label={label} stage={category} cost={cost} tone={tone} indent={indent} className={className}>
      <p className="mb-1 text-[14px] leading-[1.5] text-text">{claim}</p>
      {subline && <p className="mb-3 text-[12.5px] leading-[1.5] text-text-secondary">{subline}</p>}
      {evidence && <div ref={evidenceRef} className="mb-3">{evidence}</div>}
      <div ref={groupRef} role="group" aria-label="Choose an option — Arrow keys to move, Enter to pick" onKeyDown={onArrowNav} className="mb-3 flex flex-wrap items-stretch gap-2.5">
        {options.map((o) => (
          <OptionCard
            key={o.key}
            opt={o}
            tone={tone}
            active={selected === o.key}
            showKey={showKeys}
            onClick={() => { setSelected(o.key); o.onSelect?.() }}
          />
        ))}
      </div>
      {readback && <PreviewLine label={readbackLabel} quote={readback} />}
    </CheckpointCard>
  )
}

/* ---- shared evidence / readback pieces ---- */

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
