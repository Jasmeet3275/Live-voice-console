import type {
  ClientCommand,
  InputRequest,
  ServerEvent,
  Slot,
  StepOutcome,
  StepType,
  TranscriptWord,
} from '@/types/call'

/** A checkpoint: when reached, the clock pauses until `await` arrives, then the
 *  `onResolve` events fire and the demo resumes. */
export interface Gate {
  await: ClientCommand['type']
  hint: string
  request: InputRequest
  onResolve?: ServerEvent[]
  /** Resolver that depends on the operator's input (the corrected word / chosen
   *  slot) — lets the correction propagate into later steps. */
  onResolveWithInput?: (input: string) => ServerEvent[]
  /** A second command that also resolves this gate, with a distinct outcome
   *  (e.g. "waive deposit" vs "retry charge" — same checkpoint, different result). */
  awaitAlt?: ClientCommand['type']
  onResolveAlt?: ServerEvent[]
}

export interface TimelineItem {
  delay: number
  event: ServerEvent
  gate?: Gate
}

// ---- authoring helpers ----

const w = (text: string, confidence = 0.98, alternatives?: string[]): TranscriptWord => ({
  text,
  confidence,
  alternatives,
})
const hi = (s: string, c = 0.97) => s.split(' ').map((t) => w(t, c))

export class Timeline {
  items: TimelineItem[] = []

  at(delay: number, event: ServerEvent): this {
    this.items.push({ delay, event })
    return this
  }

  gateAt(delay: number, event: ServerEvent, gate: Gate): this {
    this.items.push({ delay, event, gate })
    return this
  }

  /** A running step that resolves after `dur` ms. */
  step(
    start: number,
    turnId: string,
    type: StepType,
    endState: Exclude<StepOutcome, 'running'>,
    opts: { id?: string; statusLabel?: string; detail?: string; output?: unknown; dur?: number } = {},
  ): this {
    const id = opts.id ?? `${turnId}:${type}`
    this.at(start, { type: 'step.started', turnId, step: { id, type, state: 'running' } })
    this.at(start + (opts.dur ?? 450), {
      type: 'step.updated',
      turnId,
      stepId: id,
      state: endState,
      statusLabel: opts.statusLabel,
      detail: opts.detail,
      output: opts.output,
    })
    return this
  }

  /** A caller/AI spoken line. */
  say(delay: number, id: string, speaker: 'caller' | 'ai', words: TranscriptWord[], time?: string): this {
    return this.at(delay, { type: 'transcript.line', line: { id, speaker, words, time, final: true } })
  }
}

// ---- shared data ----

const BASE_SLOTS: Slot[] = [
  {
    id: 's1', time: 'Tomorrow · 6:30 PM', stylist: 'Marco Diaz', stylistRating: 4.9,
    duration: '45 min', price: '$48', services: ['Haircut', 'Beard trim'], recommended: true,
    reasons: [
      'Top fade specialist — 4.9★ across 120 fade bookings',
      '45-min slot fits haircut + beard together',
      'Served this client before (Aug 22)',
    ],
  },
  {
    id: 's2', time: 'Tomorrow · 7:15 PM', stylist: 'Alex Kim', stylistRating: 4.6,
    duration: '45 min', price: '$45', services: ['Haircut', 'Beard trim'],
    reasons: ['Also does fades', 'Slightly later, relaxed pace'],
  },
  {
    id: 's3', time: 'Tomorrow · 6:00 PM', stylist: 'Marco Diaz',
    duration: '45 min', price: '$48', services: ['Haircut', 'Beard trim'],
    reasons: ['Earliest evening option'],
  },
]

const SLOTS_AFTER_LOST: Slot[] = [
  { ...BASE_SLOTS[0], recommended: false, unavailable: true },
  { ...BASE_SLOTS[1], recommended: true, reasons: ['Next-best — also does fades', 'Closest to the requested time'] },
  BASE_SLOTS[2],
]

// Marco has a conflict at 6:30 → reassign options (Alex free same time).
const CONFLICT_SLOTS: Slot[] = [
  {
    id: 'c1', time: 'Tomorrow · 6:30 PM', stylist: 'Alex Kim', stylistRating: 4.6,
    duration: '45 min', price: '$45', services: ['Haircut', 'Beard trim'], recommended: true,
    reasons: ['Free at the same time', 'Also a fade specialist'],
  },
  {
    id: 'c2', time: 'Tomorrow · 7:15 PM', stylist: 'Marco Diaz', stylistRating: 4.9,
    duration: '45 min', price: '$48', services: ['Haircut', 'Beard trim'],
    reasons: ['Marco is free later, after his conflict'],
  },
  { ...BASE_SLOTS[0], recommended: false, unavailable: true },
]

// Nothing tomorrow evening → next-day options.
const ALT_DAY_SLOTS: Slot[] = [
  {
    id: 'd1', time: 'Thu · 6:30 PM', stylist: 'Marco Diaz', stylistRating: 4.9,
    duration: '45 min', price: '$48', services: ['Haircut', 'Beard trim'], recommended: true,
    reasons: ['Earliest with your usual stylist', 'Fade specialist'],
  },
  {
    id: 'd2', time: 'Thu · 7:15 PM', stylist: 'Alex Kim', stylistRating: 4.6,
    duration: '45 min', price: '$45', services: ['Haircut', 'Beard trim'],
    reasons: ['Also does fades'],
  },
]

// Low-confidence variant: "fades" is only 61% sure (→ the clarify checkpoint).
const REQUEST_WORDS: TranscriptWord[] = [
  w('Hi,'), w('I'), w('need'), w('a'), w('haircut', 0.96), w('and'), w('a'),
  w('beard', 0.95), w('trim', 0.94), w('tomorrow', 0.93), w('evening.', 0.78),
  w('I'), w('prefer', 0.96), w('someone'), w('good'), w('with'),
  w('fades', 0.61, ['facial', 'phase', 'fades']),
]

// Clean variant: heard clearly (used by every scenario that isn't about confidence).
const REQUEST_WORDS_CLEAR: TranscriptWord[] = [
  w('Hi,'), w('I'), w('need'), w('a'), w('haircut'), w('and'), w('a'),
  w('beard'), w('trim'), w('tomorrow'), w('evening.'), w('I'), w('prefer'),
  w('someone'), w('good'), w('with'), w('fades'),
]

/** Greeting → caller request → agent reasoning → availability. Returns next ms.
 *  `clarify` adds the low-confidence fade checkpoint (only the confidence scenario
 *  wants it); every other scenario transcribes cleanly and moves on. */
function addIntro(tl: Timeline, opts: { availability?: 'ok' | 'none' | 'glitch' | 'down'; clarify?: boolean } = {}): number {
  const clarify = opts.clarify ?? false

  tl.at(50, { type: 'call.state', connected: true, recording: true })

  // AI greeting (agent composes, then speaks)
  tl.at(200, { type: 'turn.started', turnId: 't1', speaker: 'ai', trigger: 'Call connected', time: '0:00' })
  tl.step(300, 't1', 'compose_reply', 'success', { detail: 'Greeting the caller' })
  tl.at(800, { type: 'turn.status', turnId: 't1', status: 'success', summary: 'Greeted caller' })
  tl.say(900, 'l1', 'ai', hi('Thanks for calling Luxe Salon — how can I help you today?'), '0:00')

  // Caller speaks first, then the agent reasons
  tl.say(1400, 'l2', 'caller', clarify ? REQUEST_WORDS : REQUEST_WORDS_CLEAR, '0:06')
  tl.at(1500, { type: 'turn.started', turnId: 't2', speaker: 'caller', trigger: 'Booking request', time: '0:06' })
  tl.step(1700, 't2', 'transcribe', 'success', { statusLabel: clarify ? '97%' : '99%' })

  let tCap: number
  if (clarify) {
    tl.step(2200, 't2', 'assess_confidence', 'warning', {
      statusLabel: 'Review', detail: '“fades” heard at 61% — could be “facial”',
      output: { word: 'fades', confidence: 0.61 },
    })
    // Human-in-the-loop: pause until the operator resolves the flagged word.
    tl.gateAt(
      2700,
      { type: 'step.started', turnId: 't2', step: { id: 't2:clarify', type: 'clarify', state: 'waiting' } },
      {
        await: 'correctWord',
        hint: 'Low confidence — confirm what the caller said.',
        request: { kind: 'correctWord', title: 'What did the caller say?', lineId: 'l2', wordIndex: 16, alternatives: ['fades', 'facial'] },
        // The corrected word flows into the intent, so the transcript and the
        // agent's understanding stay consistent.
        onResolveWithInput: (chosen) => [
          { type: 'step.updated', turnId: 't2', stepId: 't2:clarify', state: 'success', detail: `Confirmed "${chosen}"` },
          {
            type: 'step.started',
            turnId: 't2',
            step: {
              id: 't2:classify_intent',
              type: 'classify_intent',
              state: 'success',
              detail:
                chosen === 'facial'
                  ? 'Haircut + Beard trim + Facial · tomorrow evening'
                  : 'Haircut + Beard trim · tomorrow evening · good with fades',
            },
          },
        ],
      },
    )
    tCap = 3400
  } else {
    // High confidence → classify directly, no checkpoint.
    tl.step(2200, 't2', 'classify_intent', 'success', { detail: 'Haircut + Beard trim · tomorrow evening · good with fades' })
    tCap = 2700
  }

  tl.step(tCap, 't2', 'capability', 'success', { detail: 'Marco and Alex can do fades' })
  const tAvail = tCap + 500
  const av = opts.availability ?? 'ok'
  if (av === 'glitch') {
    // Transient server error → auto-retry (resilience). The retry only starts
    // AFTER the first attempt is shown to have failed.
    tl.step(tAvail, 't2', 'availability', 'error', { statusLabel: 'Timed out', detail: 'Scheduling service didn’t respond' })
    tl.step(tAvail + 850, 't2', 'availability', 'success', { id: 't2:availability2', statusLabel: 'Refreshed', detail: 'Retried — 3 open slots tomorrow evening' })
    return tAvail + 1400
  }
  if (av === 'none') {
    tl.step(tAvail, 't2', 'availability', 'warning', { statusLabel: 'None', detail: 'No fade specialist free tomorrow evening' })
    return tAvail + 500
  }
  if (av === 'down') {
    // Hard failure: retry also fails — the agent cannot proceed on its own.
    tl.step(tAvail, 't2', 'availability', 'error', { statusLabel: 'Timed out', detail: 'Scheduling service didn’t respond' })
    tl.step(tAvail + 850, 't2', 'availability', 'error', { id: 't2:availability2', statusLabel: 'Failed', detail: 'Retry failed — scheduling service unavailable (503)' })
    return tAvail + 1400
  }
  tl.step(tAvail, 't2', 'availability', 'success', { detail: '3 open slots tomorrow 6:00–7:30 PM' })
  return tAvail + 500
}

/** Recommend step (running) + published slots, within the request turn (t2). */
function recommendStep(tl: Timeline, start: number, stepId: string, slots: Slot[]) {
  tl.at(start, { type: 'step.started', turnId: 't2', step: { id: stepId, type: 'recommend', state: 'running' } })
  tl.at(start + 400, { type: 'recommendation.updated', slots })
}

/** Pause the recommend step for the operator to pick a slot. */
function selectGate(
  tl: Timeline,
  delay: number,
  stepId: string,
  slots: Slot[],
  opts: { title: string; hint: string; onResolve: ServerEvent[] },
) {
  tl.gateAt(
    delay,
    { type: 'step.updated', turnId: 't2', stepId, state: 'waiting', statusLabel: 'Pick a slot', output: slots },
    { await: 'selectSlot', hint: opts.hint, request: { kind: 'selectSlot', title: opts.title }, onResolve: opts.onResolve },
  )
}

/** "Tomorrow · 6:30 PM" → "6:30 PM tomorrow"; "Thu · 6:30 PM" → "6:30 PM on Thursday". */
function speakTime(t: string): string {
  const [day, time] = t.split(' · ')
  if (day === 'Tomorrow') return `${time} tomorrow`
  if (day === 'Thu') return `${time} on Thursday`
  return t
}

/** Final slot selection: ends the request turn and has the AI confirm the
 *  actual chosen slot by name + time (only after selection is final). */
function selectAndClose(
  tl: Timeline,
  delay: number,
  stepId: string,
  slots: Slot[],
  opts: { title: string; hint: string },
) {
  tl.gateAt(
    delay,
    { type: 'step.updated', turnId: 't2', stepId, state: 'waiting', statusLabel: 'Pick a slot', output: slots },
    {
      await: 'selectSlot',
      hint: opts.hint,
      request: { kind: 'selectSlot', title: opts.title },
      // The operator has *approved which slot(s) to offer* — an internal decision.
      // The agent now PRESENTS it to the caller and asks if it works; the caller's
      // agreement (the next turn) is what actually books it.
      onResolveWithInput: (slotId) => {
        const slot = slots.find((s) => s.id === slotId) ?? slots.find((s) => s.recommended) ?? slots[0]
        const name = slot.stylist.split(' ')[0]
        const alt = slots.find((s) => !s.unavailable && s.id !== slot.id)
        const offer = alt
          ? `I've got ${speakTime(slot.time)} with ${name}, or ${speakTime(alt.time)} with ${alt.stylist.split(' ')[0]} if you'd prefer — would either of those work for you?`
          : `I've got ${speakTime(slot.time)} with ${name} — would that work for you?`
        return [
          { type: 'step.updated', turnId: 't2', stepId, state: 'success', detail: `Offering ${slot.time} with ${name}` },
          { type: 'turn.status', turnId: 't2', status: 'success', summary: `Offering · ${slot.time} with ${name}` },
          {
            type: 'transcript.line',
            line: { id: 'l3', speaker: 'ai', final: true, time: '0:15', words: hi(offer) },
          },
        ]
      },
    },
  )
}

const SELECT = { title: 'Choose a time to book', hint: 'Choose a time to book for the caller.' }
const slotSelected: ServerEvent = { type: 'step.updated', turnId: 't2', stepId: 't2:recommend', state: 'success', detail: 'Slot selected' }

interface Booking {
  services: string[]
  stylist: string
  time: string
  price: string
  deposit?: string
}

/** A caller "confirm the slot" turn: utterance → steps (gated at confirm) → AI reply. */
function addBookingTurn(
  tl: Timeline,
  start: number,
  opts: { turnId: string; line: string; booking: Booking },
) {
  const { turnId, line, booking } = opts
  const bookedWith = `${booking.time} with ${booking.stylist}`
  tl.say(start, `l-${turnId}`, 'caller', hi(line, 0.96), '0:41')
  tl.at(start + 60, { type: 'turn.started', turnId, speaker: 'caller', trigger: 'Caller accepts the offer', time: '0:41' })
  tl.step(start + 250, turnId, 'transcribe', 'success', { statusLabel: '97%' })
  tl.step(start + 650, turnId, 'classify_intent', 'success', { detail: 'Caller accepted the offered slot' })
  tl.step(start + 1050, turnId, 'hold', 'success', { detail: 'Slot held for 5:00' })
  tl.step(start + 1450, turnId, 'conflict_check', 'success', { detail: 'No staff conflicts' })
  let t = start + 1850
  if (booking.deposit) {
    tl.step(t, turnId, 'deposit', 'success', { detail: `${booking.deposit} deposit required` }); t += 400
    tl.step(t, turnId, 'payment', 'success', { statusLabel: 'Charged', detail: 'Deposit charged to •••• 4242' }); t += 400
  }
  tl.gateAt(
    t,
    { type: 'step.started', turnId, step: { id: `${turnId}:confirm`, type: 'confirm', state: 'waiting' } },
    {
      await: 'confirmBooking',
      hint: 'Review and confirm the booking to finalise.',
      request: { kind: 'confirmBooking', title: 'Confirm this booking', deposit: booking.deposit },
      onResolve: [{ type: 'step.updated', turnId, stepId: `${turnId}:confirm`, state: 'success', detail: 'Appointment booked' }],
    },
  )
  t += 400
  tl.step(t, turnId, 'notify', 'success', { detail: 'Confirmation SMS sent' })
  tl.at(t + 150, { type: 'booking.confirmed' })
  tl.at(t + 300, { type: 'turn.status', turnId, status: 'success', summary: `Booked · ${bookedWith}` })
  const closer = booking.deposit
    ? `You're all set — I've taken the ${booking.deposit} deposit and booked you with ${booking.stylist} at ${booking.time}. A confirmation text is on its way!`
    : `You're all set — booked with ${booking.stylist} at ${booking.time}. A confirmation text is on its way!`
  tl.say(t + 450, `l-${turnId}-ai`, 'ai', hi(closer), '0:46')
  // Agent wraps up and closes the call after its goodbye.
  tl.at(t + 1600, { type: 'call.state', connected: false, ended: true })
}

// ---- scenarios (each covers a different path) ----

export interface Scenario {
  id: string
  label: string
  description: string
  build: (tl: Timeline) => void
}

export const scenarios: Scenario[] = [
  {
    id: 'happy',
    label: 'Happy path',
    description: 'Clean request → recommend → pick a slot → confirm → booked',
    build: (tl) => {
      const t = addIntro(tl)
      recommendStep(tl, t, 't2:recommend', BASE_SLOTS)
      selectAndClose(tl, t + 500, 't2:recommend', BASE_SLOTS, SELECT)
      addBookingTurn(tl, t + 1300, {
        turnId: 't4',
        line: 'The 6:30 with Marco works great',
        booking: { services: ['Haircut', 'Beard trim'], stylist: 'Marco', time: '6:30 PM', price: '$48', deposit: '$15' },
      })
    },
  },
  {
    id: 'low-confidence',
    label: 'Low transcript confidence',
    description: '“fades” heard at 61% (vs “facial”) → operator confirms the word → intent updates → booked',
    build: (tl) => {
      const t = addIntro(tl, { clarify: true })
      recommendStep(tl, t, 't2:recommend', BASE_SLOTS)
      selectAndClose(tl, t + 500, 't2:recommend', BASE_SLOTS, SELECT)
      addBookingTurn(tl, t + 1300, {
        turnId: 't4',
        line: 'The 6:30 with Marco works great',
        booking: { services: ['Haircut', 'Beard trim'], stylist: 'Marco', time: '6:30 PM', price: '$48', deposit: '$15' },
      })
    },
  },
  {
    id: 'slot-lost',
    label: 'Slot taken while deciding',
    description: 'Operator picks a slot → it was just booked → re-recommend vacant slots in the same turn → pick again → booked',
    build: (tl) => {
      const t = addIntro(tl)
      recommendStep(tl, t, 't2:recommend', BASE_SLOTS)
      // First pick — but the backend reports it was just booked, so the same turn
      // re-recommends the vacant slots and asks the operator to pick again.
      selectGate(tl, t + 500, 't2:recommend', BASE_SLOTS, {
        ...SELECT,
        onResolve: [
          { type: 'step.updated', turnId: 't2', stepId: 't2:recommend', state: 'error', statusLabel: 'Just booked', detail: '6:30 with Marco was booked by another line' },
          { type: 'slot.taken', slotId: 's1' },
          { type: 'step.started', turnId: 't2', step: { id: 't2:recommend2', type: 'recommend', state: 'running' } },
        ],
      })
      tl.at(t + 900, { type: 'recommendation.updated', slots: SLOTS_AFTER_LOST })
      selectAndClose(tl, t + 1000, 't2:recommend2', SLOTS_AFTER_LOST, {
        title: 'Choose another time',
        hint: 'That slot was booked — choose another time.',
      })
      addBookingTurn(tl, t + 1800, {
        turnId: 't4',
        line: 'Yes, 7:15 with Alex is fine',
        booking: { services: ['Haircut', 'Beard trim'], stylist: 'Alex', time: '7:15 PM', price: '$45', deposit: '$15' },
      })
    },
  },
  {
    id: 'payment-declined',
    label: 'Payment declined',
    description: 'Pick slot → deposit charge declined → retry → booked',
    build: (tl) => {
      const t = addIntro(tl)
      recommendStep(tl, t, 't2:recommend', BASE_SLOTS)
      selectAndClose(tl, t + 500, 't2:recommend', BASE_SLOTS, SELECT)
      const s = t + 1300
      tl.say(s, 'l-t4', 'caller', hi('Yes, 6:30 with Marco — here’s my card', 0.96), '0:41')
      tl.at(s + 60, { type: 'turn.started', turnId: 't4', speaker: 'caller', trigger: 'Confirm + pay', time: '0:41' })
      tl.step(s + 250, 't4', 'transcribe', 'success', { statusLabel: '96%' })
      tl.step(s + 650, 't4', 'hold', 'success', { detail: 'Slot held for 5:00' })
      tl.step(s + 1050, 't4', 'deposit', 'success', { detail: '$15 deposit required' })
      // Payment declines → pause and let the operator decide (retry / waive).
      tl.gateAt(
        s + 1450,
        { type: 'step.started', turnId: 't4', step: { id: 't4:payment', type: 'payment', state: 'error' } },
        {
          await: 'chargeDeposit',
          hint: 'The card was declined — choose how to proceed.',
          request: { kind: 'payment', title: 'Payment declined', card: '•••• 4242' },
          onResolve: [{ type: 'step.updated', turnId: 't4', stepId: 't4:payment', state: 'success', statusLabel: 'Charged', detail: 'Retried — charged successfully' }],
          awaitAlt: 'waiveDeposit',
          onResolveAlt: [{ type: 'step.updated', turnId: 't4', stepId: 't4:payment', state: 'warning', statusLabel: 'Waived', detail: 'Deposit waived by operator' }],
        },
      )
      tl.at(s + 1500, { type: 'payment.result', ok: false })
      tl.gateAt(
        s + 1900,
        { type: 'step.started', turnId: 't4', step: { id: 't4:confirm', type: 'confirm', state: 'waiting' } },
        {
          await: 'confirmBooking',
          hint: 'Payment recovered — review and confirm the booking.',
          request: { kind: 'confirmBooking', title: 'Confirm this booking', deposit: '$15' },
          onResolve: [{ type: 'step.updated', turnId: 't4', stepId: 't4:confirm', state: 'success', detail: 'Appointment booked' }],
        },
      )
      tl.step(s + 2100, 't4', 'notify', 'success', { detail: 'Confirmation SMS sent' })
      tl.at(s + 2250, { type: 'booking.confirmed' })
      tl.at(s + 2400, { type: 'turn.status', turnId: 't4', status: 'success', summary: 'Booked after payment retry' })
      tl.say(s + 2550, 'l-t4-ai', 'ai', hi("You're all set — I've taken the $15 deposit and booked you with Marco at 6:30. Confirmation text on its way!"), '0:47')
      tl.at(s + 3700, { type: 'call.state', connected: false, ended: true })
    },
  },
  {
    id: 'caller-dropped',
    label: 'Caller dropped',
    description: 'Caller hangs up before confirming → hold booking → SMS + callback',
    build: (tl) => {
      const t = addIntro(tl)
      recommendStep(tl, t, 't2:recommend', BASE_SLOTS)
      selectAndClose(tl, t + 500, 't2:recommend', BASE_SLOTS, SELECT)
      const s = t + 1300
      tl.say(s, 'l-t4', 'caller', hi('Let me just check my calendar and—', 0.9), '0:20')
      tl.at(s + 500, { type: 'call.state', connected: false })
      tl.at(s + 700, { type: 'turn.started', turnId: 't5', speaker: 'system', trigger: 'Caller dropped before confirming', time: '0:22' })
      tl.step(s + 900, 't5', 'hold_booking', 'success', { detail: 'Held 6:30 with Marco for 10 min' })
      tl.step(s + 1400, 't5', 'notify', 'success', { detail: 'SMS sent with a one-tap confirmation link' })
      tl.step(s + 1900, 't5', 'schedule_callback', 'success', { detail: 'Callback queued for +1 (415) •••-4821' })
      tl.at(s + 2400, { type: 'turn.status', turnId: 't5', status: 'success', summary: 'Booking held · awaiting customer' })
    },
  },
  {
    id: 'staff-conflict',
    label: 'Staff conflict',
    description: 'Operator picks Marco → he’s double-booked → reassign to a free stylist → booked',
    build: (tl) => {
      const t = addIntro(tl)
      recommendStep(tl, t, 't2:recommend', BASE_SLOTS)
      selectGate(tl, t + 500, 't2:recommend', BASE_SLOTS, { ...SELECT, onResolve: [slotSelected] })
      // Verify the hold → staff conflict surfaces.
      tl.step(t + 700, 't2', 'hold', 'success', { detail: 'Holding 6:30 with Marco' })
      tl.step(t + 1100, 't2', 'conflict_check', 'error', { statusLabel: 'Conflict', detail: 'Marco is double-booked at 6:30' })
      tl.at(t + 1200, { type: 'slot.taken', slotId: 's1' })
      tl.at(t + 1500, { type: 'step.started', turnId: 't2', step: { id: 't2:recommend2', type: 'recommend', state: 'running' } })
      tl.at(t + 1900, { type: 'recommendation.updated', slots: CONFLICT_SLOTS })
      selectAndClose(tl, t + 2000, 't2:recommend2', CONFLICT_SLOTS, {
        title: 'Reassign — pick a stylist/time',
        hint: 'Marco has a conflict at 6:30 — pick an alternative.',
      })
      addBookingTurn(tl, t + 2800, {
        turnId: 't4',
        line: 'Yes, Alex at 6:30 is fine',
        booking: { services: ['Haircut', 'Beard trim'], stylist: 'Alex', time: '6:30 PM', price: '$45', deposit: '$15' },
      })
    },
  },
  {
    id: 'no-availability',
    label: 'No slots available',
    description: 'Nothing tomorrow evening → agent checks the next day → recommend Thursday → booked',
    build: (tl) => {
      const t = addIntro(tl, { availability: 'none' })
      // Nothing tomorrow → broaden the search to the next day, which has openings,
      // then recommend those (a single, real recommendation — not an empty one).
      tl.step(t, 't2', 'availability', 'success', { id: 't2:availability2', statusLabel: 'Next day', detail: 'Found evening openings on Thursday' })
      recommendStep(tl, t + 500, 't2:recommend', ALT_DAY_SLOTS)
      selectAndClose(tl, t + 1000, 't2:recommend', ALT_DAY_SLOTS, {
        title: 'Choose an alternative',
        hint: 'No evening slots tomorrow — pick an alternative day/time.',
      })
      addBookingTurn(tl, t + 1800, {
        turnId: 't4',
        line: 'Thursday 6:30 works',
        booking: { services: ['Haircut', 'Beard trim'], stylist: 'Marco', time: 'Thu 6:30 PM', price: '$48', deposit: '$15' },
      })
    },
  },
  {
    id: 'availability-glitch',
    label: 'Availability service error',
    description: 'Scheduling service times out → auto-retry → recommend → booked',
    build: (tl) => {
      const t = addIntro(tl, { availability: 'glitch' })
      recommendStep(tl, t, 't2:recommend', BASE_SLOTS)
      selectAndClose(tl, t + 500, 't2:recommend', BASE_SLOTS, SELECT)
      addBookingTurn(tl, t + 1300, {
        turnId: 't4',
        line: 'The 6:30 with Marco works',
        booking: { services: ['Haircut', 'Beard trim'], stylist: 'Marco', time: '6:30 PM', price: '$48', deposit: '$15' },
      })
    },
  },
  {
    id: 'service-down',
    label: 'Service outage → take over',
    description: 'Scheduling service fails after a retry → the agent hands off with the error reason → operator takes over to book manually',
    build: (tl) => {
      const t = addIntro(tl, { availability: 'down' })
      // The agent can't recover on its own: surface the error on the turn, then
      // open a hand-off checkpoint that asks the operator to take over.
      tl.at(t, { type: 'turn.status', turnId: 't2', status: 'error', summary: 'Scheduling service down — needs operator' })
      tl.gateAt(
        t + 300,
        { type: 'step.started', turnId: 't2', step: { id: 't2:handoff', type: 'handoff', state: 'error', detail: 'Escalating to operator' } },
        {
          await: 'takeOver',
          hint: 'The agent needs you — the scheduling service is down.',
          request: {
            kind: 'handoff',
            title: 'Scheduling service unavailable',
            reason:
              "I can't reach the scheduling service, so I'm unable to pull live availability or hold a slot. Two automatic retries failed (503). Please take over and book this customer manually.",
            detail: 'Scheduling service · HTTP 503 · 2 retries failed',
          },
          // No auto-resolve: taking over clears the checkpoint (director) and opens
          // the manual booking wizard; the operator completes the booking.
        },
      )
    },
  },
]

export function getScenario(id: string): Scenario {
  return scenarios.find((s) => s.id === id) ?? scenarios[0]
}
