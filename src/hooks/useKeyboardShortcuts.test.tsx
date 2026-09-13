import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useKeyboardShortcuts, type ShortcutHandlers } from './useKeyboardShortcuts'

function makeHandlers(over: Partial<ShortcutHandlers> = {}): ShortcutHandlers {
  return {
    blocked: false,
    active: true,
    started: true,
    inControl: false,
    togglePlay: vi.fn(),
    toggleMute: vi.fn(),
    toggleSpeaker: vi.fn(),
    takeOver: vi.fn(),
    handBack: vi.fn(),
    book: vi.fn(),
    requestEnd: vi.fn(),
    showHelp: vi.fn(),
    ...over,
  }
}

function Harness({ handlers }: { handlers: ShortcutHandlers }) {
  useKeyboardShortcuts(handlers)
  return <input data-testid="field" />
}

const press = (key: string, target: EventTarget = window) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))

describe('useKeyboardShortcuts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps single keys to the right actions', () => {
    const h = makeHandlers()
    render(<Harness handlers={h} />)
    press('m'); expect(h.toggleMute).toHaveBeenCalledOnce()
    press('s'); expect(h.toggleSpeaker).toHaveBeenCalledOnce()
    press('t'); expect(h.takeOver).toHaveBeenCalledOnce()
    press('e'); expect(h.requestEnd).toHaveBeenCalledOnce()
    press(' '); expect(h.togglePlay).toHaveBeenCalledOnce()
    press('?'); expect(h.showHelp).toHaveBeenCalledOnce()
  })

  it('only fires take-over / hand-back based on who is in control', () => {
    const ai = makeHandlers({ inControl: false })
    render(<Harness handlers={ai} />)
    press('h'); expect(ai.handBack).not.toHaveBeenCalled() // AI in control → no hand back
    press('t'); expect(ai.takeOver).toHaveBeenCalledOnce()
  })

  it('ignores modifier combos (so Cmd+T etc. stay with the browser)', () => {
    const h = makeHandlers()
    render(<Harness handlers={h} />)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', metaKey: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', ctrlKey: true }))
    expect(h.takeOver).not.toHaveBeenCalled()
  })

  it('stands down while typing in a field', () => {
    const h = makeHandlers()
    const { getByTestId } = render(<Harness handlers={h} />)
    press('m', getByTestId('field'))
    expect(h.toggleMute).not.toHaveBeenCalled()
  })

  it('is suppressed while a modal is open (blocked)', () => {
    const h = makeHandlers({ blocked: true })
    render(<Harness handlers={h} />)
    press('m'); press('?')
    expect(h.toggleMute).not.toHaveBeenCalled()
    expect(h.showHelp).not.toHaveBeenCalled()
  })

  it('gates call controls until the call has started (but play/pause still works)', () => {
    const h = makeHandlers({ started: false })
    render(<Harness handlers={h} />)
    press('m'); expect(h.toggleMute).not.toHaveBeenCalled()
    press('e'); expect(h.requestEnd).not.toHaveBeenCalled()
    press(' '); expect(h.togglePlay).toHaveBeenCalledOnce() // starting the call from the keyboard
  })
})
