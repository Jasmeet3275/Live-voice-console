import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CallStore } from '@/store/callStore'
import { CallStoreContext } from '@/store/callContext'
import { InlineCheckpoint } from './InlineCheckpoint'
import type { CallTransport, ClientCommand, ServerEvent, Slot, TranscriptWord } from '@/types/call'

class FakeTransport implements CallTransport {
  handler?: (e: ServerEvent) => void
  sent: ClientCommand[] = []
  connect() {}
  close() {}
  subscribe(h: (e: ServerEvent) => void) {
    this.handler = h
    return () => { this.handler = undefined }
  }
  send(c: ClientCommand) { this.sent.push(c) }
  emit(e: ServerEvent) { this.handler?.(e) }
}

const SLOTS: Slot[] = [
  { id: 's1', time: 'Tomorrow · 6:30 PM', stylist: 'Marco Diaz', duration: '45 min', price: '$48', services: ['Haircut'], reasons: ['best'], recommended: true },
  { id: 's2', time: 'Tomorrow · 7:15 PM', stylist: 'Alex Kim', duration: '45 min', price: '$45', services: ['Haircut'], reasons: ['also'] },
]

const WORDS: TranscriptWord[] = [
  { text: 'someone', confidence: 0.98 },
  { text: 'good', confidence: 0.98 },
  { text: 'with', confidence: 0.98 },
  { text: 'fades', confidence: 0.61, alternatives: ['fades', 'facial'] },
]

function setup(emit: (t: FakeTransport) => void, onTakeOver = vi.fn()) {
  const t = new FakeTransport()
  const store = new CallStore(t)
  store.connect()
  emit(t)
  render(
    <CallStoreContext.Provider value={store}>
      <InlineCheckpoint onTakeOver={onTakeOver} callerName="Jordan Rivera" />
    </CallStoreContext.Provider>,
  )
  return { t, onTakeOver }
}

describe('InlineCheckpoint', () => {
  it('renders nothing when there is no pending checkpoint', () => {
    const { container } = render(
      <CallStoreContext.Provider value={new CallStore(new FakeTransport())}>
        <InlineCheckpoint />
      </CallStoreContext.Provider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('correct-word: choosing the alternative sends correctWord with real line data', () => {
    const { t } = setup((tr) => {
      tr.emit({ type: 'transcript.line', line: { id: 'l2', speaker: 'caller', words: WORDS, final: true } })
      tr.emit({ type: 'input.requested', await: 'correctWord', request: { kind: 'correctWord', title: 'What did the caller say?', lineId: 'l2', wordIndex: 3, alternatives: ['fades', 'facial'] } })
    })
    fireEvent.click(screen.getByRole('button', { name: /facial/ }))
    expect(t.sent).toContainEqual({ type: 'correctWord', lineId: 'l2', wordIndex: 3, chosen: 'facial' })
  })

  it('correct-word: focus lands on the replay clip so you can listen before deciding', () => {
    setup((tr) => {
      tr.emit({ type: 'transcript.line', line: { id: 'l2', speaker: 'caller', words: WORDS, final: true } })
      tr.emit({ type: 'input.requested', await: 'correctWord', request: { kind: 'correctWord', title: 'What did the caller say?', lineId: 'l2', wordIndex: 3, alternatives: ['fades', 'facial'] } })
    })
    // This checkpoint has a 2s replay clip — the operator hears it before deciding.
    expect(screen.getByRole('button', { name: /play clip/i })).toHaveFocus()
  })

  it('select-slot: the AI pick is auto-focused (no clip) and Enter offers it', async () => {
    const { t } = setup((tr) => {
      tr.emit({ type: 'recommendation.updated', slots: SLOTS })
      tr.emit({ type: 'input.requested', await: 'selectSlot', request: { kind: 'selectSlot', title: 'Choose a time' } })
    })
    // No clip here → focus lands on the AI's pick, so Enter activates it.
    expect(screen.getByRole('button', { name: /Offer .*only/ })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(t.sent).toContainEqual({ type: 'selectSlot', slotId: 's1', offer: 'one' })
  })

  it('correct-word: a digit hotkey (2) commits the alternative from anywhere', () => {
    const { t } = setup((tr) => {
      tr.emit({ type: 'transcript.line', line: { id: 'l2', speaker: 'caller', words: WORDS, final: true } })
      tr.emit({ type: 'input.requested', await: 'correctWord', request: { kind: 'correctWord', title: 'What did the caller say?', lineId: 'l2', wordIndex: 3, alternatives: ['fades', 'facial'] } })
    })
    fireEvent.keyDown(window, { key: '2' })
    expect(t.sent).toContainEqual({ type: 'correctWord', lineId: 'l2', wordIndex: 3, chosen: 'facial' })
  })

  it('select-slot: shows ranked openings and the offer cards dispatch selectSlot with a strategy', () => {
    const { t } = setup((tr) => {
      tr.emit({ type: 'recommendation.updated', slots: SLOTS })
      tr.emit({ type: 'input.requested', await: 'selectSlot', request: { kind: 'selectSlot', title: 'Choose a time' } })
    })
    // s1 is the recommended (best fit); s2 is the alt.
    fireEvent.click(screen.getByRole('button', { name: /Offer .*only/ }))
    expect(t.sent).toContainEqual({ type: 'selectSlot', slotId: 's1', offer: 'one' })
    fireEvent.click(screen.getByRole('button', { name: /Offer .*and/ }))
    expect(t.sent).toContainEqual({ type: 'selectSlot', slotId: 's1', offer: 'both' })
    fireEvent.click(screen.getByRole('button', { name: /Ask how late/ }))
    expect(t.sent).toContainEqual({ type: 'selectSlot', slotId: 's1', offer: 'ask' })
  })

  it('confirm: confirm and skip-deposit send distinct commands', () => {
    const { t } = setup((tr) => {
      tr.emit({ type: 'recommendation.updated', slots: SLOTS })
      tr.emit({ type: 'input.requested', await: 'confirmBooking', request: { kind: 'confirmBooking', title: 'Confirm this booking', deposit: '$15' } })
    })
    fireEvent.click(screen.getByRole('button', { name: /Book, skip deposit/ }))
    expect(t.sent).toContainEqual({ type: 'waiveDeposit' })
    fireEvent.click(screen.getByRole('button', { name: /Confirm & book/ }))
    expect(t.sent).toContainEqual({ type: 'confirmBooking' })
  })

  it('payment: waive, retry and ask send distinct commands', () => {
    const { t } = setup((tr) =>
      tr.emit({ type: 'input.requested', await: 'chargeDeposit', request: { kind: 'payment', title: 'Payment declined', card: '•••• 4242' } }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Retry the charge/ }))
    expect(t.sent).toContainEqual({ type: 'chargeDeposit' })
    fireEvent.click(screen.getByRole('button', { name: /Waive the deposit/ }))
    expect(t.sent).toContainEqual({ type: 'waiveDeposit' })
    fireEvent.click(screen.getByRole('button', { name: /Ask for another card/ }))
    expect(t.sent).toContainEqual({ type: 'askForCard' })
  })

  it('handoff: shows the error reason and the primary card takes over', () => {
    const { onTakeOver } = setup(
      (tr) =>
        tr.emit({ type: 'input.requested', await: 'takeOver', request: { kind: 'handoff', title: 'Scheduling service unavailable', reason: 'I cannot reach the scheduling service.', detail: 'HTTP 503 · 2 retries failed' } }),
    )
    expect(screen.getByText(/cannot reach the scheduling service/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Take over the call/ }))
    expect(onTakeOver).toHaveBeenCalled()
  })

  it('handoff: the AI-led paths send scheduleCallback / sendBookingLink', () => {
    const { t } = setup(
      (tr) =>
        tr.emit({ type: 'input.requested', await: 'takeOver', request: { kind: 'handoff', title: 'Scheduling service unavailable', reason: 'down', detail: 'HTTP 503' } }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Promise a callback/ }))
    expect(t.sent).toContainEqual({ type: 'scheduleCallback' })
    fireEvent.click(screen.getByRole('button', { name: /Send a booking link/ }))
    expect(t.sent).toContainEqual({ type: 'sendBookingLink' })
  })

  it('Escape at a checkpoint takes over', () => {
    const { onTakeOver } = setup((tr) =>
      tr.emit({ type: 'input.requested', await: 'selectSlot', request: { kind: 'selectSlot', title: 'Choose a time' } }),
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onTakeOver).toHaveBeenCalled()
  })
})
