import type { Call, FeedItem } from '@/types/call'
import type { CallSummaryProps } from '@/components/domain/CallSummary'

/** Build the end-of-call recap from the feed + current slot selection. */
export function deriveCallSummary(call: Call, customer: string): CallSummaryProps | null {
  const turns = call.feed.filter((i): i is Extract<FeedItem, { kind: 'turn' }> => i.kind === 'turn')
  if (turns.length === 0) return null
  const steps = turns.flatMap((t) => t.steps)
  const slot = call.slots.find((s) => s.id === call.selectedSlotId) ?? call.slots.find((s) => !s.unavailable)

  const bookedTurn = turns.find((t) => t.summary?.startsWith('Booked'))
  const heldTurn = turns.find((t) => /held|awaiting/i.test(t.summary ?? ''))
  const status: CallSummaryProps['status'] = bookedTurn ? 'confirmed' : heldTurn ? 'pending' : 'failed'

  const paid = steps.some((s) => s.type === 'payment' && s.state === 'success')
  const waived = steps.some((s) => s.type === 'payment' && /waiv/i.test(s.detail ?? ''))
  const depositReq = paid || waived || steps.some((s) => s.type === 'deposit')
  const deposit = waived
    ? ({ amount: 15, status: 'waived' } as const)
    : paid
      ? ({ amount: 15, status: 'collected' } as const)
      : depositReq
        ? ({ amount: 15, status: 'pending' } as const)
        : undefined

  // Prefer the selected slot; fall back to parsing the "Booked · <time> with <stylist>" summary.
  let when = slot?.time
  let stylist = slot?.stylist
  if ((!when || !stylist) && bookedTurn?.summary) {
    const [t, st] = bookedTurn.summary.replace(/^Booked · /, '').split(' with ')
    when = when ?? t
    stylist = stylist ?? st
  }

  const notes: string[] = []
  const clarified = steps.find((s) => s.type === 'clarify' && /confirmed/i.test(s.detail ?? ''))
  if (clarified?.detail) notes.push(clarified.detail)
  if (steps.some((s) => s.type === 'conflict_check' && s.state === 'error')) notes.push('Reassigned after a staff conflict')
  if (steps.some((s) => s.type === 'recommend' && s.state === 'error')) notes.push('Original slot was taken — re-picked')
  if (steps.some((s) => s.type === 'payment' && /retr/i.test(s.detail ?? ''))) notes.push('Deposit charged after a retry')
  if (steps.some((s) => s.type === 'hold_booking')) notes.push('Booking held — caller to confirm via SMS')
  if (steps.some((s) => s.type === 'handoff')) notes.push('Escalated to an operator (scheduling service unavailable)')

  return {
    customer,
    services: slot?.services ?? ['Haircut', 'Beard trim'],
    stylist: stylist ?? '—',
    when: when ?? '—',
    duration: slot?.duration ?? '45 min',
    price: slot?.price ?? '—',
    deposit,
    status,
    notes,
  }
}
