import { useState, type KeyboardEvent } from 'react'
import { Sparkles, Check, CreditCard, CalendarClock, Scissors, User, HandHelping, Headset, TriangleAlert } from 'lucide-react'
import { Button, Pressable, Modal } from '@/components/ui'
import { SlotCard } from '@/components/domain/SlotCard'
import { useCall, useCallSend } from '@/hooks/useCall'
import { cn } from '@/lib/cn'
import type { InputRequest } from '@/types/call'

/** Radiogroup keys for a selection form. Arrow/Home/End move focus between the
 *  options (focus only — they don't select). Enter is two-step: if the focused
 *  option isn't the selected one, the first Enter selects it; a second Enter
 *  (now on the selected option) submits. */
function optionGroupKeyDown(chosen: string | undefined, setChosen: (v: string) => void, submit: () => void) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-arrow-item]:not([disabled])'))
    if (e.key === 'Enter') {
      e.preventDefault()
      const focused = document.activeElement as HTMLElement | null
      const val = focused && items.includes(focused) ? focused.dataset.value : undefined
      if (val != null && val !== chosen) setChosen(val) // first Enter: select the focused option
      else submit() // already selected → submit
      return
    }
    const dir: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
    if (!(e.key in dir) && e.key !== 'Home' && e.key !== 'End') return
    if (!items.length) return
    e.preventDefault()
    const cur = items.indexOf(document.activeElement as HTMLElement)
    const next =
      e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : cur === -1 ? 0
      : (cur + dir[e.key] + items.length) % items.length
    items[next].focus() // move focus only; selection happens on Enter/Space
  }
}

/** Blocking form shown whenever the flow needs human input. Driven by
 *  `Call.pending` (an `input.requested` event) — not the clock. Built on the
 *  accessible `Modal` (focus trap, focus restore); Escape hands off to the
 *  operator (the safe fallback) rather than silently dismissing a required step. */
export function HumanInputModal({ onTakeOver }: { onTakeOver?: () => void }) {
  const req = useCall().pending?.request
  const isHandoff = req?.kind === 'handoff'

  return (
    <Modal
      open={!!req}
      onOpenChange={() => {}} // open state is owned by call.pending
      dismissable={false}
      onEscapeKeyDown={() => onTakeOver?.()}
      describedBy={isHandoff ? 'hitl-handoff-reason' : undefined}
      className="max-w-md p-5"
    >
      {req && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', isHandoff ? 'bg-error-subtle text-error' : 'bg-waiting-subtle text-waiting')}>
              {isHandoff ? <TriangleAlert size={17} /> : <HandHelping size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-micro font-semibold uppercase tracking-wide', isHandoff ? 'text-error' : 'text-waiting')}>
                {isHandoff ? 'Agent needs a human' : 'Your input needed'}
              </p>
              <Modal.Title className="text-title font-semibold text-text">{req.title}</Modal.Title>
            </div>
            {onTakeOver && !isHandoff && (
              <Button variant="ghost" size="sm" leftIcon={<Headset size={14} />} onClick={onTakeOver}>
                Take over
              </Button>
            )}
          </div>

          {/* keyed so form state resets for each new request */}
          <RequestForm key={JSON.stringify(req)} req={req} onTakeOver={onTakeOver} />
        </>
      )}
    </Modal>
  )
}

function RequestForm({ req, onTakeOver }: { req: InputRequest; onTakeOver?: () => void }) {
  const send = useCallSend()
  const call = useCall()

  if (req.kind === 'handoff') {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-error-border bg-error-subtle px-3 py-3">
          <p className="flex items-center gap-1.5 text-caption font-semibold text-error">
            <TriangleAlert size={14} /> Why the agent stopped
          </p>
          <p id="hitl-handoff-reason" className="mt-1.5 text-caption leading-relaxed text-text-secondary">{req.reason}</p>
          {req.detail && <p className="tabular mt-2 text-micro text-text-muted">{req.detail}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="primary" leftIcon={<Headset size={16} />} onClick={onTakeOver} data-autofocus>
            Take over the call
          </Button>
          <Button variant="ghost" onClick={() => send({ type: 'endCall' })}>End call</Button>
        </div>
      </div>
    )
  }

  if (req.kind === 'correctWord') {
    return <CorrectWordForm req={req} send={send} call={call} />
  }

  if (req.kind === 'selectSlot') {
    return <SelectSlotForm send={send} call={call} />
  }

  if (req.kind === 'confirmBooking') {
    const slot = call.slots.find((s) => s.id === call.selectedSlotId) ?? call.slots.find((s) => !s.unavailable)
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-surface-2 p-3">
          <Row icon={<Scissors size={14} />} label="Services" value={slot?.services.join(' + ') ?? 'Haircut + Beard trim'} />
          <Row icon={<User size={14} />} label="Stylist" value={slot?.stylist ?? '—'} />
          <Row icon={<CalendarClock size={14} />} label="When" value={slot?.time ?? '—'} />
          <Row icon={<CreditCard size={14} />} label="Price" value={`${slot?.price ?? '—'}${req.deposit ? ` · deposit ${req.deposit}` : ''}`} />
        </div>
        <div className="flex justify-end">
          <Button variant="primary" leftIcon={<Check size={16} />} onClick={() => send({ type: 'confirmBooking' })} data-autofocus>
            Confirm &amp; book
          </Button>
        </div>
      </div>
    )
  }
  // payment
  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border border-error-border bg-error-subtle px-3 py-2 text-caption text-error">
        Card <span className="tabular font-medium">{req.card}</span> was declined by the issuer.
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => send({ type: 'waiveDeposit' })}>Waive deposit</Button>
        <Button variant="primary" leftIcon={<CreditCard size={16} />} onClick={() => send({ type: 'chargeDeposit' })} data-autofocus>
          Retry charge
        </Button>
      </div>
    </div>
  )
}

function SelectSlotForm({
  send,
  call,
}: {
  send: ReturnType<typeof useCallSend>
  call: ReturnType<typeof useCall>
}) {
  const available = call.slots.filter((s) => !s.unavailable)
  const [chosen, setChosen] = useState(call.selectedSlotId ?? available[0]?.id)
  const submit = () => chosen && send({ type: 'selectSlot', slotId: chosen })

  return (
    <div className="flex flex-col gap-4">
      <div
        role="radiogroup"
        aria-label="Available slots"
        onKeyDown={optionGroupKeyDown(chosen, setChosen, submit)}
        className="flex max-h-[52vh] flex-col gap-2 overflow-auto"
      >
        {call.slots.map((s) => (
          <SlotCard
            key={s.id}
            slot={s}
            selected={chosen === s.id}
            onSelect={setChosen}
            data-arrow-item
            data-value={s.id}
            {...(chosen === s.id ? { 'data-autofocus': '' } : {})}
          />
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="primary" leftIcon={<Check size={16} />} disabled={!chosen} onClick={submit}>
          Book this slot
        </Button>
      </div>
    </div>
  )
}

function CorrectWordForm({
  req,
  send,
  call,
}: {
  req: Extract<InputRequest, { kind: 'correctWord' }>
  send: ReturnType<typeof useCallSend>
  call: ReturnType<typeof useCall>
}) {
  const line = call.feed.find((i) => i.kind === 'utterance' && i.id === req.lineId)
  const words = line && line.kind === 'utterance' ? line.words : []
  const heard = words[req.wordIndex]?.text ?? req.alternatives[0]
  const [chosen, setChosen] = useState(heard)
  const submit = () => send({ type: 'correctWord', lineId: req.lineId, wordIndex: req.wordIndex, chosen })

  return (
    <div className="flex flex-col gap-4">
      {/* sentence context with the flagged word highlighted */}
      {words.length > 0 && (
        <p className="rounded-xl border border-border bg-surface-2 p-3 text-caption leading-relaxed text-text-secondary">
          {words.map((w, i) => (
            <span key={i} className={cn(i === req.wordIndex && 'rounded bg-warning-subtle px-0.5 font-semibold text-warning underline decoration-warning-solid decoration-wavy underline-offset-2')}>
              {w.text}{i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      )}

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-caption font-medium text-text-secondary">
          <Sparkles size={13} className="text-accent" /> Choose the correct word
        </p>
        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Corrected word" onKeyDown={optionGroupKeyDown(chosen, setChosen, submit)}>
          {req.alternatives.map((alt) => {
            const selected = alt === chosen
            return (
              <Pressable
                key={alt}
                data-arrow-item
                data-value={alt}
                {...(selected ? { 'data-autofocus': '' } : {})}
                onClick={() => setChosen(alt)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  selected ? 'border-accent bg-accent-subtle text-text' : 'border-border hover:bg-surface-2',
                )}
              >
                {alt}
                <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', selected ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong')}>
                  {selected && <Check size={11} />}
                </span>
              </Pressable>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={submit}>
          Use “{chosen}”
        </Button>
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-text-muted">{icon}</span>
      <span className="text-caption text-text-muted">{label}</span>
      <span className="ml-auto text-caption font-medium text-text">{value}</span>
    </div>
  )
}
