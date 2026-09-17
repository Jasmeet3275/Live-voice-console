import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { CallStore } from '@/store/callStore'
import { CallStoreContext } from '@/store/callContext'
import { LiveAnnouncer } from './LiveAnnouncer'
import type { CallTransport, ServerEvent } from '@/types/call'

class FakeTransport implements CallTransport {
  handler?: (e: ServerEvent) => void
  connect() {}
  close() {}
  subscribe(h: (e: ServerEvent) => void) { this.handler = h; return () => {} }
  send() {}
  emit(e: ServerEvent) { this.handler?.(e) }
}

function setup() {
  const t = new FakeTransport()
  const store = new CallStore(t)
  store.connect()
  const { container } = render(
    <CallStoreContext.Provider value={store}>
      <LiveAnnouncer />
    </CallStoreContext.Provider>,
  )
  return { t, container }
}

describe('LiveAnnouncer', () => {
  it('announces new final transcript lines politely', () => {
    const { t, container } = setup()
    act(() => t.emit({ type: 'call.state', connected: true }))
    act(() =>
      t.emit({
        type: 'transcript.line',
        line: { id: 'l2', speaker: 'caller', words: [{ text: 'Hi', confidence: 0.9 }, { text: 'there', confidence: 0.9 }], final: true },
      }),
    )
    const polite = container.querySelector('[aria-live="polite"]')
    expect(polite?.textContent).toBe('Caller: Hi there')
  })

  it('announces an opened checkpoint assertively', () => {
    const { t, container } = setup()
    act(() => t.emit({ type: 'call.state', connected: true }))
    act(() =>
      t.emit({ type: 'input.requested', await: 'selectSlot', request: { kind: 'selectSlot', title: 'Choose a time' }, hint: 'Pick a slot for the caller' }),
    )
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toMatch(/Action needed: Pick a slot/)
  })

  it('announces an error notice assertively (caller dropped)', () => {
    const { t, container } = setup()
    act(() => t.emit({ type: 'call.state', connected: true }))
    act(() => t.emit({ type: 'call.state', connected: false }))
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toMatch(/disconnected/i)
  })
})
