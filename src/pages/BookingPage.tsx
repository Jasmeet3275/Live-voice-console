import { ArrowLeft, Headset, Phone, CalendarClock, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCall, useCallSend } from '@/hooks/useCall'
import { useClock } from '@/hooks/useClock'
import { Badge } from '@/components/atoms'
import { formatTime } from '@/lib/audio'
import { deriveBookingRecord } from './bookingRecord'
import { RecordPanel } from './RecordPanel'
import { CALLER } from './caller'

/* ------------------------------------------------------------------ *
 * BookingPage — the mobile "Booking details" route (/booking). One page
 * for the whole call: it shows the live record (withheld → filling →
 * confirmed), becomes the operator's edit form on take-over, and lands on
 * the confirmed detail once booked. Reads the same director-fed store as
 * the console. Matches design_handoff / Screen 3 mobile "Booking details".
 * ------------------------------------------------------------------ */

export function BookingPage() {
  const navigate = useNavigate()
  const call = useCall()
  const send = useCallSend()
  const clock = useClock()
  const rec = deriveBookingRecord(call, CALLER.name)
  const editing = call.operatorInControl && rec.confirm !== 'confirmed'
  const confirmed = rec.confirm === 'confirmed'
  const firstName = CALLER.name.split(' ')[0]

  const subtitle = confirmed
    ? `#48213 · saved ${formatTime(clock.elapsed / 1000)} into the call`
    : editing
      ? 'You have the line — fill it under your name'
      : 'What the AI has settled so far'

  const badge = confirmed ? (
    <Badge tone="success">Confirmed</Badge>
  ) : editing ? (
    <Badge tone="neutral">Editing</Badge>
  ) : rec.confirm === 'ready' ? (
    <Badge tone="info">Ready</Badge>
  ) : (
    <Badge tone="neutral">Draft</Badge>
  )

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-bg-app pb-[env(safe-area-inset-bottom)]">
      {/* header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to the call"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold tracking-[-0.02em] text-text">Booking details</div>
          <div className="truncate text-[11.5px] text-text-muted">{subtitle}</div>
        </div>
        {badge}
      </header>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {confirmed ? (
          <ConfirmedDetails rec={rec} />
        ) : (
          <div className="p-4">
            <RecordPanel
              className="overflow-hidden rounded-2xl border border-border"
              onAfterHandBack={() => navigate('/')}
            />
          </div>
        )}
      </div>

      {/* footer actions */}
      {confirmed ? (
        <div className="flex shrink-0 gap-2 border-t border-border bg-surface px-4 py-3.5">
          <button className="flex-1 rounded-xl border border-border py-3 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-surface-2">
            Reschedule
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-[13.5px] font-semibold text-accent-fg">
            <Phone size={15} /> Call {firstName}
          </button>
        </div>
      ) : !editing ? (
        <div className="flex shrink-0 gap-2 border-t border-border bg-surface px-4 py-3.5">
          <button
            onClick={() => navigate('/')}
            className="flex-1 rounded-xl border border-border py-3 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-surface-2"
          >
            Back to call
          </button>
          {!call.ended && (
            <button
              onClick={() => send({ type: 'takeOver' })}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-[13.5px] font-semibold text-accent-fg shadow-[0_6px_16px_-9px_rgba(31,125,110,0.75)]"
            >
              <Headset size={15} /> Take over to fill
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

// ---- confirmed detail (hero + how it was decided + confirmation) --------

function ConfirmedDetails({ rec }: { rec: ReturnType<typeof deriveBookingRecord> }) {
  const heroTime = rec.time ?? '6:30 PM'
  const { service, stylist, length, price } = rec.fields

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* hero */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-baseline gap-2">
          <CalendarClock size={18} className="translate-y-0.5 text-accent" />
          <span className="text-[24px] font-bold tracking-[-0.03em] text-text">{heroTime}</span>
        </div>
        <DetailRow label="Service" value={service} />
        <DetailRow label="Stylist" value={stylist} />
        <DetailRow label="Length" value={length} />
        <DetailRow label="Total" value={rec.fields.price ? rec.fields.price.split('·')[0].trim() : undefined} />
        <DetailRow label="Deposit taken" value={`${rec.depositAmount} · Visa ···· 4242`} accent />
      </div>

      {/* how this was decided */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">How this was decided</div>
        <Decision rail="amber" title="Service corrected by the operator" detail="Low-confidence word resolved to the returning service" />
        <Decision rail="neutral" title="Stylist chosen by the AI" detail="Only evening stylist certified; 3 of 4 past visits" />
        <Decision rail="neutral" title="Alternative withdrawn" detail="A later slot was booked online mid-call, never offered" last />
      </div>

      {/* confirmation */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Confirmation</div>
        <ConfirmLine label="Text delivered to ··· 4821" />
        <ConfirmLine label={`Added to ${stylist ?? 'the stylist'}'s calendar`} last />
      </div>

      <p className="px-1 text-[11.5px] leading-[1.5] text-text-muted">
        {price ? `${price} charged. ` : ''}The booking is saved and the caller has the confirmation.
      </p>
    </div>
  )
}

function DetailRow({ label, value, accent }: { label: string; value?: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-border py-2">
      <span className="text-[12.5px] text-text-muted">{label}</span>
      <span className={accent ? 'text-[13px] font-semibold text-success' : 'text-[13px] font-semibold text-text'}>{value ?? '——'}</span>
    </div>
  )
}

function Decision({ rail, title, detail, last }: { rail: 'amber' | 'neutral'; title: string; detail: string; last?: boolean }) {
  return (
    <div className={`flex gap-2.5 ${last ? '' : 'pb-2.5'}`}>
      <span className={`w-0.5 shrink-0 rounded-full ${rail === 'amber' ? 'bg-waiting' : 'bg-border-strong'}`} />
      <div>
        <div className="text-[12.5px] font-semibold text-text">{title}</div>
        <div className="mt-0.5 text-[11.5px] leading-[1.45] text-text-muted">{detail}</div>
      </div>
    </div>
  )
}

function ConfirmLine({ label, last }: { label: string; last?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${last ? '' : 'mb-1.5'}`}>
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-fg"><Check size={11} /></span>
      <span className="text-[12.5px] text-text-secondary">{label}</span>
    </div>
  )
}
