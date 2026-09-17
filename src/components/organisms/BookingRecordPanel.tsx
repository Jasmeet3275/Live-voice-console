import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsRight, Plus, X } from 'lucide-react'
import { Spinner, Select, Pressable } from '@/components/ui'
import { SERVICES, STYLISTS, SLOT_TIMES, deriveServiceTotals } from '@/mock/salon'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * BookingRecordPanel — the "booking record". While the AI has the line
 * it is a read-only draft: a field renders `——` (withheld, not unknown)
 * until the AI is certain of it, and the row count never changes. When
 * the operator takes over it becomes THEIR form (structured pickers,
 * per-value provenance, deposit choice) — saved under the operator's
 * name in ink, never teal. Same component, used by the docked rail, the
 * desktop expand-drawer, and the mobile /booking page.
 * Matches design_handoff "BookingRecordPanel · takenOver".
 * ------------------------------------------------------------------ */

export interface BookingFields {
  customer: string
  service?: string
  stylist?: string
  length?: string
  time?: string
  price?: string // e.g. "$48 · $15 deposit"
}

export type ConfirmState = 'withheld' | 'ready' | 'charging' | 'confirmed'

export interface OperatorBooking {
  services: string[]
  stylist: string
  time: string
  deposit?: string
}

// Row order follows how the booking is settled through the call: the customer
// and the requested service (+ its length) are known first, then the specific
// stylist/time once a slot is committed, then the price/deposit. This keeps the
// record filling cleanly top-to-bottom in step with the conversation.
const ORDER: { key: keyof BookingFields; label: string }[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'service', label: 'Service' },
  { key: 'length', label: 'Length' },
  { key: 'stylist', label: 'Stylist' },
  { key: 'time', label: 'Time' },
  { key: 'price', label: 'Price' },
]

export interface BookingRecordPanelProps {
  fields: BookingFields
  confirm?: ConfirmState
  deposit?: string
  /** Explanation shown while any field is withheld. */
  withheldNote?: string
  /** Operator has the line → the record becomes their editable form. */
  editing?: boolean
  /** Seed values for the edit form (what the AI captured). */
  services?: string[]
  stylist?: string
  time?: string
  /** Display-mode confirm (AI draft is ready → operator confirms). */
  onConfirm?: () => void
  /** Edit-mode save → books under the operator's name. */
  onSave?: (b: OperatorBooking) => void
  onHandBack?: () => void
  /** Name shown in the "Yours" author line while editing. */
  operator?: string
  /** On take-over, move focus into the form's first field (live console only). */
  autoFocusEdit?: boolean
  /** When set, a collapse chevron shows in the header (docked rail). */
  onCollapse?: () => void
  className?: string
}

/** Parse a slot time like "Tomorrow · 6:30 PM" down to a SLOT_TIMES entry. */
function toSlotTime(time?: string): string | undefined {
  if (!time) return undefined
  const m = time.match(/\d{1,2}:\d{2}\s?(?:AM|PM)/i)
  const found = m?.[0]?.toUpperCase().replace(/\s+/, ' ')
  return found && SLOT_TIMES.includes(found) ? found : undefined
}

export function BookingRecordPanel({
  fields,
  confirm = 'withheld',
  deposit = '$15',
  withheldNote,
  editing = false,
  services: aiServices,
  stylist: aiStylist,
  time: aiTime,
  onConfirm,
  onSave,
  onHandBack,
  operator = 'You',
  autoFocusEdit = false,
  onCollapse,
  className,
}: BookingRecordPanelProps) {
  if (editing) {
    return (
      <EditForm
        className={className}
        deposit={deposit}
        aiServices={aiServices ?? []}
        aiStylist={aiStylist}
        aiTime={toSlotTime(aiTime)}
        onSave={onSave}
        onHandBack={onHandBack}
        operator={operator}
        autoFocus={autoFocusEdit}
        onCollapse={onCollapse}
      />
    )
  }

  const anyWithheld = ORDER.some(({ key }) => fields[key] == null)
  const status = confirm === 'confirmed' ? 'saved' : 'draft'

  return (
    <div className={cn('flex min-h-0 flex-col bg-surface', className)}>
      <div className="flex items-center gap-2 border-b border-border px-[18px] py-[15px]">
        <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-text">Booking record</span>
        <span className="ml-auto text-[11px] text-text-muted">{status}</span>
        {onCollapse && <CollapseChevron onClick={onCollapse} />}
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

        <div className="mt-auto pt-3.5">
          {confirm === 'ready' && (
            <>
              <button
                onClick={onConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 py-3 text-[14.5px] font-semibold text-accent-fg shadow-[0_6px_16px_-9px_rgba(31,125,110,0.75)] transition-transform duration-150 hover:-translate-y-0.5"
              >
                Confirm · take {deposit}
              </button>
              <p className="mt-1.5 text-center text-[11px] leading-[1.4] text-text-muted">Charges Visa ···· 4242 and texts the caller.</p>
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
    </div>
  )
}

/** The header collapse control for the docked right rail (`››` toward the edge). */
function CollapseChevron({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Collapse booking record"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
    >
      <ChevronsRight size={15} />
    </button>
  )
}

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

// ---- operator edit form -------------------------------------------------

/** Author marker: teal dot = the AI captured it and the operator left it;
 *  ink square = the operator typed it. The record is unauditable without it. */
function Provenance({ ai }: { ai: boolean }) {
  return ai ? (
    <span className="ml-auto flex items-center gap-1">
      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
      <span className="text-[10.5px] font-semibold text-accent">AI heard this</span>
    </span>
  ) : (
    <span className="ml-auto flex items-center gap-1">
      <span className="h-2 w-2 shrink-0 rounded-[2px] bg-text" />
      <span className="text-[10.5px] font-semibold text-text-secondary">You typed this</span>
    </span>
  )
}

function EditRowLabel({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <span className="text-[11.5px] text-text-muted">{label}</span>
      {children}
    </div>
  )
}

function sameServices(a: string[], b: string[]) {
  return a.length === b.length && a.every((s) => b.includes(s))
}

function EditForm({
  className,
  deposit,
  aiServices,
  aiStylist,
  aiTime,
  onSave,
  onHandBack,
  operator,
  autoFocus = false,
  onCollapse,
}: {
  className?: string
  deposit: string
  aiServices: string[]
  aiStylist?: string
  aiTime?: string
  onSave?: (b: OperatorBooking) => void
  onHandBack?: () => void
  operator: string
  autoFocus?: boolean
  onCollapse?: () => void
}) {
  const [services, setServices] = useState<string[]>(aiServices.length ? aiServices : ['Haircut', 'Beard trim'])
  const [stylist, setStylist] = useState<string>(aiStylist ?? '')
  const [time, setTime] = useState<string>(aiTime ?? '')
  const [depositOn, setDepositOn] = useState(true)

  // On take-over the operator lands straight in the form: focus its first field.
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!autoFocus) return
    bodyRef.current?.querySelector<HTMLElement>('button, [role="combobox"], input, [tabindex]:not([tabindex="-1"])')?.focus()
  }, [autoFocus])

  const totals = useMemo(() => deriveServiceTotals(services), [services])
  const canSave = services.length > 0 && Boolean(stylist) && Boolean(time)

  const toggleService = (s: string) =>
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const save = () => {
    if (!canSave) return
    onSave?.({ services, stylist, time, deposit: depositOn ? deposit : undefined })
  }

  const stylistIsAi = Boolean(aiStylist) && stylist === aiStylist
  const timeIsAi = Boolean(aiTime) && time === aiTime
  const initials = operator.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'YOU'

  return (
    <div className={cn('flex min-h-0 flex-col bg-surface', className)}>
      {/* header — now "Yours", authored by the operator */}
      <div className="border-b border-border px-[18px] py-[13px]">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[14.5px] font-semibold tracking-[-0.01em] text-text">Booking record</span>
          <span className="ml-auto rounded-md bg-text px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-text-inverse">Yours</span>
          {onCollapse && <CollapseChevron onClick={onCollapse} />}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-surface-2 text-[9.5px] font-bold text-text-secondary">{initials}</span>
          <span className="min-w-0 flex-1 truncate text-[11.5px] text-text-muted">{operator} editing · AI muted, still transcribing</span>
          <span className="h-[7px] w-[7px] shrink-0 animate-breathe rounded-full bg-text" />
        </div>
      </div>

      <div ref={bodyRef} className="flex flex-1 flex-col overflow-y-auto px-[18px] py-[13px]">
        {/* Customer — locked */}
        <div className="flex items-center gap-2 border-b border-border py-2">
          <span className="w-[62px] shrink-0 text-[11.5px] text-text-muted">Customer</span>
          <span className="text-[13.5px] font-semibold text-text">Jordan Rivera</span>
          <span className="ml-auto text-[10.5px] text-text-muted">caller ID</span>
        </div>

        {/* Services — chips */}
        <div className="border-b border-border py-2.5">
          <EditRowLabel label="Services"><Provenance ai={sameServices(services, aiServices) && aiServices.length > 0} /></EditRowLabel>
          <div className="flex flex-wrap gap-1.5">
            {SERVICES.map((s) => {
              const on = services.includes(s)
              return (
                <Pressable
                  key={s}
                  onClick={() => toggleService(s)}
                  aria-pressed={on}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors',
                    on ? 'border-text bg-surface-2 text-text' : 'border-border text-text-secondary hover:bg-surface-2',
                  )}
                >
                  {s}
                  {on ? <X size={11} /> : <Plus size={11} />}
                </Pressable>
              )
            })}
          </div>
        </div>

        {/* Stylist — select */}
        <div className="border-b border-border py-2.5">
          <EditRowLabel label="Stylist"><Provenance ai={stylistIsAi} /></EditRowLabel>
          <Select
            aria-label="Stylist"
            value={stylist}
            onValueChange={setStylist}
            placeholder="Choose a stylist"
            options={STYLISTS.map((s) => ({ value: s.name, label: s.name }))}
          />
        </div>

        {/* Time — select */}
        <div className="border-b border-border py-2.5">
          <EditRowLabel label="Time"><Provenance ai={timeIsAi} /></EditRowLabel>
          <Select
            aria-label="Time"
            value={time}
            onValueChange={setTime}
            placeholder="Choose a time"
            options={SLOT_TIMES.map((t) => ({ value: t, label: t }))}
          />
          <p className="mt-1.5 text-[11px] leading-[1.4] text-text-muted">Read off the desk book — not verified against the calendar.</p>
        </div>

        {/* Length — derived */}
        <div className="border-b border-border py-2.5">
          <EditRowLabel label="Length"><span className="ml-auto text-[10.5px] text-text-muted">from services</span></EditRowLabel>
          <div className="rounded-lg bg-surface-2 px-2.5 py-2 text-[13.5px] font-semibold text-text">{totals.length}</div>
        </div>

        {/* Price — derived */}
        <div className="border-b border-border py-2.5">
          <EditRowLabel label="Price"><span className="ml-auto text-[10.5px] text-text-muted">from services</span></EditRowLabel>
          <div className="rounded-lg bg-surface-2 px-2.5 py-2 text-[13.5px] font-semibold text-text">{totals.price}</div>
        </div>

        {/* Deposit — take / skip */}
        <div className="py-2.5">
          <EditRowLabel label="Deposit"><span className="ml-auto text-[10.5px] text-text-muted">Visa ···· 4242</span></EditRowLabel>
          <div className="flex gap-1.5">
            <button
              onClick={() => setDepositOn(true)}
              aria-pressed={depositOn}
              className={cn(
                'flex-1 rounded-lg border px-2 py-2 text-[12.5px] font-semibold transition-colors',
                depositOn ? 'border-text bg-surface-2 text-text' : 'border-border text-text-secondary hover:bg-surface-2',
              )}
            >
              Take {deposit}
            </button>
            <button
              onClick={() => setDepositOn(false)}
              aria-pressed={!depositOn}
              className={cn(
                'flex-1 rounded-lg border px-2 py-2 text-[12.5px] font-semibold transition-colors',
                !depositOn ? 'border-text bg-surface-2 text-text' : 'border-border text-text-secondary hover:bg-surface-2',
              )}
            >
              Skip
            </button>
          </div>
        </div>
      </div>

      {/* footer — ink save (never teal), then hand back */}
      <div className="border-t border-border bg-surface-2 px-[18px] py-[14px]">
        <button
          onClick={save}
          disabled={!canSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-text px-3 py-3 text-[14.5px] font-semibold text-text-inverse transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <Check size={16} /> {depositOn ? `Save booking · take ${deposit}` : 'Save booking'}
        </button>
        <p className="mt-1.5 text-center text-[11px] leading-[1.45] text-text-muted">Saved under your name, not the AI's. The caller gets the same confirmation text.</p>
        {onHandBack && (
          <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
            <span className="flex-1 text-[11.5px] text-text-muted">Done talking?</span>
            <button
              onClick={onHandBack}
              className="rounded-lg border border-border px-2.5 py-1.5 text-[11.5px] font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text"
            >
              Hand back to AI
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
