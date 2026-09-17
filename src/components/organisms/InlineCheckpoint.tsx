import { useEffect } from 'react'
import { CheckpointSheet, type CheckpointOption } from '@/components/organisms/CheckpointSheet'
import { buildSlotDecision } from '@/components/molecules/inlineInputs'
import { useCall, useCallSend } from '@/hooks/useCall'
import type { Call, ClientCommand, InputRequest } from '@/types/call'

/* ------------------------------------------------------------------ *
 * InlineCheckpoint — the live wiring of the focused checkpoint family.
 * Reads the current `call.pending` checkpoint and renders the matching
 * inline sheet (never a modal), driven by REAL data from the store and
 * with `onSelect` handlers that dispatch the actual `ClientCommand`.
 *
 * Each kind maps to three focused blocks: the header label, one question
 * line + one context line, and single-line option rows (AI's pick first,
 * the passive path dashed last). checkpoints.tsx stays the hardcoded
 * demo/reference (used by ?demo); this adapter is what ConsolePage renders.
 * ------------------------------------------------------------------ */

/** A decision row plus the keyboard hotkey that fires it (Enter / 2 / 3). */
type LiveOption = CheckpointOption & { hotkey: 'Enter' | '2' | '3' }

export function InlineCheckpoint({
  onTakeOver,
  callerName = 'the caller',
  indent = false,
}: {
  /** Take over the call — used by the hand-off's primary row and by Escape. */
  onTakeOver?: () => void
  callerName?: string
  indent?: boolean
}) {
  const call = useCall()
  const send = useCallSend()
  const req = call.pending?.request

  // Escape at any checkpoint hands off to the operator (the safe fallback) —
  // the same contract the old modal had, and what the shortcuts sheet promises.
  useEffect(() => {
    if (!req) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onTakeOver?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [req, onTakeOver])

  if (!req) return null

  const firstName = callerName.split(' ')[0]
  const built = buildDecision(req, call, send, { onTakeOver, firstName })

  return (
    <DecisionCheckpoint
      key={JSON.stringify(req)}
      tone={req.kind === 'handoff' ? 'ink' : 'hold'}
      label={built.label}
      claim={built.claim}
      subline={built.subline}
      options={built.options}
      indent={indent}
    />
  )
}

/* ---- generic decision sheet (correctWord / confirm / payment / handoff) ---- */

function DecisionCheckpoint({
  options, ...sheet
}: {
  tone: 'hold' | 'ink'
  label: string
  claim: React.ReactNode
  subline?: string
  options: LiveOption[]
  indent?: boolean
}) {
  // Global shortcuts are suppressed while a checkpoint is open, so the checkpoint
  // owns the keyboard. Focus lands on the AI's pick when it opens, so Enter/Space
  // activates it *natively* — we don't bind Enter here (that would double-fire
  // against the focused row). The digit hotkeys stay as accelerators: 2 / 3
  // commit those rows from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const hit = options.find((o) => o.hotkey === e.key)
      if (hit) {
        e.preventDefault()
        hit.onSelect?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options])

  return <CheckpointSheet {...sheet} options={options} autoFocus />
}

/* ---- per-kind data → decision mapping ---- */

interface Decision {
  label: string
  claim: React.ReactNode
  subline?: string
  options: LiveOption[]
}

function buildDecision(
  req: InputRequest,
  call: Call,
  send: (cmd: ClientCommand) => void,
  ctx: { onTakeOver?: () => void; firstName: string },
): Decision {
  const { firstName } = ctx

  if (req.kind === 'selectSlot') {
    const d = buildSlotDecision(call.slots)
    if (!d) {
      return { label: 'Slot — you decide', claim: <>No open slots to offer right now.</>, options: [] }
    }
    const options: LiveOption[] = d.specs.map((sp) => ({
      hotkey: sp.hotkey, key: sp.key, title: sp.title, note: sp.note, pick: sp.pick, dashed: sp.dashed,
      onSelect: () => send({ type: 'selectSlot', slotId: d.best.id, offer: sp.mode }),
    }))
    return { label: d.label, claim: d.claim, subline: d.subline, options }
  }

  if (req.kind === 'correctWord') {
    const line = call.feed.find((i) => i.kind === 'utterance' && i.id === req.lineId)
    const words = line && line.kind === 'utterance' ? line.words : []
    const flagged = words[req.wordIndex]
    const heard = flagged?.text ?? req.alternatives[0]
    const pct = flagged ? Math.round(flagged.confidence * 100) : undefined
    const alt = req.alternatives.find((a) => a !== heard)

    const correct = (chosen: string) => () => send({ type: 'correctWord', lineId: req.lineId, wordIndex: req.wordIndex, chosen })
    const options: LiveOption[] = [
      { hotkey: 'Enter', key: 'Accept · Enter', title: `“${heard}”`, note: 'as transcribed', pick: true, onSelect: correct(heard) },
    ]
    if (alt) options.push({ hotkey: '2', key: 'Use this · 2', title: `“${alt}”`, note: 'swap this in', onSelect: correct(alt) })
    options.push({ hotkey: alt ? '3' : '2', key: `Ask · ${alt ? 3 : 2}`, title: `Ask ${firstName}`, note: 'reconfirms aloud · ~8s', dashed: true, onSelect: () => send({ type: 'askCaller' }) })

    return {
      label: 'Held — you decide',
      claim: <>One word decides the booking, and it came through at <b className="text-warning">{pct != null ? `${pct}%` : 'low confidence'}</b>. Which is it?</>,
      subline: 'The AI is holding the line with “Let me check that for you.”',
      options,
    }
  }

  if (req.kind === 'confirmBooking') {
    const slot = call.slots.find((s) => s.id === call.selectedSlotId) ?? call.slots.find((s) => !s.unavailable)
    const services = slot?.services.join(' + ') ?? 'Haircut + beard trim'
    const stylistFirst = (slot?.stylist ?? 'the stylist').split(' ')[0]
    const when = slot ? `${slot.time}${slot.duration ? ` · ${slot.duration}` : ''}` : 'the slot'
    const price = slot?.price ?? '—'
    const dep = req.deposit

    const options: LiveOption[] = [
      { hotkey: 'Enter', key: 'Confirm · Enter', title: 'Confirm & book', note: dep ? 'card on file · 0 no-shows' : 'all fields certain', pick: true, onSelect: () => send({ type: 'confirmBooking' }) },
    ]
    if (dep) options.push({ hotkey: '2', key: 'Use this · 2', title: 'Book, skip deposit', note: `full ${price} in the chair`, onSelect: () => send({ type: 'waiveDeposit' }) })
    options.push({ hotkey: dep ? '3' : '2', key: `Read back · ${dep ? '3' : '2'}`, title: 'Read it back first', note: 'saves nothing yet · ~11s', dashed: true, onSelect: () => send({ type: 'readBack' }) })

    return {
      label: 'Confirm — you decide',
      claim: <>Save the booking?</>,
      subline: `${stylistFirst} · ${when} · ${services} · ${dep ? `${price} · ${dep} deposit now` : price}`,
      options,
    }
  }

  if (req.kind === 'payment') {
    return {
      label: 'Payment — you decide',
      claim: <>The deposit was declined — the issuer declined <b className="text-warning">{req.card}</b>. What now?</>,
      subline: `${req.card} · soft decline, retryable · booking saved, unpaid`,
      options: [
        { hotkey: 'Enter', key: 'Waive · Enter', title: 'Waive the deposit', note: '0 no-shows in 4 visits', pick: true, onSelect: () => send({ type: 'waiveDeposit' }) },
        { hotkey: '2', key: 'Retry · 2', title: 'Retry the charge', note: 'same card · ~4s of silence', onSelect: () => send({ type: 'chargeDeposit' }) },
        { hotkey: '3', key: 'Ask · 3', title: 'Ask for another card', note: `tells ${firstName} it declined · ~25s`, dashed: true, onSelect: () => send({ type: 'askForCard' }) },
      ],
    }
  }

  if (req.kind === 'callerDropped') {
    const when = req.time ?? 'the slot'
    return {
      label: 'Dropped — needs you',
      claim: <>{firstName} dropped <b className="text-warning">mid-readback</b> of {when}. Keep it?</>,
      subline: 'Nothing saved, nothing charged · chair held three more minutes.',
      options: [
        { hotkey: 'Enter', key: 'Call back · Enter', title: 'Call back now', note: 'resumes at the readback', pick: true, onSelect: () => send({ type: 'callBack' }) },
        { hotkey: '2', key: 'Text · 2', title: 'Hold it and text', note: 'one-tap confirm · auto-releases', onSelect: () => send({ type: 'holdAndText' }) },
        { hotkey: '3', key: 'Release · 3', title: 'Release the slot', note: 'chair goes back online', dashed: true, onSelect: () => send({ type: 'releaseSlot' }) },
      ],
    }
  }

  // handoff (ink)
  return {
    label: 'Agent needs a human',
    claim: <>{req.title}</>,
    subline: `${req.reason}${req.detail ? ` · ${req.detail}` : ''}`,
    options: [
      { hotkey: 'Enter', key: 'Take over · ⌘⇧T', title: 'Take over the call', note: 'AI goes silent, keeps transcribing', pick: true, onSelect: () => ctx.onTakeOver?.() },
      { hotkey: '2', key: 'Queue · 2', title: 'Promise a callback', note: 'tops the desk queue', onSelect: () => send({ type: 'scheduleCallback' }) },
      { hotkey: '3', key: 'Text link · 3', title: 'Send a booking link', note: 'needs the calendar back', dashed: true, onSelect: () => send({ type: 'sendBookingLink' }) },
    ],
  }
}
