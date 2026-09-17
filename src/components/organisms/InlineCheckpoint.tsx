import { useEffect } from 'react'
import { CheckpointSheet, ClipPlayerRow, type CheckpointOption } from '@/components/domain/CheckpointSheet'
import { buildSlotDecision } from '@/components/domain/inlineInputs'
import { DroppedEvidence } from '@/components/domain/callEnd'
import { useCall, useCallSend } from '@/hooks/useCall'
import { cn } from '@/lib/cn'
import type { Call, ClientCommand, InputRequest } from '@/types/call'

/* ------------------------------------------------------------------ *
 * InlineCheckpoint — the live wiring of the checkpoint family. Reads
 * the current `call.pending` checkpoint and renders the matching inline
 * component (never a modal), driven by REAL data from the store and with
 * `onSelect` handlers that dispatch the actual `ClientCommand`.
 *
 * checkpoints.tsx stays the hardcoded demo/reference (used by ?demo);
 * this adapter is what the real ConsolePage renders.
 * ------------------------------------------------------------------ */

/** A decision card plus the keyboard hotkey that fires it (Enter / 2 / 3). */
type LiveOption = CheckpointOption & { hotkey: 'Enter' | '2' | '3' }

export function InlineCheckpoint({
  onTakeOver,
  callerName = 'the caller',
  indent = false,
}: {
  /** Take over the call — used by the hand-off's primary card and by Escape. */
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
      category={built.category}
      claim={built.claim}
      subline={built.subline}
      evidence={built.evidence}
      options={built.options}
      readback={built.readback}
      readbackLabel={built.readbackLabel}
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
  category?: string
  cost?: string
  claim: React.ReactNode
  subline?: string
  evidence?: React.ReactNode
  options: LiveOption[]
  readback?: string
  readbackLabel?: string
  indent?: boolean
}) {
  // Global shortcuts are suppressed while a checkpoint is open, so the checkpoint
  // owns the keyboard. Focus lands on the natural first control when it opens (the
  // AI's pick, or the replay clip on the word check), so Enter/Space activates
  // whatever is focused *natively* — we don't bind Enter here (that would double-
  // fire against the focused card, or accept the word while you meant to play the
  // clip). The digit hotkeys stay as accelerators: 2 / 3 commit those cards from
  // anywhere.
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
  category?: string
  claim: React.ReactNode
  subline?: string
  evidence?: React.ReactNode
  options: LiveOption[]
  readback?: string
  readbackLabel?: string
}

function EvidenceRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2 py-2', !last && 'border-b border-border')}>
      <span className="w-[66px] shrink-0 text-[11.5px] text-text-muted">{label}</span>
      <span className="ml-auto text-[13px] font-semibold text-text">{value}</span>
    </div>
  )
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
      return { label: 'Slot — you decide', category: 'Availability', claim: <>No open slots to offer right now.</>, options: [] }
    }
    const options: LiveOption[] = d.specs.map((sp) => ({
      hotkey: sp.hotkey, key: sp.key, title: sp.title, rationale: sp.rationale, pick: sp.pick, dashed: sp.dashed,
      onSelect: () => send({ type: 'selectSlot', slotId: d.best.id, offer: sp.mode }),
    }))
    return { label: d.label, category: d.category, claim: d.claim, subline: d.subline, evidence: d.evidence, options, readback: d.readback }
  }

  if (req.kind === 'correctWord') {
    const line = call.feed.find((i) => i.kind === 'utterance' && i.id === req.lineId)
    const words = line && line.kind === 'utterance' ? line.words : []
    const lineTime = line && line.kind === 'utterance' ? line.time : undefined
    const flagged = words[req.wordIndex]
    const heard = flagged?.text ?? req.alternatives[0]
    const pct = flagged ? Math.round(flagged.confidence * 100) : undefined
    const alt = req.alternatives.find((a) => a !== heard)

    const correct = (chosen: string) => () => send({ type: 'correctWord', lineId: req.lineId, wordIndex: req.wordIndex, chosen })
    const options: LiveOption[] = [
      { hotkey: 'Enter', key: 'Accept · Enter', title: `“${heard}”`, pick: true, rationale: 'Take it as transcribed — the AI moves straight on to availability.', onSelect: correct(heard) },
    ]
    if (alt) options.push({ hotkey: '2', key: 'Use this · 2', title: `“${alt}”`, rationale: 'Swap in this reading before the AI acts on it.', onSelect: correct(alt) })
    options.push({ hotkey: alt ? '3' : '2', key: `Ask · ${alt ? 3 : 2}`, title: `Ask ${firstName}`, dashed: true, rationale: 'The AI reconfirms aloud — a few seconds, and it admits the mishear.', onSelect: () => send({ type: 'askCaller' }) })

    return {
      label: 'Held — you decide',
      category: 'Understanding · service',
      claim: <>One word decides the booking, and it came through at <b className="text-warning">{pct != null ? `${pct}%` : 'low confidence'}</b>.</>,
      subline: 'No capability check, no duration, no slots yet — the AI is holding the line with “Let me check that for you.”',
      // The 2-second replay clip the operator can scrub — matches the WordCheckpoint domain component.
      evidence: <ClipPlayerRow label={`${lineTime ?? '0:06'} · 2.0s`} />,
      options,
      readback: `Got it — ${heard}. Let me find you an evening slot.`,
    }
  }

  if (req.kind === 'confirmBooking') {
    const slot = call.slots.find((s) => s.id === call.selectedSlotId) ?? call.slots.find((s) => !s.unavailable)
    const services = slot?.services.join(' + ') ?? 'Haircut + Beard trim'
    const stylist = slot?.stylist ?? '—'
    const when = slot ? `${slot.time}${slot.duration ? ` · ${slot.duration}` : ''}` : '—'
    const price = slot?.price ?? '—'
    const dep = req.deposit

    const whenShort = slot ? (slot.time.split('·').pop()?.trim() ?? slot.time) : 'the slot'
    const stylistFirst = stylist.split(' ')[0]

    const options: LiveOption[] = [
      { hotkey: 'Enter', key: 'Confirm · Enter', title: 'Confirm & book', pick: true, rationale: dep ? 'Card on file, no past no-shows. The deposit is standard for a 45-min evening chair.' : 'All five fields are certain — save it and text the caller.', onSelect: () => send({ type: 'confirmBooking' }) },
    ]
    if (dep) options.push({ hotkey: '2', key: 'Use this · 2', title: 'Book, skip deposit', rationale: `Saves the same booking and charges nothing now. Full ${price} due in the chair.`, onSelect: () => send({ type: 'waiveDeposit' }) })
    options.push({ hotkey: dep ? '3' : '2', key: `Read back · ${dep ? '3' : '2'}`, title: 'Read it back first', dashed: true, rationale: 'The AI repeats every field and waits for a yes. Nothing is saved until then.', onSelect: () => send({ type: 'readBack' }) })

    return {
      label: 'Confirm — you decide',
      category: 'Booking · ready to save',
      claim: dep
        ? <>All five fields are certain. Confirming charges <b className="text-warning">{dep}</b> and texts {firstName}.</>
        : <>All five fields are certain — confirming books the chair and texts {firstName}.</>,
      subline: `${stylistFirst}'s ${whenShort} chair is held for a few more minutes — after that the slot returns to the online pool.`,
      evidence: (
        <div className="rounded-[11px] bg-bg-app px-3.5">
          <EvidenceRow label="Services" value={services} />
          <EvidenceRow label="Stylist" value={stylist} />
          <EvidenceRow label="When" value={when} />
          <EvidenceRow label="Price" value={dep ? <>{price} <span className="font-normal text-text-muted">· {dep} deposit now</span></> : price} last />
        </div>
      ),
      options,
      readback: `You're booked with ${stylist.split(' ')[0]} at ${slot?.time ?? 'your slot'} — a confirmation text is on its way.`,
    }
  }

  if (req.kind === 'payment') {
    return {
      label: 'Payment — you decide',
      category: 'Deposit · declined',
      claim: <>The deposit failed — the issuer declined <b className="text-warning">{req.card}</b>.</>,
      subline: `The booking is written but unpaid, and the AI has only said “one moment”. It won't raise money again without you.`,
      evidence: (
        <div className="rounded-[11px] border-l-[3px] border-warning-solid bg-bg-app px-3.5 py-3">
          <div className="mb-1.5 text-[13px] font-semibold text-text">{req.card}</div>
          <div className="grid grid-cols-2 gap-2.5 text-[11.5px] leading-[1.4] text-text-secondary">
            {[
              ['Issuer says', 'Declined'],
              ['Retry window', 'Soft decline · retryable'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.11em] text-text-muted">{k}</div>
                {v}
              </div>
            ))}
          </div>
        </div>
      ),
      options: [
        { hotkey: 'Enter', key: 'Waive · Enter', title: 'Waive the deposit', pick: true, rationale: 'A loyal regular — keep the slot and never raise the decline with them.', onSelect: () => send({ type: 'waiveDeposit' }) },
        { hotkey: '2', key: 'Retry · 2', title: 'Retry the charge', rationale: 'Same card, same amount. Soft declines often clear on a second try.', onSelect: () => send({ type: 'chargeDeposit' }) },
        { hotkey: '3', key: 'Ask · 3', title: 'Ask for another card', dashed: true, rationale: 'The AI says the card was declined and takes a new one. Honest, and slower.', onSelect: () => send({ type: 'askForCard' }) },
      ],
      readback: `All set with ${firstName} — no deposit needed this time. See you soon.`,
    }
  }

  if (req.kind === 'callerDropped') {
    const service = req.service ?? 'the service'
    const stylist = req.stylist ?? 'the stylist'
    const stylistFirst = stylist.split(' ')[0]
    const when = req.time ?? 'the slot'
    return {
      label: 'Dropped — needs you',
      category: 'Mid-decision · nothing saved',
      claim: <>The caller's line cut out <b className="text-warning">mid-readback</b> of {when}.</>,
      subline: 'No booking was written and no deposit taken. The chair is still reserved for three more minutes, then it returns to the online pool.',
      evidence: <DroppedEvidence service={service} stylist={stylist} />,
      options: [
        { hotkey: 'Enter', key: 'Call back · Enter', title: 'Call back now', pick: true, rationale: `Redial and resume at the readback. The slot survives if ${firstName} answers inside three minutes.`, onSelect: () => send({ type: 'callBack' }) },
        { hotkey: '2', key: 'Text · 2', title: 'Hold it and text', rationale: 'Books the slot provisionally and texts a one-tap confirm. Auto-releases if unconfirmed.', onSelect: () => send({ type: 'holdAndText' }) },
        { hotkey: '3', key: 'Release · 3', title: 'Release the slot', dashed: true, rationale: `Nothing is saved and the chair goes back online. ${firstName} is left to call again.`, onSelect: () => send({ type: 'releaseSlot' }) },
      ],
      readbackLabel: 'On the call back, they hear',
      readback: `Sorry, we lost you there — I still have ${when} with ${stylistFirst}. Shall I lock it in?`,
    }
  }

  // handoff (ink)
  const detailParts = req.detail?.split(' · ') ?? []
  const retries = detailParts.find((s) => /retr/i.test(s))
  return {
    label: 'Agent needs a human',
    category: detailParts[0] ? `${detailParts[0]} · unavailable` : 'Escalation',
    claim: retries
      ? <>There's nothing safe for the AI to offer without you — <b className="text-warning">{retries}</b>.</>
      : <>{req.title} — the AI has no safe way forward on its own.</>,
    subline: 'Service and stylist are certain. Time, price and deposit stay withheld until someone can read availability.',
    evidence: (
      <div className="rounded-[11px] border-l-[3px] border-text bg-bg-app px-3.5 py-3">
        <div className="mb-1.5 text-[12.5px] font-semibold text-text">Why the agent stopped</div>
        <p className="mb-2 text-[12.5px] leading-[1.5] text-text-secondary">{req.reason}</p>
        {req.detail && (
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-text-secondary">
            {req.detail.split(' · ').map((c) => (
              <span key={c} className="rounded-[7px] bg-bubble-caller px-2 py-0.5">{c}</span>
            ))}
          </div>
        )}
      </div>
    ),
    options: [
      { hotkey: 'Enter', key: 'Take over · Enter', title: 'Take over the call', pick: true, rationale: 'Step in and book manually. The AI goes silent but keeps transcribing.', onSelect: () => ctx.onTakeOver?.() },
      { hotkey: '2', key: 'Queue · 2', title: 'Promise a callback', rationale: 'The AI ends politely and queues the caller at the top of the desk list.', onSelect: () => send({ type: 'scheduleCallback' }) },
      { hotkey: '3', key: 'Text link · 3', title: 'Send a booking link', dashed: true, rationale: 'Texts the self-serve page so the caller can finish online.', onSelect: () => send({ type: 'sendBookingLink' }) },
    ],
    readback: 'Let me put you with someone at the desk — one second.',
  }
}
