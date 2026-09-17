import { Play } from 'lucide-react'
import { CheckpointSheet, type CheckpointOption } from '@/components/domain/CheckpointSheet'
import { ThreadDivider } from '@/components/domain/threadParts'

/* ------------------------------------------------------------------ *
 * Two ways a call stops — both render as the LAST item in the thread
 * (replacing the transport, not sitting above it).
 *   • CallEndedReceipt   — completed: a quiet, neutral receipt.
 *   • CallDroppedCheckpoint — unfinished work: keeps the amber checkpoint
 *     frame + a live slot countdown, since that timer is why it's urgent.
 * Matches design_handoff "Checkpoint components · end of thread".
 * ------------------------------------------------------------------ */

export function CallEndedReceipt({
  endedLabel = 'Call ended 6:33 PM · 2:14',
  title = 'Handled end to end by the AI',
  note = 'caller hung up first',
  bookingTitle = 'Booked · Marco, tomorrow 6:30 PM',
  bookingDetail = 'Haircut + beard trim · 45 min · $48 with $15 deposit taken.',
  chips = ['Text sent to ··· 4821', 'Transcript saved', '1 correction by you', '0:00 operator time'],
  onOpenBooking,
}: {
  endedLabel?: string
  title?: string
  note?: string
  bookingTitle?: string
  bookingDetail?: string
  chips?: string[]
  onOpenBooking?: () => void
}) {
  return (
    <div>
      <ThreadDivider label={endedLabel} />
      {/* Notice (§5B): a completed call is a fact, not a decision — 3px teal
         rail because the booking completed, and exactly one follow-up action. */}
      <div className="mt-3 overflow-hidden rounded-[14px] border border-l-[3px] border-border border-l-accent bg-surface">
        <div className="px-[15px] pb-3 pt-[13px]">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-accent" />
            <span className="text-[14px] font-semibold text-text">{title}</span>
            <span className="ml-auto text-[11.5px] text-text-muted">{note}</span>
          </div>
          <div className="mb-3 rounded-[11px] border border-accent-border bg-accent-subtle px-3 py-2.5">
            <div className="text-[13.5px] font-semibold text-success">{bookingTitle}</div>
            <div className="mt-0.5 text-[12px] leading-[1.5] text-success">{bookingDetail}</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-secondary">{c}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center border-t border-border bg-bg-app px-[15px] py-2.5">
          <button onClick={onOpenBooking} className="rounded-[9px] border border-border-strong bg-surface px-3 py-1.5 text-[12px] font-semibold text-text transition-colors hover:bg-surface-2">Open booking</button>
        </div>
      </div>
    </div>
  )
}

/* ---- call dropped ---- */

export function DroppedEvidence({ service, stylist }: { service: string; stylist: string }) {
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2.5">
        <div className="min-w-[170px] flex-1 rounded-[11px] bg-bg-app px-3.5 py-3">
          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Captured before the drop</div>
          <div className="flex flex-col gap-1 text-[12.5px] text-text">
            <div className="flex gap-2"><span className="w-[54px] shrink-0 text-text-muted">Service</span><span className="font-semibold">{service}</span></div>
            <div className="flex gap-2"><span className="w-[54px] shrink-0 text-text-muted">Stylist</span><span className="font-semibold">{stylist}</span></div>
          </div>
        </div>
        <div className="min-w-[170px] flex-1 rounded-[11px] border-l-[3px] border-warning-solid bg-bg-app px-3.5 py-3">
          <div className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-warning">Never confirmed</div>
          <div className="flex flex-col gap-1 text-[12.5px] text-text-muted">
            <div className="flex gap-2"><span className="w-[54px] shrink-0 text-text-muted">Time</span><span>—— never heard a yes</span></div>
            <div className="flex gap-2"><span className="w-[54px] shrink-0 text-text-muted">Deposit</span><span>—— not charged</span></div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-[11px] bg-bg-app px-3 py-2">
        <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-text text-text-inverse"><Play size={11} className="ml-0.5 fill-current" /></span>
        <span className="flex-1 text-[12.5px] text-text-secondary">Last 6 seconds — signal drop, no goodbye</span>
        <span className="tabular shrink-0 text-[11.5px] text-text-muted">0:41 · 6.0s</span>
      </div>
    </>
  )
}

export function CallDroppedCheckpoint({
  onSelect, showKeys = true, indent = false,
  service = 'Fade + beard trim', stylist = 'Marco Diaz', time = 'the 6:30 slot',
}: {
  onSelect?: (optionKey: string) => void
  showKeys?: boolean
  indent?: boolean
  /** Captured-before-the-drop facts, from the live call. */
  service?: string
  stylist?: string
  time?: string
}) {
  const opt = (o: Omit<CheckpointOption, 'onSelect'>): CheckpointOption => ({ ...o, onSelect: () => onSelect?.(o.key) })
  return (
    <div>
      <ThreadDivider label="Line lost — caller dropped" tone="amber" />
      <div className="mt-3">
        <CheckpointSheet
          indent={indent}
          label="Dropped — needs you" category="Mid-decision · nothing saved" cost="slot held 3:12"
          claim={<>The caller's line cut out <b className="text-warning">mid-readback</b> of {time}.</>}
          subline="No booking was written and no deposit taken. The chair is still reserved for three more minutes, then it returns to the online pool."
          evidence={<DroppedEvidence service={service} stylist={stylist} />}
          options={[
            opt({ key: 'Call back · Enter', title: 'Call back now', pick: true, rationale: 'Dials ··· 4821 and resumes at the readback. Slot survives if he answers inside three minutes.' }),
            opt({ key: 'Text · 2', title: 'Hold it and text', rationale: 'Books the 6:30 provisionally and texts a one-tap confirm. Auto-releases at 6:45.' }),
            opt({ key: 'Release · 3', title: 'Release the slot', dashed: true, rationale: 'Nothing is saved and the chair goes back online. Jordan is left to call again.' }),
          ]}
          readbackLabel="On the call back, Jordan hears"
          readback="Sorry, we lost you there — I still have 6:30 with Marco. Shall I lock it in?"
          showKeys={showKeys}
        />
      </div>
    </div>
  )
}
