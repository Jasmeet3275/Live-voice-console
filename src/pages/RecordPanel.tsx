import { useCall, useCallSend } from '@/hooks/useCall'
import { BookingRecordPanel } from '@/components/domain/BookingRecordPanel'
import { deriveBookingRecord } from './bookingRecord'
import { CALLER, OPERATOR } from './caller'

/** Binds BookingRecordPanel to the live call store: the record is derived from
 *  the same director-fed state as the transcript (no fetch). When the operator
 *  has the line it becomes their editable form; a saved/confirmed booking flips
 *  it back to the read-only "Booked" state even while the operator holds. */
export function RecordPanel({
  onAfterSave,
  onAfterHandBack,
  onCollapse,
  className,
}: {
  onAfterSave?: () => void
  onAfterHandBack?: () => void
  onCollapse?: () => void
  className?: string
}) {
  const call = useCall()
  const send = useCallSend()
  const rec = deriveBookingRecord(call, CALLER.name)
  const editing = call.operatorInControl && rec.confirm !== 'confirmed'

  return (
    <BookingRecordPanel
      className={className}
      fields={rec.fields}
      confirm={rec.confirm}
      withheldNote={rec.withheldNote}
      deposit={rec.depositAmount}
      editing={editing}
      autoFocusEdit={editing}
      services={rec.services}
      stylist={rec.stylist}
      time={rec.time}
      operator={OPERATOR}
      onCollapse={onCollapse}
      onConfirm={() => send({ type: 'confirmBooking' })}
      onSave={(b) => {
        send({ type: 'operatorBook', services: b.services, stylist: b.stylist, time: b.time, deposit: b.deposit })
        onAfterSave?.()
      }}
      onHandBack={() => {
        send({ type: 'release' })
        onAfterHandBack?.()
      }}
    />
  )
}
