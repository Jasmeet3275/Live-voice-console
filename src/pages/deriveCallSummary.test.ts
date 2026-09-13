import { describe, it, expect } from 'vitest'
import { deriveCallSummary } from './callSummary'
import { initialCall, type Call, type FeedItem, type Slot, type Step, type StepType } from '@/types/call'

const SLOTS: Slot[] = [
  { id: 's1', time: 'Tomorrow · 6:30 PM', stylist: 'Marco Diaz', duration: '45 min', price: '$48', services: ['Haircut', 'Beard trim'], reasons: [], recommended: true },
]

const step = (type: StepType, state: Step['state'] = 'success', detail?: string): Step => ({ id: type, type, state, detail })
const turn = (summary: string | undefined, steps: Step[] = []): FeedItem => ({ kind: 'turn', id: 't', speaker: 'caller', status: 'success', summary, steps })
const call = (over: Partial<Call> = {}): Call => ({ ...initialCall, ...over })

describe('deriveCallSummary', () => {
  it('returns null before there is any agent activity', () => {
    expect(deriveCallSummary(call({ feed: [] }), 'X')).toBeNull()
  })

  it('summarises a confirmed booking from the selected slot + deposit', () => {
    const c = call({
      slots: SLOTS,
      selectedSlotId: 's1',
      feed: [turn('Booked · 6:30 PM with Marco', [step('deposit'), step('payment', 'success', 'Deposit charged to •••• 4242')])],
    })
    const s = deriveCallSummary(c, 'Jordan')!
    expect(s.status).toBe('confirmed')
    expect(s.stylist).toBe('Marco Diaz')
    expect(s.when).toBe('Tomorrow · 6:30 PM')
    expect(s.deposit).toEqual({ amount: 15, status: 'collected' })
  })

  it('parses when/stylist from the booking summary when there is no slot (operator booking)', () => {
    const c = call({ feed: [turn('Booked · Thu 6:30 PM with Alex')] })
    const s = deriveCallSummary(c, 'X')!
    expect(s.status).toBe('confirmed')
    expect(s.when).toBe('Thu 6:30 PM')
    expect(s.stylist).toBe('Alex')
  })

  it('marks a held booking as pending with a hold note', () => {
    const c = call({ feed: [turn('Booking held · awaiting customer', [step('hold_booking')])] })
    const s = deriveCallSummary(c, 'X')!
    expect(s.status).toBe('pending')
    expect(s.notes).toContain('Booking held — caller to confirm via SMS')
  })

  it('marks a call with no booking as failed', () => {
    const s = deriveCallSummary(call({ feed: [turn('Greeted caller')] }), 'X')!
    expect(s.status).toBe('failed')
  })

  it('reports a waived deposit', () => {
    const c = call({ feed: [turn('Booked · 6:30 with Marco', [step('deposit'), step('payment', 'warning', 'Deposit waived by operator')])] })
    expect(deriveCallSummary(c, 'X')!.deposit).toEqual({ amount: 15, status: 'waived' })
  })

  it('collects decision notes from the trace', () => {
    const c = call({
      slots: SLOTS,
      selectedSlotId: 's1',
      feed: [
        turn('Booked · 6:30 with Marco', [
          step('clarify', 'success', 'Confirmed "fades"'),
          step('conflict_check', 'error', 'Marco is double-booked'),
          step('recommend', 'error', 'Just booked'),
          step('payment', 'success', 'Retried — charged successfully'),
        ]),
      ],
    })
    const notes = deriveCallSummary(c, 'X')!.notes!
    expect(notes).toContain('Confirmed "fades"')
    expect(notes).toContain('Reassigned after a staff conflict')
    expect(notes).toContain('Original slot was taken — re-picked')
    expect(notes).toContain('Deposit charged after a retry')
  })
})
