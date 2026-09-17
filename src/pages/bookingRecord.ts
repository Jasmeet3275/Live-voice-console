import type { Call, StepType } from '@/types/call'
import type { BookingFields, ConfirmState } from '@/components/organisms'
import { deriveServiceTotals } from '@/mock/salon'
import { deriveCallSummary } from './callSummary'

/** Everything the booking record needs, derived purely from the live `Call`
 *  state (which the director feeds over the same wire a real backend would).
 *  No fetch, no polling — this is a selector, recomputed on every store event.
 *
 *  The record fills *in step with the conversation*, never ahead of it: a field
 *  stays `——` (withheld, not unknown) until the pipeline has actually reached
 *  the stage that settles it. Service is known once intent is classified; the
 *  stylist/time/price only once a specific slot is committed (held); the deposit
 *  only once the deposit/payment step runs. Merely *recommending* slots — the
 *  operator hasn't even chosen yet — does not fill the record. */
export interface BookingRecord {
  /** Display rows (a field is `undefined` when withheld, not unknown). */
  fields: BookingFields
  confirm: ConfirmState
  /** Shown while any field is withheld. */
  withheldNote?: string
  /** Seed values for the operator edit form (best-effort, ungated). */
  services: string[]
  stylist?: string
  time?: string
  depositAmount: string
}

const DEFAULT_SERVICES = ['Haircut', 'Beard trim']
const DEPOSIT = '$15'

export function deriveBookingRecord(call: Call, customer: string): BookingRecord {
  const slot =
    call.slots.find((s) => s.id === call.selectedSlotId && !s.unavailable) ??
    call.slots.find((s) => !s.unavailable)

  const summary = deriveCallSummary(call, customer)
  const confirmed = summary?.status === 'confirmed'

  // Pipeline stages, read off the agent steps the director has emitted so far.
  const steps = call.feed.flatMap((i) => (i.kind === 'turn' ? i.steps : []))
  const has = (t: StepType) => steps.some((s) => s.type === t)
  const hasSuccess = (t: StepType) => steps.some((s) => s.type === t && s.state === 'success')

  // The confirm checkpoint is open → the booking is ready to save.
  const pendingConfirm = call.pending?.request.kind === 'confirmBooking'

  // Service is understood once intent is classified (or the AI is past it).
  const intentKnown = hasSuccess('classify_intent') || has('capability') || confirmed
  // A specific slot's stylist/time only settle once the booking is being
  // *finalised* — a deposit/payment/confirm step (or a confirm checkpoint). This
  // never fires during recommend/reassign (the operator hasn't accepted a slot
  // yet), so the record can't run ahead of the conversation.
  const finalizing = has('deposit') || has('payment') || has('confirm') || pendingConfirm || confirmed
  // The deposit itself fills the "· $15 deposit" suffix on price.
  const depositStage = has('deposit') || has('payment') || confirmed

  const charging =
    !confirmed && !pendingConfirm &&
    steps.some((s) => (s.type === 'payment' || s.type === 'deposit') && (s.state === 'running' || s.state === 'waiting'))

  // Best-effort values (used both for display and as the edit-form seed).
  const services = slot?.services ?? summary?.services ?? DEFAULT_SERVICES
  const stylist = confirmed ? summary?.stylist : slot?.stylist
  const time = confirmed ? summary?.when : slot?.time
  const length = (confirmed ? summary?.duration : slot?.duration) ?? deriveServiceTotals(services).length
  const priceValue = confirmed ? summary?.price : slot?.price

  const hasStylist = Boolean(stylist) && stylist !== '—'
  const hasTime = Boolean(time) && time !== '—'

  const fields: BookingFields = {
    customer,
    service: intentKnown ? services.join(' + ') : undefined,
    length: intentKnown ? length : undefined,
    stylist: finalizing && hasStylist ? stylist : undefined,
    time: finalizing && hasTime ? time : undefined,
    price: finalizing && priceValue ? `${priceValue}${depositStage ? ` · ${DEPOSIT} deposit` : ''}` : undefined,
  }

  // The rail's Confirm button only means something when a confirm checkpoint is
  // actually open (that's the only thing `confirmBooking` resolves), so 'ready'
  // is tied to it rather than to the fields merely being present.
  const confirm: ConfirmState = confirmed
    ? 'confirmed'
    : pendingConfirm
      ? 'ready'
      : charging
        ? 'charging'
        : 'withheld'

  return {
    fields,
    confirm,
    withheldNote: confirm === 'withheld' ? 'A field fills only when the AI is certain of it.' : undefined,
    services,
    stylist: hasStylist ? stylist : undefined,
    time: hasTime ? time : undefined,
    depositAmount: DEPOSIT,
  }
}
