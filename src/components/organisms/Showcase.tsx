import { useEffect, useRef, useState } from 'react'
import {
  Scissors, Plus, ArrowRight, Trash2, Bell, Search, CalendarPlus, Inbox, Keyboard,
} from 'lucide-react'
import {
  Button, IconButton, Badge, StatusChip, Card, CardHeader, Divider, Tooltip,
  Switch, Select, Avatar, Spinner, EmptyState, Kbd, Dialog, useToast,
  type BadgeTone, type Status,
} from '@/components/atoms'
import { useConsoleSkin } from '@/components/shared/consoleSkin'
import { TranscriptLine } from '@/components/molecules/TranscriptLine'
import { ConfidenceMeter } from '@/components/molecules/ConfidenceMeter'
import { SlotCard, type Slot } from '@/components/molecules/SlotCard'
import { CallSummary } from '@/components/organisms/CallSummary'
import { RecordingIndicator } from '@/components/molecules/RecordingIndicator'
import { MiniSpeaker } from '@/components/atoms/MiniSpeaker'
import { CallerPanel, type Caller } from '@/components/organisms/CallerPanel'
import { ShortcutsDialog } from '@/components/organisms/ShortcutsDialog'
import { BookingRecordPanel } from '@/components/organisms/BookingRecordPanel'
import { CustomerRail } from '@/components/organisms/CustomerRail'
import { BookingRail } from '@/components/molecules/BookingRail'
import { AgentSteps } from '@/components/organisms/AgentSteps'
import { Transport } from '@/components/organisms/Transport'
import { WaveformTrack } from '@/components/organisms/WaveformTrack'
import { ConsoleHeader } from '@/components/organisms/ConsoleHeader'
import { WordCheckpoint, ConfirmCheckpoint, PaymentCheckpoint, HandoffCheckpoint } from '@/components/shared/checkpoints'
import { CallEndedReceipt, CallDroppedCheckpoint } from '@/components/shared/callEnd'
import { TranscriptPanel } from '@/components/organisms/TranscriptPanel'
import { AiThinkingBubble, ResolvedInlineRow, TakeOverBar, OperatorNotice, ThreadNotice, StruckWord, HighlightWord } from '@/components/molecules/threadParts'
import { InlineSlotPick } from '@/components/molecules/inlineInputs'
import { MobileConsole } from '@/components/organisms/MobileConsole'
import type { TranscriptWord } from '@/types/call'

/* ------------------------------------------------------------------ *
 * Showcase (?demo) — the real primitives + domain components + mobile,
 * live and interactive, in the handoff skin.
 * ------------------------------------------------------------------ */

const CALLER: Caller = {
  name: 'Jordan Rivera', phoneMasked: '+1 (415) ··· 4821', status: 'returning',
  visitsCount: 4, lastVisit: '3 weeks ago', preferredStylist: 'Marco', usualService: 'Skin fade + beard',
  visits: [
    { date: 'Aug 22', service: 'Skin fade + beard', stylist: 'Marco' },
    { date: 'Jul 30', service: 'Skin fade', stylist: 'Marco' },
    { date: 'Jun 14', service: 'Skin fade', stylist: 'Marco' },
    { date: 'Jul 2', service: 'Haircut', stylist: 'Alex' },
  ],
  note: 'Prefers not to be upsold. Runs a few minutes late — Marco holds the chair.',
}
const INFERENCE = <>Never booked a facial. <b className="text-text">4 of 4</b> were fades.</>

const GREETING: TranscriptWord[] = 'Thanks for calling Luxe Salon — how can I help you today?'.split(' ').map((t) => ({ text: t, confidence: 0.98 }))
const AI_WORDS: TranscriptWord[] = 'A fade and a beard trim with Marco — let me find you an evening slot.'.split(' ').map((t) => ({ text: t, confidence: 0.98 }))
const CALLER_WORDS: TranscriptWord[] = [
  ...'I need a haircut and a beard trim, someone good with'.split(' ').map((t) => ({ text: t, confidence: 0.97 })),
  { text: 'fades', confidence: 0.58, alternatives: ['fades', 'facials'] },
]
const CALLER_WORDS_OK: TranscriptWord[] = [
  ...'I need a haircut and a beard trim, someone good with'.split(' ').map((t) => ({ text: t, confidence: 0.97 })),
  { text: 'fades', confidence: 0.99, corrected: true },
]
const SLOTS: Slot[] = [
  { id: 'r', time: 'Tmrw · 6:30 PM', stylist: 'Marco Diaz', stylistRating: 4.9, duration: '45 min', price: '$48', services: ['Haircut', 'Beard trim'], recommended: true, reasons: ['Only evening fade specialist', 'Booked 3 of 4 past visits', 'Fits both services back-to-back'] },
  { id: 'a', time: 'Tmrw · 8:00 PM', stylist: 'Alex Kim', stylistRating: 4.6, duration: '45 min', price: '$45', services: ['Haircut', 'Beard trim'], reasons: ['Also does fades', 'Later, relaxed pace'] },
  { id: 'l', time: 'Tmrw · 7:15 PM', stylist: 'Alex Kim', duration: '45 min', price: '$45', services: ['Haircut', 'Beard trim'], reasons: [], unavailable: true },
]
const AVAIL_STEPS = [
  { name: 'read_services', detail: 'matched "fade + beard" → 45 min, station 2', ms: '180ms' },
  { name: 'read_staff', detail: 'Marco certified · Alex not · Nina facials only', ms: '240ms' },
  { name: 'read_calendar', detail: 'Tue 15 Sep after 17:00 → 3 open, 2 offerable', ms: '910ms' },
]
const BADGE_TONES: BadgeTone[] = ['neutral', 'accent', 'info', 'success', 'warning', 'error']
const STATUSES: Status[] = ['running', 'success', 'warning', 'error', 'waiting']

function Group({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-b border-border py-6">
      <h2 className="mb-4 text-[15px] font-bold tracking-[-0.01em] text-text">{title}</h2>
      <div className="flex flex-col gap-7">{children}</div>
    </section>
  )
}
function Item({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5">
        <h3 className="text-micro font-semibold uppercase tracking-[0.14em] text-accent">{title}</h3>
        {hint && <p className="mt-1 text-caption text-text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-1.5">
      {label && <span className="w-24 shrink-0 text-caption text-text-muted">{label}</span>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

/** Drives a transport playhead so playback actually advances. */
function usePlayhead() {
  const [progress, setProgress] = useState(0.55)
  const [playing, setPlaying] = useState(false)
  const raf = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setProgress((p) => {
        const next = p + dt / 24 // ~24s window
        if (next >= 1) { setPlaying(false); return 1 }
        return next
      })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [playing])
  return { progress, setProgress, playing, setPlaying }
}

function ToastDemo() {
  const { toast } = useToast()
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'success', title: 'Booking confirmed', description: 'Marco at 6:30 PM tomorrow.' })}>Success</Button>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'error', title: 'Payment declined', description: 'Card •••• 4242 was declined.' })}>Error</Button>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'info', title: 'Availability refreshed' })}>Info</Button>
    </div>
  )
}
function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen} trigger={<Button variant="secondary" size="sm">Open dialog</Button>}
      title="End this call?" description="The call will be disconnected. Any unconfirmed booking will be lost."
      footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" data-autofocus onClick={() => setOpen(false)}>End call</Button></>} />
  )
}

/* ---------- assembled desktop console (held state) ---------- */

function AssembledConsole() {
  const { progress, setProgress, playing, setPlaying } = usePlayhead()
  const [muted, setMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [inControl, setInControl] = useState(false)
  const { toast } = useToast()

  return (
    <div className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-border shadow-e3">
      <ConsoleHeader state={inControl ? 'takenOver' : 'held'} clock="0:38" deadAir="0:12" operator="Jasmeet Singh" />
      <div className="flex min-h-0 flex-1">
        <CustomerRail caller={CALLER} inference={INFERENCE} />
        <main className="flex min-w-0 flex-1 flex-col bg-bg-app">
          <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-5">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Transcript</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-warning-solid" /><span className="text-[11.5px] text-warning">1 word needs review</span></span>
            <span className="ml-auto text-[11.5px] text-text-muted">Avg confidence <b className="text-text">91%</b></span>
          </div>
          <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-[18px]">
            <TranscriptLine speaker="caller" name="Jordan" words={CALLER_WORDS} time="0:06" onCorrectWord={(_, c) => toast(`Corrected → "${c}"`)} />
            <ResolvedInlineRow count={2} summary={'“tomorrow” → Tue 15 Sep · “evening” → after 5 PM'} />
            <WordCheckpoint indent onSelect={(k) => toast(`Chose: ${k}`)} />
            <AiThinkingBubble className="mt-auto" label="stalling the caller · next stall line in 6s" />
          </div>
        </main>
        <BookingRail fields={{ customer: 'Jordan Rivera' }} confirm="withheld" withheldNote="Withheld, not unknown. Resolve the flagged word and all five fill at once." />
      </div>
      <Transport
        playing={playing} onTogglePlay={() => setPlaying((p) => !p)} progress={progress} onSeek={setProgress}
        clock="0:38" windowLabel="last 24s" flagPct="38%"
        muted={muted} onMute={() => setMuted((m) => !m)} speakerOn={speakerOn} onSpeaker={() => setSpeakerOn((s) => !s)}
        onReplay={() => toast('Replaying last 5s')} onStall={() => toast('Stalling the caller')}
        inControl={inControl} onTakeOver={() => setInControl(true)} onRelease={() => setInControl(false)}
        onEnd={() => toast({ tone: 'error', title: 'Call ended' })}
      />
    </div>
  )
}

function TransportDemo() {
  const { progress, setProgress, playing, setPlaying } = usePlayhead()
  const [muted, setMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [inControl, setInControl] = useState(false)
  const { toast } = useToast()
  return (
    <Transport
      playing={playing} onTogglePlay={() => setPlaying((p) => !p)} progress={progress} onSeek={setProgress}
      clock="0:38" windowLabel="last 24s" flagPct="38%"
      muted={muted} onMute={() => setMuted((m) => !m)} speakerOn={speakerOn} onSpeaker={() => setSpeakerOn((s) => !s)}
      onReplay={() => toast('Replaying last 5s')} onStall={() => toast('Stalling the caller')}
      inControl={inControl} onTakeOver={() => setInControl(true)} onRelease={() => setInControl(false)}
      onEnd={() => toast({ tone: 'error', title: 'Call ended' })}
    />
  )
}

function WaveformDemo() {
  const [p, setP] = useState(0.6)
  return <div className="max-w-md"><WaveformTrack progress={p} onSeek={setP} flags={[{ pos: 0.67, label: '38%' }]} height={40} /></div>
}

/* ---------- sections ---------- */

function PrimitivesSection() {
  const [switchOn, setSwitchOn] = useState(true)
  const [sel, setSel] = useState('marco')
  return (
    <Group id="primitives" title="Primitives">
      <Item title="Buttons" hint="Flat, border-first fills; filled CTAs lift on hover, press with a translate.">
        <Row label="Variants"><Button variant="primary">Book appointment</Button><Button variant="secondary">Take over</Button><Button variant="ghost">Cancel</Button><Button variant="danger">End call</Button></Row>
        <Row label="Sizes"><Button size="sm">Small</Button><Button size="md">Medium</Button><Button size="lg">Large</Button></Row>
        <Row label="Icons"><Button leftIcon={<Plus size={16} />}>New</Button><Button variant="secondary" rightIcon={<ArrowRight size={16} />}>Continue</Button><Button variant="danger" leftIcon={<Trash2 size={16} />}>Delete</Button></Row>
        <Row label="States"><Button loading>Booking…</Button><Button disabled>Disabled</Button></Row>
      </Item>
      <Item title="Icon buttons"><Row><IconButton aria-label="Add" variant="primary" icon={<Plus size={18} />} /><IconButton aria-label="Search" variant="secondary" icon={<Search size={18} />} /><IconButton aria-label="Alerts" variant="ghost" icon={<Bell size={18} />} /><IconButton aria-label="Delete" variant="danger" icon={<Trash2 size={18} />} /></Row></Item>
      <Item title="Badges & status" hint="Pills for metadata; status always pairs colour with an icon or dot.">
        <Row label="Badges">{BADGE_TONES.map((t) => <Badge key={t} tone={t}>{t}</Badge>)}</Row>
        <Row label="Status">{STATUSES.map((s) => <StatusChip key={s} status={s} />)}</Row>
      </Item>
      <Item title="Forms" hint="Focus shifts the field border to the teal accent.">
        <Row label="Input"><input placeholder="Search bookings…" className="h-10 w-64 rounded-md border border-border-strong bg-surface px-3 text-sm text-text placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none" /></Row>
        <Row label="Select"><div className="w-56"><Select aria-label="Stylist" value={sel} onValueChange={setSel} options={[{ value: 'marco', label: 'Marco Diaz' }, { value: 'alex', label: 'Alex Kim' }, { value: 'sam', label: 'Sam Lee' }]} /></div></Row>
        <Row label="Switch"><label className="flex items-center gap-2 text-caption text-text"><Switch checked={switchOn} onCheckedChange={setSwitchOn} aria-label="Require deposit" /> Require deposit</label><Switch disabled aria-label="Disabled" /></Row>
      </Item>
      <Item title="Cards" hint="Border-first; shadow only when elevation is real.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card><CardHeader title="Plain card" subtitle="Border defines the edge" /><p className="mt-2 text-caption text-text-secondary">No shadow — the warm border carries containment.</p></Card>
          <Card raised><CardHeader title="Raised card" subtitle="Faint warm shadow" action={<IconButton aria-label="Add" size="sm" variant="ghost" icon={<Plus size={16} />} />} /><p className="mt-2 text-caption text-text-secondary">Elevation for things that truly float.</p></Card>
        </div>
      </Item>
      <Item title="Overlays & feedback">
        <Row label="Tooltip"><Tooltip content="Shortcut: T"><Button variant="secondary" size="sm">Hover me</Button></Tooltip></Row>
        <Row label="Dialog"><DialogDemo /></Row>
        <Row label="Toast"><ToastDemo /></Row>
      </Item>
      <Item title="Avatars · spinner · keys">
        <Row label="Avatar"><Avatar name="Jordan Rivera" size="sm" /><Avatar name="Jordan Rivera" size="md" /><Avatar name="Marco Diaz" size="lg" /></Row>
        <Row label="Spinner"><Spinner size={16} /><Spinner size={20} /></Row>
        <Row label="Keys"><span className="flex items-center gap-1.5 text-caption text-text-muted"><Kbd>Space</Kbd> play · <Kbd>T</Kbd> take over · <Kbd>⌘</Kbd><Kbd>K</Kbd></span></Row>
      </Item>
      <Item title="Empty state" hint="Composed and actionable.">
        <EmptyState icon={<Inbox size={20} />} title="No calls in the queue" description="When a customer calls the front desk, the live console appears here." action={<Button size="sm" leftIcon={<CalendarPlus size={16} />}>Start a demo call</Button>} />
      </Item>
      <Divider />
    </Group>
  )
}

function DomainSection() {
  const [selected, setSelected] = useState('r')
  const [shortcuts, setShortcuts] = useState(false)
  const { toast } = useToast()
  return (
    <Group id="domain" title="Domain components">
      <Item title="Assembled console" hint="Every organism working together at the held state — header, both bars, hold sheet, transport.">
        <AssembledConsole />
      </Item>
      <Item title="Console header" hint="Brand, recording pill, state pill (held / taken-over / resolved), elapsed clock, operator.">
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border border-border"><ConsoleHeader state="held" clock="0:38" deadAir="0:12" /></div>
          <div className="overflow-hidden rounded-xl border border-border"><ConsoleHeader state="takenOver" clock="1:06" /></div>
        </div>
      </Item>
      <Item title="Customer bar (left)" hint="Identity, tags, team note, visit history, the AI's evidence, card on file."><div className="h-[520px] w-[264px] overflow-hidden rounded-2xl border border-border"><CustomerRail className="h-full border-r-0" caller={CALLER} inference={INFERENCE} /></div></Item>
      <Item title="Booking bar (right)" hint="Withheld → filled; four confirm states. Row count never changes.">
        <div className="flex flex-wrap gap-4">
          <div className="h-[440px] w-[330px] overflow-hidden rounded-2xl border border-border"><BookingRail className="h-full border-l-0" fields={{ customer: 'Jordan Rivera' }} confirm="withheld" withheldNote="Resolve the flagged word and all five fields fill at once." /></div>
          <div className="h-[440px] w-[330px] overflow-hidden rounded-2xl border border-border"><BookingRail className="h-full border-l-0" fields={{ customer: 'Jordan Rivera', service: 'Haircut + beard, fade', stylist: 'Marco Diaz', length: '45 min', time: 'Tue · 6:30 PM', price: '$48 · $15 deposit' }} confirm="ready" /></div>
        </div>
      </Item>
      <Item title="Checkpoint sheet" hint="One component, four variants — see the Chat section for all of them. Correct-word shown here."><div className="max-w-2xl"><WordCheckpoint onSelect={(k) => toast(`Chose: ${k}`)} /></div></Item>
      <Item title="Transport" hint="Play · clock · trailing waveform (seekable, per-speaker) · window; mute / speaker / replay / stall, Take over, End call."><div className="overflow-hidden rounded-2xl border border-border"><TransportDemo /></div></Item>
      <Item title="Waveform" hint="Per-speaker bars, low-confidence flag, seekable playhead (click or drag)."><WaveformDemo /></Item>
      <Item title="Agent steps" hint="Tool-call trace as a collapsible quiet strip."><div className="max-w-xl"><AgentSteps summary="availability · 3 calls, 1.4s" steps={AVAIL_STEPS} /></div></Item>
      <Item title="Transcript" hint="Asymmetric bubbles; click the flagged word to correct it in place.">
        <div className="flex max-w-xl flex-col gap-3">
          <TranscriptLine speaker="ai" words={AI_WORDS} time="0:41" />
          <TranscriptLine speaker="caller" name="Jordan" words={CALLER_WORDS} time="0:06" onCorrectWord={(_, c) => toast(`Corrected → "${c}"`)} />
        </div>
      </Item>
      <Item title="Thread rows" hint="Auto-resolved notice + the AI thinking / stalling line.">
        <div className="flex max-w-xl flex-col gap-2.5">
          <ResolvedInlineRow count={2} summary={'“tomorrow” → Tue 15 Sep · “evening” → after 5 PM'} />
          <AiThinkingBubble label="checking services, staff and the calendar" />
        </div>
      </Item>
      <Item title="Confidence meter"><div className="flex max-w-md flex-col gap-3"><ConfidenceMeter label="high" value={0.97} /><ConfidenceMeter label="med" value={0.72} /><ConfidenceMeter label="low" value={0.58} /></div></Item>
      <Item title="Slot cards" hint="Selection (teal fill) is separate from recommendation (teal border). Pick one — the others clear.">
        <div role="radiogroup" aria-label="Slots" className="grid gap-3 sm:grid-cols-3">{SLOTS.map((s) => <SlotCard key={s.id} slot={s} selected={selected === s.id} onSelect={setSelected} />)}</div>
      </Item>
      <Item title="Caller panel" hint="Click the avatar for the caller record popover."><div className="relative h-14"><CallerPanel caller={CALLER} className="absolute left-0 top-0" /></div></Item>
      <Item title="Speakers & recording"><Row><MiniSpeaker role="customer" name="Jordan" speaking level={0.6} /><MiniSpeaker role="ai" name="Zoca AI" speaking level={0.4} /><MiniSpeaker role="operator" name="You" muted /><RecordingIndicator recording /></Row></Item>
      <Item title="Booking record · operator editing" hint="On take-over the record becomes the operator's form — structured pickers, per-value provenance, ink save (never teal).">
        <div className="h-[560px] w-[330px] overflow-hidden rounded-2xl border border-border">
          <BookingRecordPanel
            className="h-full"
            editing
            deposit="$15"
            services={['Haircut', 'Beard trim']}
            stylist="Marco Diaz"
            time="Tomorrow · 6:30 PM"
            fields={{ customer: 'Jordan Rivera' }}
            operator="Dana K."
            onSave={(b) => toast({ tone: 'success', title: 'Booked', description: `${b.services.join(' + ')} · ${b.stylist} · ${b.time}` })}
            onHandBack={() => toast({ tone: 'info', title: 'Handed back to the AI' })}
          />
        </div>
      </Item>
      <Item title="Shortcuts dialog" hint="The keyboard-shortcuts sheet — fully working.">
        <Row>
          <Button variant="secondary" size="sm" leftIcon={<Keyboard size={15} />} onClick={() => setShortcuts(true)}>Shortcuts dialog</Button>
        </Row>
        <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
      </Item>
      <Item title="Call summary"><div className="max-w-md"><CallSummary customer="Jordan Rivera" services={['Haircut', 'Beard trim']} stylist="Marco Diaz" when="Tomorrow · 6:30 PM" duration="45 min" price="$48" deposit={{ amount: 15, status: 'collected' }} status="confirmed" notes={['Corrected "facials" → "fades" (heard at 58%)', 'Deposit charged to •••• 4242']} /></div></Item>
    </Group>
  )
}

function TranscriptDemo() {
  const [corrected, setCorrected] = useState(false)
  const { toast } = useToast()
  return (
    <div className="flex h-[440px] overflow-hidden rounded-2xl border border-border shadow-e2">
      <TranscriptPanel review={corrected ? 'resolved' : 'held'} confidence="91%">
        <TranscriptLine speaker="ai" words={GREETING} time="0:00" />
        <TranscriptLine
          speaker="caller" name="Jordan" time="0:06"
          words={corrected ? CALLER_WORDS_OK : CALLER_WORDS}
          onCorrectWord={(_, c) => { setCorrected(true); toast(`Corrected → "${c}"`) }}
        />
        {corrected && <TranscriptLine speaker="ai" words={AI_WORDS} time="0:41" />}
        <AgentSteps summary="availability · 3 calls, 1.4s" steps={AVAIL_STEPS} />
        <ResolvedInlineRow count={2} summary={'“tomorrow” → Tue 15 Sep · “evening” → after 5 PM'} />
        <AiThinkingBubble className="mt-auto" label="checking services, staff and the calendar" />
      </TranscriptPanel>
    </div>
  )
}

function SlotPickDemo() {
  const { toast } = useToast()
  return (
    <div className="max-w-2xl">
      <InlineSlotPick
        indent={false}
        slots={SLOTS}
        onOffer={(id, mode) => toast(`Offer (${mode}) → ${id}`)}
      />
    </div>
  )
}

function ChatSection() {
  const { toast } = useToast()
  return (
    <Group id="chat" title="Chat">
      <Item title="Transcript panel" hint="The conversation: AI/caller bubbles, the quiet agent-steps strip, the auto-resolved row, and the live indicator. Click the flagged word to correct it.">
        <TranscriptDemo />
      </Item>

      <Item title="Checkpoint · correct word" hint="Low-confidence word decision. Click ▶ on the clip to hear the 2s slice.">
        <div className="max-w-2xl"><WordCheckpoint onSelect={(k) => toast(`Chose: ${k}`)} /></div>
      </Item>

      <Item title="Checkpoint · pick a slot"><SlotPickDemo /></Item>

      <Item title="Checkpoint · confirm booking">
        <div className="max-w-2xl"><ConfirmCheckpoint onSelect={(k) => toast(`Chose: ${k}`)} /></div>
      </Item>

      <Item title="Checkpoint · payment declined">
        <div className="max-w-2xl"><PaymentCheckpoint onSelect={(k) => toast(`Chose: ${k}`)} /></div>
      </Item>

      <Item title="Checkpoint · hand-off">
        <div className="max-w-2xl"><HandoffCheckpoint onSelect={(k) => toast(`Chose: ${k}`)} /></div>
      </Item>

      <Item title="Notice · operator took over" hint="Shown inline for the whole time the operator holds the line — not a checkpoint, just the ink rail and the one action that reverses it.">
        <div className="max-w-2xl"><OperatorNotice speaking="0:18" onHandBack={() => toast('Handed back to AI')} /></div>
      </Item>
      <Item title="Take-over bar (compact)" hint="The minimal variant.">
        <div className="max-w-2xl"><TakeOverBar onHandBack={() => toast('Handed back to AI')} /></div>
      </Item>

      <Item title="Notice · dropped by the operator" hint="Ink — the operator closed the line before the booking finished.">
        <div className="max-w-2xl">
          <ThreadNotice
            tone="ink" dividerLabel="Line closed · 0:47"
            title="You ended the call mid-booking" who="Dana K. · desk 2" meta="slot released"
            description="Nothing was saved and no deposit was taken. Marco's 6:30 chair went back online when the line closed."
            action={{ label: 'Call back', onClick: () => toast('Calling back') }}
          />
        </div>
      </Item>

      <Item title="Notice · dropped by the caller" hint="Ink — the caller hung up mid-booking; the chair is still held.">
        <div className="max-w-2xl">
          <ThreadNotice
            tone="ink" dividerLabel="Caller hung up · 0:47"
            title="Jordan dropped mid-booking" who="during the 6:30 readback" meta="slot held 3:12"
            description="Service and stylist are captured; time and deposit were never confirmed. The chair stays reserved for three more minutes."
            action={{ label: 'Call back', onClick: () => toast('Calling back') }}
          />
        </div>
      </Item>

      <Item title="Notice · call ended, booking complete" hint="Teal — the call finished with a booking on the books.">
        <div className="max-w-2xl">
          <ThreadNotice
            tone="teal" dividerLabel="Call ended · 2:14"
            title="Booked · Marco, tomorrow 6:30 PM" meta="caller hung up first"
            description="Haircut + beard trim · 45 min · $48 with the $15 deposit taken. Confirmation text sent to ··· 4821."
            action={{ label: 'Open booking', onClick: () => toast('Opening booking') }}
          />
        </div>
      </Item>

      <Item title="Inline · call ended" hint="A completed call is a receipt — quiet, neutral, no action required. Renders as the last item in the thread.">
        <div className="max-w-2xl"><CallEndedReceipt onOpenBooking={() => toast('Opening booking')} /></div>
      </Item>

      <Item title="Inline · call dropped" hint="Unfinished work — keeps the amber checkpoint frame and a live slot countdown.">
        <div className="max-w-2xl"><CallDroppedCheckpoint onSelect={(k) => toast(`Chose: ${k}`)} /></div>
      </Item>

      <Item title="Word states">
        <p className="flex items-center gap-1.5 text-caption text-text-muted">Misheard, then corrected: <StruckWord>facials</StruckWord> → <HighlightWord>fades</HighlightWord></p>
      </Item>
    </Group>
  )
}

function MobileSection() {
  return (
    <Group id="mobile" title="Mobile">
      <Item title="Mobile console" hint="Same state, one column. The booking record lives in the thread; the tab strip is the nav. Tap the tabs and Take over.">
        <div className="flex flex-wrap gap-8">
          <MobileConsole caller={CALLER} inference={INFERENCE} confirm="withheld" />
          <MobileConsole caller={CALLER} inference={INFERENCE} confirm="confirmed" />
        </div>
      </Item>
    </Group>
  )
}

export function Showcase() {
  useConsoleSkin()
  return (
    <div className="min-h-dvh bg-bg-app text-text">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/85 px-6 py-3 backdrop-blur">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg"><Scissors size={16} /></span>
        <div className="mr-4">
          <h1 className="text-body-strong font-semibold">Zoca UI — component library</h1>
          <p className="text-micro text-text-muted">Handoff design system · live, interactive components</p>
        </div>
        <nav className="ml-auto flex items-center gap-1 rounded-full border border-border bg-surface-2 p-0.5">
          <a href="#chat" className="rounded-full px-3 py-1 text-caption font-semibold text-text-secondary hover:text-text">Chat</a>
          <a href="#primitives" className="rounded-full px-3 py-1 text-caption font-semibold text-text-secondary hover:text-text">Primitives</a>
          <a href="#domain" className="rounded-full px-3 py-1 text-caption font-semibold text-text-secondary hover:text-text">Domain</a>
          <a href="#mobile" className="rounded-full px-3 py-1 text-caption font-semibold text-text-secondary hover:text-text">Mobile</a>
        </nav>
      </header>
      <div className="mx-auto max-w-4xl px-6 pb-16">
        <ChatSection />
        <PrimitivesSection />
        <DomainSection />
        <MobileSection />
      </div>
    </div>
  )
}
