import { useEffect, useRef } from 'react'

export interface Shortcut {
  keys: string[]
  label: string
  when?: string
  /** Render "or" between the keys (alternatives), not side by side. */
  alt?: boolean
}
export interface ShortcutGroup {
  title: string
  /** The risky band — the keys that change who is talking (ink keycaps on sand). */
  band?: boolean
  rows: Shortcut[]
}

/** Single source of truth for the operator shortcut map — grouped by what each
 *  key acts on, with the three keys that change who's talking set apart in their
 *  own band. Rendered in the help dialog; the handler below is the matching
 *  switch. Matches design_handoff "Keyboard shortcuts dialog · 1A". */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'The call',
    rows: [
      { keys: ['Space', 'K'], label: 'Play / pause the call', alt: true },
      { keys: ['←', '→'], label: 'Seek', when: 'waveform focused' },
      { keys: ['M'], label: 'Mute / unmute' },
      { keys: ['S'], label: 'Speaker on / off' },
    ],
  },
  {
    title: 'Screen',
    rows: [
      { keys: ['B'], label: 'Widen / narrow the booking record' },
      { keys: ['Esc'], label: 'Close a dialog', when: 'at a checkpoint, take over' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Changes who is talking',
    band: true,
    rows: [
      { keys: ['T'], label: 'Take over the call', when: 'AI in control' },
      { keys: ['H'], label: 'Hand back to the AI', when: 'you in control' },
      { keys: ['E'], label: 'End the call' },
    ],
  },
]

/** Flat list of every shortcut (kept for reference / any external consumer). */
export const SHORTCUTS: Shortcut[] = SHORTCUT_GROUPS.flatMap((g) => g.rows)

export interface ShortcutHandlers {
  /** A dialog/checkpoint is open — suppress global shortcuts (the modal owns the keyboard). */
  blocked: boolean
  /** The call is live (not ended) — action shortcuts only fire when true. */
  active: boolean
  /** The call has begun — the call-control shortcuts are inert until then (play/pause still works). */
  started: boolean
  inControl: boolean
  togglePlay: () => void
  toggleMute: () => void
  toggleSpeaker: () => void
  takeOver: () => void
  handBack: () => void
  book: () => void
  requestEnd: () => void
  showHelp: () => void
}

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable
}

/** Global operator shortcuts. Registered once; reads the latest handlers via a
 *  ref so it never goes stale and never re-binds. Ignores modifier combos and
 *  typing contexts, and stands down while a dialog is open. */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      if (h.blocked) return // a modal is open; let it own the keyboard

      if (e.key === '?') { e.preventDefault(); h.showHelp(); return }
      if (!h.active) return

      // Play/pause always works (it's how you start the call from the keyboard).
      if (e.key === ' ' || e.key.toLowerCase() === 'k') { e.preventDefault(); h.togglePlay(); return }
      // The rest are call controls — inert until the call has started.
      if (!h.started) return
      switch (e.key.toLowerCase()) {
        case 'm': h.toggleMute(); break
        case 's': h.toggleSpeaker(); break
        case 't': if (!h.inControl) h.takeOver(); break
        case 'h': if (h.inControl) h.handBack(); break
        case 'b': h.book(); break
        case 'e': h.requestEnd(); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
