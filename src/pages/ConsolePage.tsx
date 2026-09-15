import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, PhoneOff, Moon, Sun, Keyboard, ClipboardList, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button, Select, IconButton, Tooltip, Dialog } from '@/components/ui'
import { CallProvider } from '@/store/CallProvider'
import { useCall, useCallSend } from '@/hooks/useCall'
import { useClock } from '@/hooks/useClock'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTheme } from '@/hooks/useTheme'
import { MockTransport } from '@/mock/mockTransport'
import { scenarios } from '@/mock/scenarios'
import { Transport } from '@/components/domain/Transport'
import { WaveformTrack } from '@/components/domain/WaveformTrack'
import { TranscriptLine } from '@/components/domain/TranscriptLine'
import { CustomerRail } from '@/components/domain/CustomerRail'
import { AgentSteps, type AgentStepRow } from '@/components/domain/AgentSteps'
import { InlineCheckpoint } from '@/components/domain/InlineCheckpoint'
import { OperatorNotice, ThreadNotice } from '@/components/domain/threadParts'
import { ShortcutsDialog } from '@/components/domain/ShortcutsDialog'
import { LiveAnnouncer } from '@/components/domain/LiveAnnouncer'
import { deriveCallSummary } from './callSummary'
import { deriveBookingRecord } from './bookingRecord'
import { RecordPanel } from './RecordPanel'
import { BookingPage } from './BookingPage'
import { CustomerPage } from './CustomerPage'
import { CALLER } from './caller'
import { STEP_META } from '@/components/domain/stepMeta'
import { formatTime } from '@/lib/audio'
import { cn } from '@/lib/cn'
import type { FeedItem, Step } from '@/types/call'

// ---- agent reasoning trace (the quiet AgentSteps strip) ----

/** Map a live Step to an AgentSteps row: the tool name, what it found, and the
 *  status label (%, "Charged", "Refreshed"…) in the trailing slot. */
function toRows(steps: Step[]): AgentStepRow[] {
  return steps.map((s) => ({
    name: STEP_META[s.type].label,
    detail: s.detail ?? '',
    ms: s.statusLabel ?? '',
  }))
}

function AgentTrace({ item }: { item: Extract<FeedItem, { kind: 'turn' }> }) {
  // Operator/System actions aren't "agent steps" — keep the role in the summary.
  const isOperator = item.speaker === 'operator'
  const isSystem = item.speaker === 'system'
  const prefix = isOperator ? 'You · ' : isSystem ? 'System · ' : ''

  const activeStep = item.steps.find((s) => s.state === 'running' || s.state === 'waiting')
  const lastStep = item.steps[item.steps.length - 1]
  const note = activeStep
    ? `${STEP_META[activeStep.type].label}…`
    : item.summary ?? (lastStep ? STEP_META[lastStep.type].label : '—')
  const summary = `${prefix}${note}`

  if (item.steps.length === 0) {
    return (
      <div className="rounded-[11px] bg-surface-2 px-[13px] py-[9px] text-[11.5px] text-text-muted">{summary}</div>
    )
  }
  // Trace is for observability — collapsed by default; the operator can expand.
  return <AgentSteps summary={summary} steps={toRows(item.steps)} defaultOpen={false} />
}

// ---- conversation feed (store-only; auto-scrolls to the active item) ----

/** Pre-call resting state (design_handoff "Transcript empty state · 1B — quiet"):
 *  bars at rest, one line, and an ink outline Start (Space also works). No dashed
 *  box — an empty transcript is a normal resting state, not a missing thing. */
function PreCallEmptyState() {
  const clock = useClock()
  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-4 pb-24 text-center">
      <div className="mb-5 flex items-center gap-[3px]" aria-hidden>
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i} className="h-1.5 w-[3px] rounded-[2px] bg-border-strong" />
        ))}
      </div>
      <div className="mb-1.5 text-[19px] font-semibold tracking-[-0.02em] text-text">Waiting for the call</div>
      <p className="mb-5 max-w-[340px] text-[13.5px] leading-[1.6] text-text-secondary">The conversation and the AI's steps will appear here in order.</p>
      <button
        onClick={clock.toggle}
        className="flex h-[38px] items-center gap-2 rounded-[11px] border border-border bg-surface px-[17px] transition-colors hover:border-border-strong hover:bg-surface-2"
      >
        <Play size={13} className="fill-current text-text" />
        <span className="text-[13px] font-semibold text-text">Start call</span>
        <span className="rounded-[5px] bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-semibold text-text-secondary">Space</span>
      </button>
    </div>
  )
}

const Feed = memo(function Feed({ over, onTakeOver, onOpenBooking }: { over: boolean; onTakeOver: () => void; onOpenBooking?: () => void }) {
  const call = useCall()
  const send = useCallSend()
  const endRef = useRef<HTMLDivElement>(null)

  const onCorrect = useCallback(
    (lineId: string, wordIndex: number, chosen: string) => send({ type: 'correctWord', lineId, wordIndex, chosen }),
    [send],
  )

  // Auto-focus the latest activity so the operator always sees what's happening
  // — including a checkpoint that opens without a new feed item.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [call.feed, call.pending, over])

  if (call.feed.length === 0) {
    return <PreCallEmptyState />
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 pb-6 pt-16">
      {call.feed.map((item) => {
        if (item.kind === 'utterance') {
          return (
            <TranscriptLine
              key={item.id}
              speaker={item.speaker}
              words={item.words}
              time={item.time}
              readOnly
              onCorrectWord={(wi, chosen) => onCorrect(item.id, wi, chosen)}
            />
          )
        }
        if (item.kind === 'notice') {
          // The take-over marker stays in the thread as call history: live (pulsing
          // dot, timer, Hand back) while the operator holds, static once resolved.
          if (item.variant === 'took-over') {
            const live = !item.resolved && call.operatorInControl && !over
            return live ? (
              <LiveOperatorNotice key={item.id} onHandBack={() => send({ type: 'release' })} />
            ) : (
              <ThreadNotice
                key={item.id}
                tone="ink"
                dividerLabel="Operator held the line"
                title="You took over the call"
                who="Dana K. · desk 2"
                meta={item.resolved ? 'handed back' : 'on the line at end'}
                description={
                  item.resolved
                    ? 'You spoke to the caller while the AI stayed muted, then handed control back to the AI.'
                    : 'You spoke to the caller while the AI stayed muted.'
                }
              />
            )
          }
          // Terminal events (dropped / ended) render as a rich one-row notice
          // right where they happened. Every notice is a variant now — no pills.
          return item.variant ? <TerminalNotice key={item.id} variant={item.variant} onOpenBooking={onOpenBooking} /> : null
        }
        return <AgentTrace key={item.id} item={item} />
      })}

      {/* Operator input renders inline in the thread — never a modal. */}
      {call.pending && !over && <InlineCheckpoint onTakeOver={onTakeOver} callerName={CALLER.name} />}

      <div ref={endRef} />
    </div>
  )
})

/** The operator-took-over notice with a live "speaking" timer from the clock. */
function LiveOperatorNotice({ onHandBack }: { onHandBack: () => void }) {
  const clock = useClock()
  // Capture the elapsed time at take-over once, so the timer counts from here.
  const [start] = useState(clock.elapsed)
  const speaking = formatTime(Math.max(0, clock.elapsed - start) / 1000)
  return <OperatorNotice speaking={speaking} onHandBack={onHandBack} />
}

/** A terminal event, rendered inline where it happened (replacing the old pill):
 *  teal when a booking finished, ink when the line stopped unfinished. */
function TerminalNotice({ variant, onOpenBooking }: { variant: NonNullable<Extract<FeedItem, { kind: 'notice' }>['variant']>; onOpenBooking?: () => void }) {
  const call = useCall()
  const clock = useClock()
  const summary = deriveCallSummary(call, CALLER.name)
  const firstName = CALLER.name.split(' ')[0]
  const slot = call.slots.find((s) => s.id === call.selectedSlotId) ?? call.slots.find((s) => !s.unavailable)
  const shortTime = slot ? (slot.time.split('·').pop()?.trim() ?? slot.time) : 'the slot'
  const stylistFirst = slot?.stylist.split(' ')[0] ?? 'the stylist'
  const dur = formatTime(clock.duration / 1000)

  // The caller-drop marker is historical — it always reads as the drop, even if a
  // later recovery (call back) ends up booking. Only the *ending* notice flips to teal.
  if (variant === 'dropped-caller') {
    return (
      <ThreadNotice
        tone="ink"
        dividerLabel={`Caller hung up · ${dur}`}
        title={`${firstName} dropped mid-booking`}
        who={`during the ${shortTime} readback`}
        meta="slot held 3:12"
        description="Service and stylist are captured; time and deposit were never confirmed. The chair stays reserved for three more minutes."
      />
    )
  }

  // The call ended with a booking on the books — teal, whoever closed the line.
  if (summary?.status === 'confirmed') {
    const dep = summary.deposit
    const depText = dep
      ? dep.status === 'waived' ? 'no deposit taken'
      : dep.status === 'collected' ? `the $${dep.amount} deposit taken`
      : `a $${dep.amount} deposit pending`
      : 'no deposit'
    return (
      <ThreadNotice
        tone="teal"
        dividerLabel={`Call ended · ${dur}`}
        title={`Booked · ${summary.stylist}, ${summary.when}`}
        meta={variant === 'ended-operator' ? 'you ended the call' : 'caller hung up first'}
        description={`${summary.services.join(' + ')} · ${summary.duration} · ${summary.price} with ${depText}. Confirmation text sent to ··· 4821.`}
        action={{ label: 'Open booking', onClick: onOpenBooking }}
      />
    )
  }

  // The operator ended the call before it finished — ink.
  if (variant === 'ended-operator') {
    return (
      <ThreadNotice
        tone="ink"
        dividerLabel={`Line closed · ${dur}`}
        title="You ended the call mid-booking"
        who="Dana K. · desk 2"
        meta="slot released"
        description={`Nothing was saved and no deposit was taken. ${stylistFirst}'s ${shortTime} chair went back online when the line closed.`}
        action={{ label: 'Call back' }}
      />
    )
  }

  // The AI closed without a booking (e.g. hand-off callback / link) — neutral.
  const lastTurn = [...call.feed].reverse().find((i): i is Extract<FeedItem, { kind: 'turn' }> => i.kind === 'turn')
  return (
    <ThreadNotice
      tone="ink"
      dividerLabel={`Call ended · ${dur}`}
      title="Call ended"
      description={lastTurn?.summary ?? 'The call ended without a booking on the books.'}
    />
  )
}

// ---- header (demo rail + product header, per design_handoff/ConsoleHeader) ----

/** The demo harness — a separate rail ABOVE the product header, on its own
 *  ground (caller-bubble) and labelled "not shipped", so nothing in it can be
 *  mistaken for a real-call action. No control here is ever teal/amber: Start
 *  is ink (`bg-text`), the rest are ghost. This is the design's Recommended. */
function DemoRail({ scenarioId, onScenario, onRestart }: { scenarioId: string; onScenario: (id: string) => void; onRestart: () => void }) {
  const clock = useClock()
  const started = clock.elapsed > 0
  const startLabel = clock.ended ? 'Ended' : clock.playing ? 'Pause' : started ? 'Resume' : 'Start demo'
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-bubble-caller px-4 py-1.5">
      <span className="hidden text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted sm:inline">Demo harness · not shipped</span>
      <span className="hidden h-4 w-px bg-border sm:block" />
      <Select
        aria-label="Demo scenario"
        value={scenarioId}
        onValueChange={onScenario}
        options={scenarios.map((s) => ({ value: s.id, label: s.label }))}
        className="h-7 w-auto rounded-lg border-border bg-surface-2 px-2.5 text-[12px] data-[state=open]:border-text"
      />
      <button
        onClick={clock.toggle}
        disabled={clock.ended}
        className="flex items-center gap-1.5 rounded-lg bg-text px-2.5 py-1.5 text-[11.5px] font-semibold text-text-inverse transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {clock.playing ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
        {startLabel}
      </button>
      <Tooltip content="Reset scenario">
        <IconButton aria-label="Reset scenario" size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={onRestart} />
      </Tooltip>
      <span className="tabular ml-auto text-[11px] text-text-muted">
        {started ? `${formatTime(clock.elapsed / 1000)} / ${formatTime(clock.duration / 1000)}` : 'nothing dialled'}
      </span>
    </div>
  )
}

/** The live recording + privacy state — the design's persistent header pill. */
function RecordingPill() {
  const call = useCall()
  if (!call.recording || call.ended) return null
  return (
    <span className="hidden items-center gap-2 rounded-full border border-border px-2.5 py-1 sm:inline-flex">
      <span className="h-[7px] w-[7px] rounded-full bg-error animate-[pulse-dot_1.6s_ease-in-out_infinite]" />
      <span className="text-[11.5px] font-semibold tracking-[0.01em] text-text-secondary">Recording</span>
      <span className="h-3 w-px bg-border" />
      <span className="text-[11.5px] text-text-muted">caller notified</span>
    </span>
  )
}

/** The one thing in the bar that changes minute to minute (design: it owns the
 *  centre-left gap): ink while the operator holds, amber while the AI waits on
 *  the operator at a checkpoint. Nothing when the AI is just handling the call. */
function StatusPill() {
  const call = useCall()
  if (call.ended) return null
  if (call.operatorInControl) {
    return (
      <span className="hidden items-center gap-2 rounded-full bg-text px-3 py-1 text-text-inverse sm:inline-flex">
        <span className="h-[7px] w-[7px] rounded-full bg-current" />
        <span className="text-[12.5px] font-semibold">You have the line — AI muted</span>
      </span>
    )
  }
  if (call.pending) return <WaitingPill />
  return null
}

function WaitingPill() {
  const clock = useClock()
  const [start] = useState(clock.elapsed)
  const held = formatTime(Math.max(0, clock.elapsed - start) / 1000)
  return (
    <span className="hidden items-center gap-2 rounded-full border border-waiting-border bg-waiting-subtle px-3 py-1 sm:inline-flex">
      <span className="h-[7px] w-[7px] animate-breathe rounded-full bg-waiting" />
      <span className="text-[12.5px] font-semibold text-waiting">Waiting on you</span>
      <span className="tabular text-[12px] font-bold text-waiting">{held}</span>
    </span>
  )
}

/** Mobile header while the operator holds the line — dark "you are the voice"
 *  state: take-over status + a live mic indicator with animated level bars.
 *  Matches design_handoff / Screen 3 "Mobile · taken over". */
function MobileTakenOverHeader() {
  const clock = useClock()
  const [start] = useState(clock.elapsed)
  const since = formatTime(Math.max(0, clock.elapsed - start) / 1000)
  return (
    <div className="flex flex-col gap-3 bg-text px-4 pb-3.5 pt-2.5 text-text-inverse">
      <div className="flex items-center gap-2">
        <span className="h-[7px] w-[7px] rounded-full bg-current" />
        <span className="text-[12.5px] font-semibold">You have the line — AI muted</span>
        <span className="ml-auto text-[11.5px] opacity-70">since {since}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-text-inverse/15 text-[14px] font-semibold">JR</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15.5px] font-semibold tracking-[-0.02em]">{CALLER.name}</div>
          <div className="truncate text-[11.5px] opacity-70">your mic is live · {since}</div>
        </div>
        <div className="flex h-5 items-end gap-[2.5px]">
          {[9, 16, 20, 12].map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-[1px] bg-current"
              style={{ height: h, transformOrigin: 'bottom', animation: 'eqbar 0.9s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** The product header — one bar, two layouts. Desktop (lg+): identity, the two
 *  always-true facts, the status pill, then you and the utilities. Mobile: the
 *  caller (name + context), the clock + rec on the right, and the waveform below
 *  — matches design_handoff / Screen 3 mobile. Demo controls live in DemoRail. */
function ConsoleHeader({ onShowShortcuts }: { onShowShortcuts: () => void }) {
  const call = useCall()
  const clock = useClock()
  const navigate = useNavigate()
  const started = clock.elapsed > 0
  const recording = call.recording && !call.ended

  return (
    <header className="shrink-0 border-b border-border bg-surface">
      {/* desktop — brand · recording · status · gap · elapsed · operator · utilities */}
      <div className="hidden h-14 items-center gap-3 px-5 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="h-[22px] w-[22px] rounded-lg bg-accent" />
          <span className="text-[14.5px] font-bold tracking-[-0.015em] text-text">Zoca Front Desk</span>
          <span className="text-[13px] text-text-muted">Luxe Salon</span>
        </div>
        <RecordingPill />
        <StatusPill />
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-medium uppercase tracking-[0.11em] text-text-muted">Elapsed</div>
            <div className="tabular text-[13.5px] font-bold tracking-[-0.02em] text-text">{formatTime(clock.elapsed / 1000)}</div>
          </div>
          <span className="h-[26px] w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-text-secondary">DK</span>
            <span className="hidden text-[12.5px] text-text-secondary xl:inline">Dana K.</span>
          </div>
          <span className="h-[26px] w-px bg-border" />
          <div className="flex items-center gap-0.5">
            <Tooltip content="Keyboard shortcuts">
              <IconButton aria-label="Keyboard shortcuts" size="sm" variant="ghost" icon={<Keyboard size={16} />} onClick={onShowShortcuts} />
            </Tooltip>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* mobile — when the operator holds the line the header flips to the dark
          "you are the voice" state (Screen 3 mobile · taken over); otherwise the
          caller (tap → /customer) · clock + rec · theme, waveform below. */}
      <div className="lg:hidden">
        {call.operatorInControl && !call.ended ? (
          <MobileTakenOverHeader />
        ) : (
          <div className="flex flex-col gap-2.5 px-4 pb-3 pt-2.5">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/customer')}
                aria-label="View customer details"
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left transition-opacity active:opacity-70"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-[13px] font-semibold text-text-secondary">JR</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold tracking-[-0.02em] text-text">{CALLER.name}</div>
                  <div className="truncate text-[11.5px] text-text-muted">4 visits · usual: fade + beard</div>
                </div>
              </button>
              {started && (
                <div className="text-right">
                  <div className="tabular text-[14px] font-bold text-text">{formatTime(clock.elapsed / 1000)}</div>
                  {recording && (
                    <div className="flex items-center justify-end gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-error animate-[pulse-dot_1.6s_ease-in-out_infinite]" />
                      <span className="text-[10.5px] text-text-muted">rec</span>
                    </div>
                  )}
                </div>
              )}
              <ThemeToggle />
            </div>
            {started && (
              <WaveformTrack height={30} progress={clock.progress} onSeek={(f) => clock.seek(f * clock.duration)} />
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
      <IconButton aria-label="Toggle theme" variant="ghost" icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} onClick={toggle} />
    </Tooltip>
  )
}

/** The footer's route into the booking record on mobile (the desktop rail is
 *  docked, so this is `lg:hidden`). Shows the live record status and navigates
 *  to the /booking page. */
function MobileBookingButton() {
  const call = useCall()
  const navigate = useNavigate()
  const rec = deriveBookingRecord(call, CALLER.name)
  const editing = call.operatorInControl && rec.confirm !== 'confirmed'
  const label =
    rec.confirm === 'confirmed' ? 'Booked' : editing ? 'Fill the record' : rec.confirm === 'ready' ? 'Ready to confirm' : 'Draft'
  const dot =
    rec.confirm === 'confirmed' ? 'bg-success' : rec.confirm === 'ready' ? 'bg-accent' : editing ? 'bg-text' : 'bg-text-muted'
  return (
 
    <button
      onClick={() => navigate('/booking')}
      className="mb-2.5 flex w-full items-center gap-2 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 transition-colors hover:bg-surface-hover lg:hidden"
    >
      <ClipboardList size={16} className="text-text-secondary" />
      <span className="text-[13px] font-semibold text-text">Booking details</span>
      <span className={cn('ml-1 h-1.5 w-1.5 rounded-full', dot)} />
      <span className="text-[11.5px] text-text-muted">{label}</span>
      <ChevronRight size={16} className="ml-auto text-text-muted" />
    </button>
   
  )
}

function BottomDock({ onTakeOver, onRequestEnd }: { onTakeOver: () => void; onRequestEnd: () => void }) {
  const call = useCall()
  const send = useCallSend()
  const clock = useClock()

  const dropped = !call.connected && !call.ended && call.feed.length > 0
  const inactive = call.ended || dropped
  const notStarted = clock.elapsed === 0 // controls stay inert until the call begins

  // Once the line is closed the transport has nothing to act on — the end-of-thread
  // notice is the terminal UI, so the dock collapses to a quiet status strip. The
  // booking route stays reachable (a confirmed booking is still worth opening).
  if (inactive) {
    return (
      <div className="shrink-0 border-t border-border bg-surface px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <MobileBookingButton />
        <div className="flex items-center justify-center gap-2 text-caption text-text-muted">
          <PhoneOff size={14} /> {dropped ? 'Caller dropped' : 'Call ended'}
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 pt-2 pb-[env(safe-area-inset-bottom)] lg:px-0 lg:pt-0">
      <div className="px-3">
      <MobileBookingButton />
     </div>
      <Transport
        playing={clock.playing}
        onTogglePlay={clock.toggle}
        progress={clock.progress}
        onSeek={(f) => clock.seek(f * clock.duration)}
        clock={formatTime(clock.elapsed / 1000)}
        windowLabel={`${formatTime(clock.elapsed / 1000)} / ${formatTime(clock.duration / 1000)}`}
        muted={call.muted}
        onMute={() => send({ type: 'mute', on: !call.muted })}
        speakerOn={call.speakerOn}
        onSpeaker={() => send({ type: 'speaker', on: !call.speakerOn })}
        onReplay={() => clock.seek(Math.max(0, clock.elapsed - 5000))}
        inControl={call.operatorInControl}
        onTakeOver={onTakeOver}
        onRelease={() => send({ type: 'release' })}
        onEnd={onRequestEnd}
        disabled={notStarted}
      />
    </div>
  )
}

// The booking rail can be dragged wider/narrower from its left border.
// Right rail (booking record) and left rail (customer) resize ranges.
const RAIL_MIN = 300
const RAIL_MAX = 640
const RAIL_DEFAULT = 360
const LEFT_MIN = 220
const LEFT_MAX = 420
const LEFT_DEFAULT = 264

/** Drag handle on a docked rail's inner edge — pointer-drag to resize, Arrow
 *  keys when focused. `side` is which edge the handle sits on: a right rail's
 *  handle is on its LEFT edge (drag left = wider); a left rail's on its RIGHT. */
function RailResizeHandle({
  side, width, min, max, label, onResize,
}: {
  side: 'left' | 'right'
  width: number
  min: number
  max: number
  label: string
  onResize: (w: number) => void
}) {
  const clamp = (w: number) => Math.min(max, Math.max(min, w))
  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault()
    const move = (ev: PointerEvent) => onResize(clamp(side === 'right' ? window.innerWidth - ev.clientX : ev.clientX))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.removeProperty('user-select')
      document.body.style.removeProperty('cursor')
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  // Wider is "away from this rail's outer edge": left-arrow widens a right rail,
  // right-arrow widens a left rail.
  const widen = side === 'right' ? 'ArrowLeft' : 'ArrowRight'
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(width)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={startDrag}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          onResize(clamp(width + (e.key === widen ? 24 : -24)))
        }
      }}
      className={cn(
        'group absolute top-0 z-10 flex h-full w-3 cursor-col-resize items-center justify-center focus:outline-none',
        // Sit just inside the rail's inner edge (not straddling the border).
        side === 'right' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2',
      )}
    >
     
    </div>
  )
}

/** A collapsed rail — a 46px strip with an expand chevron, a small glyph, and a
 *  vertical label. Click the chevron (or anywhere) to bring the rail back. */
function CollapsedRail({
  side, label, onExpand, children,
}: {
  side: 'left' | 'right'
  label: string
  onExpand: () => void
  children?: React.ReactNode
}) {
  const Icon = side === 'left' ? ChevronsRight : ChevronsLeft
  return (
    <div
      className={cn(
        'hidden w-[46px] shrink-0 flex-col items-center gap-3.5 bg-surface py-3.5 lg:flex',
        side === 'left' ? 'border-r border-border' : 'border-l border-border',
      )}
    >
      <button
        onClick={onExpand}
        aria-label={`Expand ${label.toLowerCase()}`}
        className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-border text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
      >
        <Icon size={15} />
      </button>
      {children}
      <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-text-muted [writing-mode:vertical-rl]">{label}</span>
    </div>
  )
}

function ConsoleShell({
  scenarioId, onScenario, onRestart,
}: {
  scenarioId: string
  onScenario: (id: string) => void
  onRestart: () => void
}) {
  const send = useCallSend()
  const call = useCall()
  const clock = useClock()
  const navigate = useNavigate()
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT)
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT)
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [endOpen, setEndOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // The call is over → show the end-of-call summary inline in the feed. Keyed off
  // the clock/call ending (not the caller-dropped moment) so it lands after the
  // agent's recovery steps have played out, not mid-recovery.
  const over = clock.ended || call.ended

  // Take over: stop the AI (clears any pending checkpoint). The record itself
  // becomes the operator's form — the docked rail switches to it on desktop; on
  // mobile there's no rail, so route to the /booking page to fill it.
  const takeOver = useCallback(() => {
    send({ type: 'takeOver' })
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches) navigate('/booking')
  }, [send, navigate])
  // B toggles the rail between its default and a wider width (the same range
  // you get by dragging the rail's left border).
  const toggleRailWidth = useCallback(() => setRailWidth((w) => (w >= 480 ? RAIL_DEFAULT : 560)), [])
  // "Open booking" (on the booked notice) reveals the record: expand the docked
  // rail if it's collapsed on desktop; open the /booking page on mobile.
  const openBooking = useCallback(() => {
    if (typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches) { navigate('/booking'); return }
    setRightOpen(true)
  }, [navigate])

  useKeyboardShortcuts({
    blocked: Boolean(call.pending) || endOpen || shortcutsOpen,
    active: !call.ended,
    started: clock.elapsed > 0,
    inControl: call.operatorInControl,
    togglePlay: clock.toggle,
    toggleMute: () => send({ type: 'mute', on: !call.muted }),
    toggleSpeaker: () => send({ type: 'speaker', on: !call.speakerOn }),
    takeOver,
    handBack: () => send({ type: 'release' }),
    book: toggleRailWidth,
    requestEnd: () => setEndOpen(true),
    showHelp: () => setShortcutsOpen(true),
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      <a
        href="#conversation"
        className="sr-only rounded-md bg-accent px-3 py-1.5 text-caption font-medium text-accent-fg focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50"
      >
        Skip to conversation
      </a>
      <DemoRail scenarioId={scenarioId} onScenario={onScenario} onRestart={onRestart} />
      <ConsoleHeader onShowShortcuts={() => setShortcutsOpen(true)} />

      <div className="flex min-h-0 flex-1">
        {/* Docked customer context — the left rail (desktop). Collapses to a 46px
            strip; drag its right border to resize. On mobile it's the /customer
            page (header tap). */}
        {leftOpen ? (
          <div style={{ width: leftWidth }} className="relative hidden shrink-0 lg:flex">
            <CustomerRail
              caller={CALLER}
              className="w-full"
              onCollapse={() => setLeftOpen(false)}
              inference={<><b className="font-semibold text-text">4 of 4</b> past visits were fades — never a facial.</>}
            />
            <RailResizeHandle side="left" width={leftWidth} min={LEFT_MIN} max={LEFT_MAX} label="Resize customer" onResize={setLeftWidth} />
          </div>
        ) : (
          <CollapsedRail side="left" label="Caller" onExpand={() => setLeftOpen(true)}>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-[10.5px] font-semibold text-text-secondary">JR</span>
          </CollapsedRail>
        )}

        <main id="conversation" aria-label="Call conversation" className="relative min-h-0 flex-1">
          <div className="h-full overflow-auto">
            <Feed over={over} onTakeOver={takeOver} onOpenBooking={openBooking} />
          </div>
        </main>

        {/* Docked booking record — the right rail (desktop). Collapses to a 46px
            strip; becomes the operator's form on take-over; drag its left border
            (or press B) to resize. */}
        {rightOpen ? (
          <aside
            aria-label="Booking record"
            style={{ width: railWidth }}
            className="relative hidden shrink-0 border-l border-border lg:flex"
          >
            <RailResizeHandle side="right" width={railWidth} min={RAIL_MIN} max={RAIL_MAX} label="Resize booking record" onResize={setRailWidth} />
            <RecordPanel className="min-w-0 flex-1" onCollapse={() => setRightOpen(false)} />
          </aside>
        ) : (
          <CollapsedRail side="right" label="Booking record" onExpand={() => setRightOpen(true)}>
            <span className={cn('h-[9px] w-[9px] rounded-full', deriveBookingRecord(call, CALLER.name).confirm === 'confirmed' ? 'bg-success' : 'bg-border-strong')} />
          </CollapsedRail>
        )}
      </div>

      <BottomDock onTakeOver={takeOver} onRequestEnd={() => setEndOpen(true)} />

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <Dialog
        open={endOpen}
        onOpenChange={setEndOpen}
        title="End this call?"
        description="The call will be disconnected. Any unconfirmed booking will be lost unless it has been held."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEndOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { send({ type: 'endCall' }); setEndOpen(false) }} data-autofocus>End call</Button>
          </>
        }
      />
      <LiveAnnouncer />
    </div>
  )
}

/** The operator console — one merged conversation feed. */
export function ConsolePage({
  scenarioId, runId, onScenario, onRestart,
}: {
  scenarioId: string
  runId: number
  onScenario: (id: string) => void
  onRestart: () => void
}) {
  // runId is an intentional dep: bumping it (Restart) mints a fresh transport
  // even when the scenario is unchanged, so the demo replays from the start.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transport = useMemo(() => new MockTransport(scenarioId), [scenarioId, runId])

  // The router lives *below* the provider so the console (/) and the booking
  // page (/booking) share one CallStore — the booking page is just another
  // reader of the same director-fed state. HashRouter needs no server config.
  return (
    <CallProvider key={`${scenarioId}:${runId}`} transport={transport}>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<ConsoleShell scenarioId={scenarioId} onScenario={onScenario} onRestart={onRestart} />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/customer" element={<CustomerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </CallProvider>
  )
}
