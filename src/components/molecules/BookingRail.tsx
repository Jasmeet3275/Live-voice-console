import { Spinner } from '@/components/atoms'
import { cn } from '@/lib/cn'
import type { BookingFields, ConfirmState } from '@/components/organisms/BookingRecordPanel'

/* ------------------------------------------------------------------ *
 * BookingRail — the right "booking record" bar (showcase / mobile demo
 * variant). A field renders `——` (withheld, not unknown) until the AI is
 * certain of it; the row count never changes between states. Confirm has
 * four states. The live console uses BookingRecordPanel, which shares
 * these types. Matches design_handoff / Screen 1 right rail.
 * ------------------------------------------------------------------ */

export type { BookingFields, ConfirmState }

const ORDER: { key: keyof BookingFields; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'service', label: 'Service' },
  { key: 'stylist', label: 'Stylist' },
  { key: 'length', label: 'Length' },
  { key: 'time', label: 'Time' },
  { key: 'price', label: 'Price' },
]

function Field({ label, value, last }: { label: string; value?: string; last?: boolean }) {
  const withheld = value == null
  return (
    <div className={cn('flex items-center gap-2 py-2.5', !last && 'border-b border-border', withheld && 'opacity-60')}>
      <span className="w-[62px] shrink-0 text-[11.5px] text-text-muted">{label}</span>
      {withheld
        ? <span className="text-[13px] text-text-muted">——</span>
        : <span className="text-[13.5px] font-semibold text-text">{value}</span>}
    </div>
  )
}

export function BookingRail({
  fields,
  confirm = 'withheld',
  deposit = '$15',
  withheldNote,
  onConfirm,
  className,
}: {
  fields: BookingFields
  confirm?: ConfirmState
  deposit?: string
  /** Explanation shown while any field is withheld. */
  withheldNote?: string
  onConfirm?: () => void
  className?: string
}) {
  const anyWithheld = ORDER.some(({ key }) => fields[key] == null)
  const status = confirm === 'confirmed' ? 'saved' : 'draft'

  return (
    <aside className={cn('flex w-[330px] shrink-0 flex-col border-l border-border bg-surface', className)}>
      <div className="flex items-baseline gap-2 border-b border-border px-[18px] py-[15px]">
        <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-text">Booking record</span>
        <span className="ml-auto text-[11px] text-text-muted">{status}</span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-[18px] py-[15px]">
        <div className="flex flex-col">
          {ORDER.map((f, i) => (
            <Field key={f.key} label={f.label} value={fields[f.key]} last={i === ORDER.length - 1} />
          ))}
        </div>

        {anyWithheld && withheldNote && (
          <div className="mt-3 rounded-xl bg-surface-2 px-[13px] py-[11px] text-[12px] leading-[1.5] text-text-secondary">
            {withheldNote}
          </div>
        )}

        {/* confirm */}
        <div className="mt-auto pt-3.5">
          {confirm === 'ready' && (
            <>
              <button
                onClick={onConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-[14.5px] font-semibold text-accent-fg shadow-[0_6px_16px_-9px_rgba(31,125,110,0.75)] transition-transform duration-150 hover:-translate-y-0.5"
              >
                Confirm · take {deposit}
              </button>
              <p className="mt-1.5 text-center text-[11px] leading-[1.4] text-text-muted">Charges Visa ···· 4242 and texts Jordan.</p>
            </>
          )}
          {confirm === 'charging' && (
            <div className="flex items-center justify-center gap-2.5 rounded-xl bg-surface-2 px-3 py-3">
              <Spinner size={14} className="text-accent" />
              <span className="text-[14px] font-semibold text-text-secondary">Taking deposit…</span>
            </div>
          )}
          {confirm === 'confirmed' && (
            <div className="rounded-xl border-[1.5px] border-accent bg-accent-subtle px-3 py-3 text-center">
              <div className="mb-0.5 text-[14.5px] font-semibold text-success">Booked · {deposit} taken</div>
              <div className="text-[11.5px] text-success">Confirmation sent to ··· 4821</div>
            </div>
          )}
          {confirm === 'withheld' && (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 px-3 py-3">
              <span className="text-[14px] font-semibold text-text-muted">Confirm booking</span>
              <span className="rounded-md bg-[rgba(34,31,28,0.1)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-text-secondary">withheld</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
