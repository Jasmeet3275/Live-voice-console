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
