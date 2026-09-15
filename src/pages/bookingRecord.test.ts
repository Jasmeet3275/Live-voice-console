import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CallDirector } from '@/mock/director'
import { applyEvent } from '@/store/callStore'
import { initialCall, type Call, type ClientCommand, type ServerEvent } from '@/types/call'
import { deriveBookingRecord } from './bookingRecord'

// Manual rAF clock so the director advances deterministically (mirrors director.test).
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

const CUSTOMER = 'Jordan Rivera'
const fold = (events: ServerEvent[]): Call => events.reduce(applyEvent, initialCall)
const rec = (events: ServerEvent[]) => deriveBookingRecord(fold(events), CUSTOMER)

/** The command that auto-resolves a checkpoint of the given kind (happy path). */
function resolve(kind: string): ClientCommand {
  switch (kind) {
    case 'correctWord': return { type: 'correctWord', lineId: 'l2', wordIndex: 16, chosen: 'fades' }
    case 'selectSlot': return { type: 'selectSlot', slotId: 's1' }
    case 'confirmBooking': return { type: 'confirmBooking' }
    case 'payment': return { type: 'chargeDeposit' }
    case 'callerDropped': return { type: 'callBack' }
    default: return { type: 'takeOver' }
  }
}

/** Run until the Nth checkpoint is open, auto-resolving the earlier ones. Returns
 *  the events emitted so far (the Nth checkpoint still pending, unresolved). */
function runToCheckpoint(scenarioId: string, n: number): ServerEvent[] {
  const events: ServerEvent[] = []
  const d = new CallDirector(scenarioId, (e) => events.push(e))
  d.play()
  let handled = 0
  for (let i = 0; i < 3000; i++) {
    pump(50)
    const reqs = events.filter((e) => e.type === 'input.requested')
    if (reqs.length >= n) return events
    if (reqs.length > handled) {
      handled = reqs.length
      const r = reqs[reqs.length - 1]
      if (r.type === 'input.requested') d.onCommand(resolve(r.request.kind))
    }
  }
  return events
}

/** Drive a scenario to completion, auto-resolving every checkpoint. */
function runToEnd(scenarioId: string): ServerEvent[] {
  const events: ServerEvent[] = []
  const d = new CallDirector(scenarioId, (e) => events.push(e))
  d.play()
  let handled = 0
  for (let i = 0; i < 3000; i++) {
    pump(50)
    const reqs = events.filter((e) => e.type === 'input.requested')
    if (reqs.length > handled) {
      handled = reqs.length
      const r = reqs[reqs.length - 1]
      if (r.type === 'input.requested') d.onCommand(resolve(r.request.kind))
    }
  }
  return events
}

const BOOKING_SCENARIOS = [
  'happy', 'low-confidence', 'slot-lost', 'payment-declined',
  'staff-conflict', 'no-availability', 'availability-glitch', 'caller-dropped',
] as const

describe('deriveBookingRecord — the record never runs ahead of the conversation', () => {
  it('at the first checkpoint of every scenario, stylist/time/price are still withheld', () => {
    for (const id of [...BOOKING_SCENARIOS, 'service-down'] as const) {
      const r = rec(runToCheckpoint(id, 1))
      expect(r.fields.stylist, `${id}: stylist withheld at first checkpoint`).toBeUndefined()
      expect(r.fields.time, `${id}: time withheld at first checkpoint`).toBeUndefined()
      expect(r.fields.price, `${id}: price withheld at first checkpoint`).toBeUndefined()
      expect(r.confirm, `${id}: not confirmable at first checkpoint`).not.toBe('confirmed')
    }
  })

  it('service + length ARE known by the first slot checkpoint (intent classified)', () => {
    // Every clean scenario has classified intent before it recommends slots.
    for (const id of ['happy', 'slot-lost', 'payment-declined', 'staff-conflict', 'no-availability', 'availability-glitch', 'caller-dropped'] as const) {
      const r = rec(runToCheckpoint(id, 1))
      expect(r.fields.service, `${id}: service known`).toBe('Haircut + Beard trim')
      expect(r.fields.length, `${id}: length known`).toBe('45 min')
    }
  })

  it('low-confidence withholds even the service until the flagged word is confirmed', () => {
    // The first checkpoint IS the correctWord gate — intent is not classified yet.
    const r = rec(runToCheckpoint('low-confidence', 1))
    expect(r.fields.service).toBeUndefined()
    expect(r.fields.length).toBeUndefined()
  })

  it('staff-conflict does not reveal the reassignment before the operator picks it', () => {
    // An early `hold` (for Marco) is invalidated by the conflict; the record must
    // NOT show the recommended reassignment (Alex) at the second slot checkpoint.
    const r = rec(runToCheckpoint('staff-conflict', 2))
    expect(r.fields.stylist).toBeUndefined()
    expect(r.fields.time).toBeUndefined()
  })
})

describe('deriveBookingRecord — end states', () => {
  it('booking scenarios end confirmed with a fully filled record', () => {
    for (const id of BOOKING_SCENARIOS) {
      const r = rec(runToEnd(id))
      expect(r.confirm, `${id}: confirmed`).toBe('confirmed')
      expect(r.fields.stylist, `${id}: stylist filled`).toBeTruthy()
      expect(r.fields.time, `${id}: time filled`).toBeTruthy()
      expect(r.fields.price, `${id}: price + deposit filled`).toMatch(/\$\d+ · \$15 deposit/)
    }
  })

  it('service outage stays withheld (no slots) — the operator books manually', () => {
    // Take-over clears the handoff but books nothing on its own; the record holds
    // service/length (intent was classified) and withholds the rest.
    const r = rec(runToEnd('service-down'))
    expect(r.confirm).not.toBe('confirmed')
    expect(r.fields.service).toBe('Haircut + Beard trim')
    expect(r.fields.stylist).toBeUndefined()
    expect(r.fields.time).toBeUndefined()
  })
})
