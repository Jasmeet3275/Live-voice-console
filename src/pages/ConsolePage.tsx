import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Info, PhoneOff, Bot, Phone, ChevronRight, Moon, Sun, Scissors, Headset, Keyboard } from 'lucide-react'
import { EmptyState, Badge, Button, Select, IconButton, Tooltip, StatusChip, Pressable, Dialog, Kbd } from '@/components/ui'
import { CallProvider } from '@/store/CallProvider'
import { useCall, useCallSend } from '@/hooks/useCall'
import { useClock } from '@/hooks/useClock'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTheme } from '@/hooks/useTheme'
import { MockTransport } from '@/mock/mockTransport'
import { scenarios } from '@/mock/scenarios'
import { CallDock } from '@/components/domain/CallDock'
import { RecordingIndicator } from '@/components/domain/RecordingIndicator'
import { TranscriptLine } from '@/components/domain/TranscriptLine'
import { CallerPanel, type Caller } from '@/components/domain/CallerPanel'
import { StepShell } from '@/components/domain/StepShell'
import { SlotCard, type Slot } from '@/components/domain/SlotCard'
import { ConfidenceMeter } from '@/components/domain/ConfidenceMeter'
import { HumanInputModal } from '@/components/domain/HumanInputModal'
import { TakeOverWizard } from '@/components/domain/TakeOverWizard'
import { ShortcutsDialog } from '@/components/domain/ShortcutsDialog'
import { LiveAnnouncer } from '@/components/domain/LiveAnnouncer'
import { CallSummary } from '@/components/domain/CallSummary'
import { deriveCallSummary } from './callSummary'
import { STEP_META } from '@/components/domain/stepMeta'
import { formatTime } from '@/lib/audio'
import { cn } from '@/lib/cn'
import type { FeedItem, Step } from '@/types/call'

const CALLER: Caller = {
  name: 'Jordan Rivera',
  phoneMasked: '+1 (415) •••-4821',
  status: 'returning',
  visitsCount: 4,
  lastVisit: '3 weeks ago',
  preferredStylist: 'Marco',
  usualService: 'Skin fade + beard',
  visits: [
    { date: 'Aug 22', service: 'Skin fade + beard trim', stylist: 'Marco' },
    { date: 'Jul 30', service: 'Skin fade', stylist: 'Marco' },
    { date: 'Jul 2', service: 'Haircut', stylist: 'Alex' },
  ],
  note: 'Prefers not to be upsold. Runs a few minutes late.',
}

// ---- one agent step ----

function StepView({
  step, selectedSlotId,
}: {
  step: Step
  selectedSlotId?: string
}) {
  const { label, Icon } = STEP_META[step.type]

  let body: React.ReactNode = step.detail ? <span>{step.detail}</span> : null
  if (step.type === 'assess_confidence' && step.output) {
    const o = step.output as { word: string; confidence: number }
    body = <ConfidenceMeter label={`“${o.word}”`} value={o.confidence} />
  } else if (step.type === 'recommend' && Array.isArray(step.output)) {
    // Display-only in the trace; picking happens in the input modal.
    const slots = step.output as Slot[]
    body = slots.length ? (
      <div className="flex flex-col gap-2">
        {slots.map((s) => (
          <SlotCard key={s.id} slot={s} selected={selectedSlotId === s.id} />
        ))}
      </div>
    ) : (
      <span className="text-text-muted">No open slots for the requested time.</span>
    )
  }

  return (
    <StepShell label={label} icon={<Icon size={15} />} state={step.state} statusLabel={step.statusLabel}>
      {body}
    </StepShell>
  )
}

// ---- agent reasoning block ----

function AgentBlock({
  item, active, selectedSlotId,
}: {
  item: Extract<FeedItem, { kind: 'turn' }>
  active: boolean
  selectedSlotId?: string
}) {
  // Steps are for observability — closed by default; the operator can expand.
  const [manualOpen, setManualOpen] = useState<boolean | null>(null)
  const open = manualOpen ?? false
  const isSystem = item.speaker === 'system'
  const isOperator = item.speaker === 'operator'
  const roleLabel = isOperator ? 'You (Operator)' : isSystem ? 'System' : 'Agent'
  const RoleIcon = isOperator ? Headset : isSystem ? Phone : Bot
  const roleBadge = isOperator ? 'bg-waiting-subtle text-waiting' : isSystem ? 'bg-surface-2 text-text-muted' : 'bg-accent-subtle text-accent'
  const needsInput = item.steps.some((s) => s.state === 'waiting')

  // What to surface in the collapsed header: the live step, else the outcome.
  const activeStep = item.steps.find((s) => s.state === 'running' || s.state === 'waiting')
  const lastStep = item.steps[item.steps.length - 1]
  const headerNote = activeStep
    ? `${STEP_META[activeStep.type].label}…`
    : item.summary ?? (lastStep ? STEP_META[lastStep.type].label : '')

  return (
    <div className={cn('rounded-xl border transition-colors', active || needsInput ? 'border-accent-border' : 'border-border', 'bg-surface')}>
      <Pressable
        onClick={() => setManualOpen((prev) => !(prev ?? false))}
        aria-expanded={open}
        aria-controls={`steps-${item.id}`}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-surface-hover"
      >
        <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', roleBadge)}>
          <RoleIcon size={12} />
        </span>
        <span className="shrink-0 text-caption font-medium text-text-secondary">
          {roleLabel}
        </span>
        <span className="min-w-0 truncate text-caption text-text-muted">· {headerNote}</span>
        <StatusChip status={item.status} size="sm" className="ml-auto shrink-0" />
        <ChevronRight size={15} className={cn('shrink-0 text-text-muted transition-transform', open && 'rotate-90')} />
      </Pressable>
      {open && (
        <div id={`steps-${item.id}`} className="ml-3 flex flex-col gap-2 border-l border-border py-2 pl-4 pr-3">
          {item.steps.map((step) => (
            <StepView key={step.id} step={step} selectedSlotId={selectedSlotId} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---- conversation feed (store-only; auto-scrolls to the active item) ----

const Feed = memo(function Feed({ over }: { over: boolean }) {
  const call = useCall()
  const send = useCallSend()
  const endRef = useRef<HTMLDivElement>(null)

  const onCorrect = useCallback(
    (lineId: string, wordIndex: number, chosen: string) => send({ type: 'correctWord', lineId, wordIndex, chosen }),
    [send],
  )

  const lastTurnId = useMemo(() => [...call.feed].reverse().find((i) => i.kind === 'turn')?.id, [call.feed])
  const summary = over ? deriveCallSummary(call, CALLER.name) : null

  // Auto-focus the latest activity so the operator always sees what's happening.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [call.feed, over])

  if (call.feed.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-24">
        <EmptyState
          title="Press Start to begin the call"
          description="The conversation and the agent's steps appear here in order."
          action={
            <span className="flex items-center gap-1.5 text-caption text-text-muted">
              Press <Kbd>Space</Kbd> or the Start button
            </span>
          }
        />
      </div>
    )
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
          return (
            <div key={item.id} className="my-1 flex items-center justify-center gap-2" role="status">
              <span className="h-px w-8 bg-border" />
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption font-medium',
                  item.tone === 'error' ? 'border-error-border bg-error-subtle text-error' : 'border-border bg-surface-2 text-text-secondary',
                )}
              >
                <PhoneOff size={12} /> {item.text}
              </span>
              <span className="h-px w-8 bg-border" />
            </div>
          )
        }
        return (
          <AgentBlock
            key={item.id}
            item={item}
            active={item.id === lastTurnId}
            selectedSlotId={call.selectedSlotId}
          />
        )
      })}
      {summary && <CallSummary {...summary} className="mx-auto mt-2 w-full max-w-md" />}
      <div ref={endRef} />
    </div>
  )
})

// ---- centered demo controls ----

function DemoBar({ scenarioId, onScenario, onRestart }: { scenarioId: string; onScenario: (id: string) => void; onRestart: () => void }) {
  const clock = useClock()
  const call = useCall()
  const started = clock.elapsed > 0
  // The clock reflects only playback now — a checkpoint no longer stops the call.
  const startLabel = clock.ended ? 'Ended' : clock.playing ? 'Pause' : started ? 'Resume' : 'Start demo'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div className="w-fit">
          <Select aria-label="Demo scenario" value={scenarioId} onValueChange={onScenario} options={scenarios.map((s) => ({ value: s.id, label: s.label }))} />
        </div>
        <Button variant="primary" leftIcon={clock.playing ? <Pause size={16} /> : <Play size={16} />} onClick={clock.toggle} disabled={clock.ended}>
          {startLabel}
        </Button>
        <Tooltip content="Restart demo">
          <IconButton aria-label="Restart demo" variant="secondary" icon={<RotateCcw size={16} />} onClick={onRestart} />
        </Tooltip>
        <span className="tabular text-caption text-text-muted">
          {formatTime(clock.elapsed / 1000)} / {formatTime(clock.duration / 1000)}
        </span>
      </div>
      {call.pending?.hint && (
        <div className="flex items-center gap-1.5 rounded-lg border border-waiting-border bg-waiting-subtle px-3 py-1.5 text-caption font-medium text-waiting">
          <Info size={14} /> {call.pending.hint}
        </div>
      )}
    </div>
  )
}

function CallStatus() {
  const call = useCall()
  const dropped = !call.connected && !call.ended && call.feed.length > 0
  const tone = call.ended || dropped ? 'error' : call.connected ? 'success' : 'neutral'
  const label = call.ended ? 'Call ended' : dropped ? 'Caller dropped' : call.connected ? 'Connected' : 'Ready'
  return <Badge tone={tone}>{label}</Badge>
}

function FloatingRec({ className }: { className?: string }) {
  const call = useCall()
  return <RecordingIndicator recording={call.recording && call.connected && !call.ended} className={className} />
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Tooltip content={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
      <IconButton aria-label="Toggle theme" variant="ghost" icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />} onClick={toggle} />
    </Tooltip>
  )
}

function BottomDock({ onTakeOver, onBook, onRequestEnd }: { onTakeOver: () => void; onBook: () => void; onRequestEnd: () => void }) {
  const call = useCall()
  const send = useCallSend()
  const clock = useClock()

  const lastUtterance = [...call.feed].reverse().find((i) => i.kind === 'utterance')
  const callerSpeaking = clock.playing && lastUtterance?.speaker === 'caller'
  const agentSpeaking = clock.playing && lastUtterance?.speaker === 'ai'
  const dropped = !call.connected && !call.ended && call.feed.length > 0
  const inactive = call.ended || dropped
  const notStarted = clock.elapsed === 0 // controls stay inert until the call begins

  return (
    <div className="shrink-0 border-t border-border bg-surface p-3">
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        <div className="min-w-0 flex-1">
        {inactive ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 py-3 text-caption text-text-muted">
            <PhoneOff size={14} /> {dropped ? 'Caller dropped — booking held' : 'Call ended'}
          </div>
        ) : (
          <CallDock
            progress={clock.progress}
            currentTime={clock.elapsed}
            duration={clock.duration}
            onSeek={(f) => clock.seek(f * clock.duration)}
            muted={call.muted}
            onMuteChange={(on) => send({ type: 'mute', on })}
            speakerOn={call.speakerOn}
            onSpeakerChange={(on) => send({ type: 'speaker', on })}
            inControl={call.operatorInControl}
            onTakeOver={onTakeOver}
            onRelease={() => send({ type: 'release' })}
            onEndCall={onRequestEnd}
            onBook={onBook}
            callerName={CALLER.name}
            callerSpeaking={callerSpeaking}
            agentSpeaking={agentSpeaking}
            level={clock.level}
            disabled={notStarted}
          />
        )}
        </div>
      </div>
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
  const [wizardOpen, setWizardOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // The call is over → show the end-of-call summary inline in the feed. Keyed off
  // the clock/call ending (not the caller-dropped moment) so it lands after the
  // agent's recovery steps have played out, not mid-recovery.
  const over = clock.ended || call.ended

  // Take over: stop the AI (clears any pending checkpoint) and open the
  // manual booking wizard so the operator can immediately act.
  const takeOver = useCallback(() => {
    send({ type: 'takeOver' })
    setWizardOpen(true)
  }, [send])
  const openWizard = useCallback(() => setWizardOpen(true), [])

  useKeyboardShortcuts({
    blocked: Boolean(call.pending) || wizardOpen || endOpen || shortcutsOpen,
    active: !call.ended,
    started: clock.elapsed > 0,
    inControl: call.operatorInControl,
    togglePlay: clock.toggle,
    toggleMute: () => send({ type: 'mute', on: !call.muted }),
    toggleSpeaker: () => send({ type: 'speaker', on: !call.speakerOn }),
    takeOver,
    handBack: () => send({ type: 'release' }),
    book: openWizard,
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
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
            <Scissors size={16} />
          </span>
          <span className="text-body-strong font-semibold text-text">Zoca Front Desk</span>
        </div>
        <div className="order-last w-full sm:order-none sm:flex sm:w-auto sm:flex-1 sm:justify-center">
          <DemoBar scenarioId={scenarioId} onScenario={onScenario} onRestart={onRestart} />
        </div>
        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <CallStatus />
          <Tooltip content="Keyboard shortcuts">
            <Button variant="ghost" size="sm" className="gap-1.5" aria-label="Keyboard shortcuts" onClick={() => setShortcutsOpen(true)}>
              <Keyboard size={16} />
            </Button>
          </Tooltip>
          <ThemeToggle />
        </div>
      </header>

      <main id="conversation" aria-label="Call conversation" className="relative min-h-0 flex-1">
        <CallerPanel caller={CALLER} className="absolute left-3 top-3 z-20" />
        <FloatingRec className="absolute right-3 top-3 z-20" />
        <div className="h-full overflow-auto">
          <Feed over={over} />
        </div>
      </main>

      <BottomDock onTakeOver={takeOver} onBook={openWizard} onRequestEnd={() => setEndOpen(true)} />
      <HumanInputModal onTakeOver={takeOver} />
      <TakeOverWizard
        key={wizardOpen ? 'wizard-open' : 'wizard-closed'}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onBook={(b) => send({ type: 'operatorBook', services: b.services, stylist: b.stylist, time: b.time, deposit: b.deposit })}
      />
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

  return (
    <CallProvider key={`${scenarioId}:${runId}`} transport={transport}>
      <ConsoleShell scenarioId={scenarioId} onScenario={onScenario} onRestart={onRestart} />
    </CallProvider>
  )
}
