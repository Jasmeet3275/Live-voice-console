import { describe, it, expect, vi } from 'vitest'
import { applyEvent, CallStore } from './callStore'
import { initialCall, type Call, type CallTransport, type ClientCommand, type ServerEvent, type Slot } from '@/types/call'

const base: Call = { ...initialCall }

const slots: Slot[] = [
  { id: 's1', time: 'Tomorrow · 6:30 PM', stylist: 'Marco Diaz', duration: '45 min', price: '$48', services: ['Haircut'], reasons: ['best'], recommended: true },
  { id: 's2', time: 'Tomorrow · 7:15 PM', stylist: 'Alex Kim', duration: '45 min', price: '$45', services: ['Haircut'], reasons: ['also'] },
]

describe('applyEvent — reducer', () => {
  it('call.state updates flags and adds an error notice on caller drop', () => {
    const connected = applyEvent(base, { type: 'call.state', connected: true, recording: true })
    expect(connected.connected).toBe(true)

    const dropped = applyEvent(connected, { type: 'call.state', connected: false })
    expect(dropped.connected).toBe(false)
    const notice = dropped.feed.at(-1)
    expect(notice).toMatchObject({ kind: 'notice', tone: 'error' })
    expect(notice && notice.kind === 'notice' && notice.text).toMatch(/disconnected/i)
  })

  it('call.state with ended:true reads as a graceful "Call ended" (neutral)', () => {
    const connected = applyEvent(base, { type: 'call.state', connected: true })
    const ended = applyEvent(connected, { type: 'call.state', connected: false, ended: true })
    expect(ended.ended).toBe(true)
    const notice = ended.feed.at(-1)
    expect(notice).toMatchObject({ kind: 'notice', tone: 'neutral' })
    expect(notice && notice.kind === 'notice' && notice.text).toBe('Call ended')
  })

  it('turn.started appends a running turn; turn.status updates it', () => {
    let s = applyEvent(base, { type: 'turn.started', turnId: 't2', speaker: 'caller', trigger: 'Booking request' })
    expect(s.feed).toHaveLength(1)
    expect(s.feed[0]).toMatchObject({ kind: 'turn', id: 't2', status: 'running' })

    s = applyEvent(s, { type: 'turn.status', turnId: 't2', status: 'success', summary: 'Booked · 6:30 with Marco' })
    const turn = s.feed[0]
    expect(turn.kind === 'turn' && turn.status).toBe('success')
    expect(turn.kind === 'turn' && turn.summary).toMatch(/Booked/)
  })

  it('transcript.line / delta / final build and seal an utterance', () => {
    let s = applyEvent(base, { type: 'transcript.line', line: { id: 'l2', speaker: 'caller', words: [{ text: 'Hi', confidence: 0.99 }], final: false } })
    s = applyEvent(s, { type: 'transcript.delta', lineId: 'l2', word: { text: 'there', confidence: 0.98 } })
    const line = s.feed[0]
    expect(line.kind === 'utterance' && line.words.map((w) => w.text)).toEqual(['Hi', 'there'])
    expect(line.kind === 'utterance' && line.final).toBe(false)

    s = applyEvent(s, { type: 'transcript.final', lineId: 'l2' })
    expect(s.feed[0].kind === 'utterance' && s.feed[0].final).toBe(true)
  })

  it('step.started appends to its turn; step.updated patches it', () => {
    let s = applyEvent(base, { type: 'turn.started', turnId: 't2', speaker: 'caller', trigger: 'x' })
    s = applyEvent(s, { type: 'step.started', turnId: 't2', step: { id: 't2:transcribe', type: 'transcribe', state: 'running' } })
    let turn = s.feed[0]
    expect(turn.kind === 'turn' && turn.steps).toHaveLength(1)

    s = applyEvent(s, { type: 'step.updated', turnId: 't2', stepId: 't2:transcribe', state: 'success', statusLabel: '97%' })
    turn = s.feed[0]
    const step = turn.kind === 'turn' ? turn.steps[0] : undefined
    expect(step).toMatchObject({ state: 'success', statusLabel: '97%' })
  })

  it('recommendation.updated stores slots and auto-selects the recommended one', () => {
    const s = applyEvent(base, { type: 'recommendation.updated', slots })
    expect(s.slots).toHaveLength(2)
    expect(s.selectedSlotId).toBe('s1') // recommended + available
  })

  it('recommendation.updated skips unavailable when auto-selecting', () => {
    const withTaken: Slot[] = [{ ...slots[0], recommended: true, unavailable: true }, { ...slots[1] }]
    const s = applyEvent(base, { type: 'recommendation.updated', slots: withTaken })
    expect(s.selectedSlotId).toBe('s2')
  })

  it('slot.taken marks a slot unavailable', () => {
    let s = applyEvent(base, { type: 'recommendation.updated', slots })
    s = applyEvent(s, { type: 'slot.taken', slotId: 's1' })
    expect(s.slots.find((x) => x.id === 's1')?.unavailable).toBe(true)
  })

  it('input.requested sets pending; input.cleared clears it', () => {
    let s = applyEvent(base, {
      type: 'input.requested',
      await: 'correctWord',
      request: { kind: 'correctWord', title: 'What did the caller say?', lineId: 'l2', wordIndex: 16, alternatives: ['fades', 'facial'] },
      hint: 'Low confidence',
      turnId: 't2',
      stepId: 't2:clarify',
    })
    expect(s.pending).toMatchObject({ await: 'correctWord', hint: 'Low confidence' })
    expect(s.pending?.request.kind).toBe('correctWord')

    s = applyEvent(s, { type: 'input.cleared' })
    expect(s.pending).toBeUndefined()
  })

  it('is immutable — does not mutate the input state', () => {
    const before = structuredClone(base)
    applyEvent(base, { type: 'turn.started', turnId: 't2', speaker: 'caller', trigger: 'x' })
    expect(base).toEqual(before)
  })
})

// A controllable transport so we can drive the store in tests.
class FakeTransport implements CallTransport {
  handler?: (e: ServerEvent) => void
  sent: ClientCommand[] = []
  connect = vi.fn()
  close = vi.fn()
  subscribe(h: (e: ServerEvent) => void) {
    this.handler = h
    return () => { this.handler = undefined }
  }
  send(cmd: ClientCommand) { this.sent.push(cmd) }
  emit(e: ServerEvent) { this.handler?.(e) }
}

describe('CallStore', () => {
  it('subscribes on connect and folds emitted events into state', () => {
    const t = new FakeTransport()
    const store = new CallStore(t)
    store.connect()
    expect(t.connect).toHaveBeenCalled()

    t.emit({ type: 'call.state', connected: true })
    expect(store.getSnapshot().connected).toBe(true)
  })

  it('notifies subscribers on state change', () => {
    const t = new FakeTransport()
    const store = new CallStore(t)
    store.connect()
    const listener = vi.fn()
    store.subscribe(listener)
    t.emit({ type: 'call.state', connected: true })
    expect(listener).toHaveBeenCalled()
  })

  it('send() applies optimistic control updates and forwards the command', () => {
    const t = new FakeTransport()
    const store = new CallStore(t)
    store.connect()

    store.send({ type: 'mute', on: true })
    expect(store.getSnapshot().muted).toBe(true)

    store.send({ type: 'takeOver' })
    expect(store.getSnapshot().operatorInControl).toBe(true)
    expect(store.getSnapshot().pending).toBeUndefined()

    expect(t.sent).toEqual([{ type: 'mute', on: true }, { type: 'takeOver' }])
  })

  it('endCall optimistically ends the call and clears any pending checkpoint', () => {
    const t = new FakeTransport()
    const store = new CallStore(t)
    store.connect()
    t.emit({ type: 'call.state', connected: true })
    t.emit({ type: 'input.requested', await: 'selectSlot', request: { kind: 'selectSlot', title: 'Pick' } })
    expect(store.getSnapshot().pending).toBeDefined()

    store.send({ type: 'endCall' })
    expect(store.getSnapshot().ended).toBe(true)
    expect(store.getSnapshot().pending).toBeUndefined()
  })
})
