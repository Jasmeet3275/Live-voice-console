import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CallStore } from '@/store/callStore'
import { CallStoreContext } from '@/store/callContext'
import { HumanInputModal } from './HumanInputModal'
import type { CallTransport, ClientCommand, ServerEvent, Slot } from '@/types/call'

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

function setup(emit: (t: FakeTransport) => void, onTakeOver = vi.fn()) {
  const t = new FakeTransport()
  const store = new CallStore(t)
  store.connect()
  emit(t)
  render(
    <CallStoreContext.Provider value={store}>
      <HumanInputModal onTakeOver={onTakeOver} />
    </CallStoreContext.Provider>,
  )
  return { t, onTakeOver }
}

describe('HumanInputModal', () => {
  it('renders nothing when there is no pending checkpoint', () => {
    setup(() => {})
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('correct-word: choose an alternative and submit sends correctWord', () => {
    const { t } = setup((tr) =>
      tr.emit({
        type: 'input.requested',
        await: 'correctWord',
        request: { kind: 'correctWord', title: 'What did the caller say?', lineId: 'l2', wordIndex: 0, alternatives: ['fades', 'facial'] },
      }),
    )
    expect(screen.getByText('What did the caller say?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('facial'))
    fireEvent.click(screen.getByRole('button', { name: /Use/ }))
    expect(t.sent).toContainEqual({ type: 'correctWord', lineId: 'l2', wordIndex: 0, chosen: 'facial' })
  })

  it('correct-word: Enter is two-step — first selects the focused option, second submits', () => {
    const { t } = setup((tr) =>
      tr.emit({
        type: 'input.requested',
        await: 'correctWord',
        request: { kind: 'correctWord', title: 'What did the caller say?', lineId: 'l2', wordIndex: 0, alternatives: ['fades', 'facial'] },
      }),
    )
    const facial = screen.getByText('facial')
    facial.focus()
    fireEvent.keyDown(facial, { key: 'Enter' }) // selects "facial" (was "fades")
    expect(t.sent.some((c) => c.type === 'correctWord')).toBe(false)
    fireEvent.keyDown(facial, { key: 'Enter' }) // already selected → submit
    expect(t.sent).toContainEqual({ type: 'correctWord', lineId: 'l2', wordIndex: 0, chosen: 'facial' })
  })

  it('select-slot: shows the slots and submits the selection', () => {
    const { t } = setup((tr) => {
      tr.emit({ type: 'recommendation.updated', slots: SLOTS })
      tr.emit({ type: 'input.requested', await: 'selectSlot', request: { kind: 'selectSlot', title: 'Choose a time' } })
    })
    expect(screen.getByText('Choose a time')).toBeInTheDocument()
    expect(screen.getAllByText('Marco Diaz').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: /Book this slot/ }))
    expect(t.sent.some((c) => c.type === 'selectSlot')).toBe(true)
  })

  it('handoff: shows the error reason and offers take-over', () => {
    const onTakeOver = vi.fn()
    setup(
      (tr) =>
        tr.emit({
          type: 'input.requested',
          await: 'takeOver',
          request: { kind: 'handoff', title: 'Scheduling service unavailable', reason: 'I cannot reach the scheduling service.' },
        }),
      onTakeOver,
    )
    expect(screen.getByText(/cannot reach the scheduling service/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Take over the call/ }))
    expect(onTakeOver).toHaveBeenCalled()
  })

  it('payment: retry and waive send distinct commands', () => {
    const { t } = setup((tr) =>
      tr.emit({ type: 'input.requested', await: 'chargeDeposit', request: { kind: 'payment', title: 'Payment declined', card: '•••• 4242' } }),
    )
    fireEvent.click(screen.getByRole('button', { name: /Waive deposit/ }))
    expect(t.sent).toContainEqual({ type: 'waiveDeposit' })
    fireEvent.click(screen.getByRole('button', { name: /Retry charge/ }))
    expect(t.sent).toContainEqual({ type: 'chargeDeposit' })
  })
})
