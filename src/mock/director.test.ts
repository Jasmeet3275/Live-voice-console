import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CallDirector } from './director'
import type { ClientCommand, ServerEvent } from '@/types/call'

// Manual rAF clock so we can advance the director deterministically.
let now = 0
let rafCbs: FrameRequestCallback[] = []

beforeEach(() => {
  now = 0
  rafCbs = []
  vi.stubGlobal('performance', { now: () => now })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => rafCbs.push(cb))
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

function pump(ms: number) {
  for (let i = 0; i < ms / 50; i++) {
    now += 50
    const cbs = rafCbs
    rafCbs = []
    cbs.forEach((cb) => cb(now))
  }
}

function make(scenarioId: string) {
  const events: ServerEvent[] = []
  const d = new CallDirector(scenarioId, (e) => events.push(e))
  return { d, events }
}

const kindsOf = (events: ServerEvent[]) =>
  events.filter((e) => e.type === 'input.requested').map((e) => (e.type === 'input.requested' ? e.request.kind : ''))

/** Drive a scenario to completion, auto-resolving each checkpoint. */
function runToEnd(scenarioId: string) {
  const { d, events } = make(scenarioId)
  d.play()
  let handled = 0
  for (let i = 0; i < 1500; i++) {
    pump(50)
    const reqs = events.filter((e) => e.type === 'input.requested')
    if (reqs.length > handled) {
      handled = reqs.length
      const r = reqs[reqs.length - 1]
      if (r.type !== 'input.requested') continue
      const cmd: ClientCommand =
        r.request.kind === 'correctWord' ? { type: 'correctWord', lineId: 'l2', wordIndex: 16, chosen: 'fades' }
        : r.request.kind === 'selectSlot' ? { type: 'selectSlot', slotId: 's1' }
        : r.request.kind === 'confirmBooking' ? { type: 'confirmBooking' }
        : r.request.kind === 'payment' ? { type: 'chargeDeposit' }
        : r.request.kind === 'callerDropped' ? { type: 'callBack' }
        : { type: 'takeOver' }
      d.onCommand(cmd)
    }
  }
  return { d, events }
}

describe('CallDirector — human-in-the-loop over the wire', () => {
  it('emits input.requested at the fade checkpoint and keeps the clock running', () => {
    const { d, events } = make('low-confidence')
    d.play()
    pump(3200)

    const req = events.find((e) => e.type === 'input.requested')
    expect(req?.type === 'input.requested' && req.request.kind).toBe('correctWord')
    expect(req?.type === 'input.requested' && req.await).toBe('correctWord')

    // The call is live — the clock does NOT stop while awaiting input.
    expect(d.getState().playing).toBe(true)
    const elapsed = d.getState().elapsed
    pump(2000)
    expect(d.getState().elapsed).toBeGreaterThan(elapsed)
    expect(d.getState().ended).toBe(false)
  })

  it('ClockState carries no control/HITL fields (pure media plane)', () => {
    const { d } = make('happy')
    const state = d.getState()
    expect('awaiting' in state).toBe(false)
    expect('request' in state).toBe(false)
  })

  it('resolving the checkpoint emits input.cleared and routes on the input', () => {
    const { d, events } = make('low-confidence')
    d.play()
    pump(3200)
    d.onCommand({ type: 'correctWord', lineId: 'l2', wordIndex: 16, chosen: 'facial' })

    expect(events.some((e) => e.type === 'input.cleared')).toBe(true)
    const ci = events.find((e) => e.type === 'step.started' && e.step.type === 'classify_intent')
    expect(ci?.type === 'step.started' && ci.step.detail).toMatch(/Facial/)
  })

  it('the fade checkpoint appears only in the low-confidence scenario', () => {
    expect(kindsOf(runToEnd('low-confidence').events)).toContain('correctWord')
    for (const id of ['happy', 'slot-lost', 'payment-declined', 'staff-conflict', 'no-availability']) {
      expect(kindsOf(runToEnd(id).events)).not.toContain('correctWord')
    }
  })

  it('endCall clears an open checkpoint and stops the clock', () => {
    const { d, events } = make('happy')
    d.play()
    pump(6000) // reach the selectSlot checkpoint
    expect(events.some((e) => e.type === 'input.requested')).toBe(true)

    d.onCommand({ type: 'endCall' })
    expect(events.some((e) => e.type === 'input.cleared')).toBe(true)
    expect(d.getState().ended).toBe(true)
    expect(d.getState().playing).toBe(false)
  })

  it('takeOver abandons the checkpoint but keeps the call live', () => {
    const { d, events } = make('happy')
    d.play()
    pump(6000) // reach the selectSlot checkpoint
    d.onCommand({ type: 'takeOver' })
    expect(events.some((e) => e.type === 'input.cleared')).toBe(true)
    expect(d.getState().playing).toBe(true) // clock keeps running
  })
})

/** Drive a scenario, resolving each checkpoint with the command `resolve(kind)` returns. */
function runWith(scenarioId: string, resolve: (kind: string) => ClientCommand) {
  const { d, events } = make(scenarioId)
  d.play()
  let handled = 0
  for (let i = 0; i < 1500; i++) {
    pump(50)
    const reqs = events.filter((e) => e.type === 'input.requested')
    if (reqs.length > handled) {
      handled = reqs.length
      const r = reqs[reqs.length - 1]
      if (r.type === 'input.requested') d.onCommand(resolve(r.request.kind))
    }
  }
  return { d, events }
}

describe('CallDirector — alternate checkpoint paths (extended mock)', () => {
  it('correctWord "ask the caller" (askCaller) resolves the fade checkpoint and classifies intent', () => {
    const { d, events } = make('low-confidence')
    d.play()
    pump(3200)
    expect(kindsOf(events)).toContain('correctWord')
    d.onCommand({ type: 'askCaller' })
    expect(events.some((e) => e.type === 'input.cleared')).toBe(true)
    expect(events.some((e) => e.type === 'step.started' && e.step.type === 'classify_intent')).toBe(true)
  })

  it('confirmBooking resolves via waiveDeposit (book, skip deposit)', () => {
    const { events } = runWith('happy', (kind) =>
      kind === 'selectSlot' ? { type: 'selectSlot', slotId: 's1' }
      : kind === 'confirmBooking' ? { type: 'waiveDeposit' }
      : { type: 'takeOver' },
    )
    expect(events.some((e) => e.type === 'step.updated' && /waived/i.test(e.detail ?? ''))).toBe(true)
    expect(events.some((e) => e.type === 'booking.confirmed')).toBe(true)
    expect(events.some((e) => e.type === 'call.state' && e.ended === true)).toBe(true)
  })

  it('confirmBooking resolves via readBack (read it back first)', () => {
    const { events } = runWith('happy', (kind) =>
      kind === 'selectSlot' ? { type: 'selectSlot', slotId: 's1' }
      : kind === 'confirmBooking' ? { type: 'readBack' }
      : { type: 'takeOver' },
    )
    const aiLines = events.filter((e) => e.type === 'transcript.line' && e.line.speaker === 'ai').map((e) => (e.type === 'transcript.line' ? e.line.words.map((w) => w.text).join(' ') : ''))
    expect(aiLines.some((l) => /lock it in/i.test(l))).toBe(true)
    expect(events.some((e) => e.type === 'booking.confirmed')).toBe(true)
  })

  it('payment resolves via askForCard (ask for another card), then continues to confirm', () => {
    const { events } = runWith('payment-declined', (kind) =>
      kind === 'selectSlot' ? { type: 'selectSlot', slotId: 's1' }
      : kind === 'payment' ? { type: 'askForCard' }
      : kind === 'confirmBooking' ? { type: 'confirmBooking' }
      : { type: 'takeOver' },
    )
    expect(events.some((e) => e.type === 'step.updated' && /another card/i.test(e.detail ?? ''))).toBe(true)
    expect(events.some((e) => e.type === 'booking.confirmed')).toBe(true)
  })

  it('handoff resolves via scheduleCallback and ends the call gracefully', () => {
    const { d, events } = make('service-down')
    d.play()
    pump(6000)
    expect(kindsOf(events)).toContain('handoff')
    d.onCommand({ type: 'scheduleCallback' })
    pump(6000) // the branch is paced — it plays out over time
    expect(events.some((e) => e.type === 'input.cleared')).toBe(true)
    expect(events.some((e) => e.type === 'call.state' && e.ended === true)).toBe(true)
  })

  it('handoff resolves via sendBookingLink and ends the call gracefully', () => {
    const { d, events } = make('service-down')
    d.play()
    pump(6000)
    d.onCommand({ type: 'sendBookingLink' })
    pump(6000) // the branch is paced — it plays out over time
    expect(events.some((e) => e.type === 'step.started' && e.step.type === 'notify')).toBe(true)
    expect(events.some((e) => e.type === 'call.state' && e.ended === true)).toBe(true)
  })

  it('caller drop opens a checkpoint whose branch drives the rest of the call', () => {
    const pickSlot = { type: 'selectSlot', slotId: 's1' } as const

    // Reaches the drop and asks the operator how to recover (not auto-recovered):
    // resolve the slot pick, but leave the caller-dropped checkpoint open.
    const probe = runWith('caller-dropped', (k) => (k === 'selectSlot' ? pickSlot : { type: 'mute', on: true }))
    expect(kindsOf(probe.events)).toContain('callerDropped')
    expect(probe.events.some((e) => e.type === 'step.started' && e.step.type === 'hold_booking')).toBe(false)

    // Call back → books the appointment and ends confirmed.
    const back = runWith('caller-dropped', (k) => (k === 'selectSlot' ? pickSlot : { type: 'callBack' }))
    expect(back.events.some((e) => e.type === 'booking.confirmed')).toBe(true)
    expect(back.events.some((e) => e.type === 'call.state' && e.ended === true)).toBe(true)

    // Hold + text → holds the booking, no confirmed booking.
    const held = runWith('caller-dropped', (k) => (k === 'selectSlot' ? pickSlot : { type: 'holdAndText' }))
    expect(held.events.some((e) => e.type === 'step.started' && e.step.type === 'hold_booking')).toBe(true)
    expect(held.events.some((e) => e.type === 'booking.confirmed')).toBe(false)

    // Release → nothing saved.
    const rel = runWith('caller-dropped', (k) => (k === 'selectSlot' ? pickSlot : { type: 'releaseSlot' }))
    expect(rel.events.some((e) => e.type === 'turn.status' && /released/i.test(e.summary ?? ''))).toBe(true)
    expect(rel.events.some((e) => e.type === 'booking.confirmed')).toBe(false)
  })

  it('a paced branch (call back) plays out over time, not all in one tick', () => {
    const { d, events } = make('caller-dropped')
    d.play()
    // Drive to the caller-dropped checkpoint, resolving the slot pick on the way.
    let slotDone = false
    for (let i = 0; i < 600; i++) {
      pump(50)
      const reqs = events.filter((e) => e.type === 'input.requested')
      const last = reqs[reqs.length - 1]
      if (last?.type !== 'input.requested') continue
      if (last.request.kind === 'selectSlot' && !slotDone) { d.onCommand({ type: 'selectSlot', slotId: 's1' }); slotDone = true }
      else if (last.request.kind === 'callerDropped') break
    }
    const aiLine = () => events.some((e) => e.type === 'transcript.line' && e.line.words.map((w) => w.text).join(' ').match(/lost you/i))

    // Resolve with call back: the checkpoint closes immediately, but the AI's
    // spoken line has NOT been emitted yet — it is scheduled for later.
    d.onCommand({ type: 'callBack' })
    expect(events.some((e) => e.type === 'input.cleared')).toBe(true)
    expect(aiLine()).toBe(false)

    // A beat later the AI speaks, but the booking hasn't been processed yet.
    pump(1500)
    expect(aiLine()).toBe(true)
    expect(events.some((e) => e.type === 'booking.confirmed')).toBe(false)

    // Only after the rest of the beats play out does the booking complete.
    pump(8000)
    expect(events.some((e) => e.type === 'booking.confirmed')).toBe(true)
  })
})

describe('CallDirector — scenario outcomes', () => {
  it('booking scenarios close the call after the final message', () => {
    for (const id of ['happy', 'low-confidence', 'payment-declined', 'staff-conflict', 'availability-glitch']) {
      const { events } = runToEnd(id)
      const closed = events.some((e) => e.type === 'call.state' && e.ended === true)
      expect(closed, `${id} should emit call.state ended:true`).toBe(true)
    }
  })

  it('service-down hands off (no fade, no auto-close)', () => {
    const { events } = runToEnd('service-down')
    expect(kindsOf(events)).toContain('handoff')
    expect(events.some((e) => e.type === 'call.state' && e.ended === true)).toBe(false)
  })

  it('no-availability re-checks the next day instead of recommending nothing', () => {
    const { events } = runToEnd('no-availability')
    const recs = events.filter((e) => e.type === 'recommendation.updated')
    // exactly one real (non-empty) recommendation — never an empty one
    expect(recs.length).toBeGreaterThan(0)
    expect(recs.every((e) => e.type === 'recommendation.updated' && e.slots.length > 0)).toBe(true)
  })
})
