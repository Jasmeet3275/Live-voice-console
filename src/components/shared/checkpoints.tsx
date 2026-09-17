import { CheckpointSheet, ClipPlayerRow, type CheckpointOption } from '@/components/domain/CheckpointSheet'

/* ------------------------------------------------------------------ *
 * The checkpoint family — one CheckpointSheet, four variants. Each
 * supplies its evidence block + decision options; the frame is shared.
 * Matches design_handoff "Checkpoint components".
 * ------------------------------------------------------------------ */

interface VariantProps {
  onSelect?: (optionKey: string) => void
  showKeys?: boolean
  indent?: boolean
}

const pass = (o: Omit<CheckpointOption, 'onSelect'>, cb?: (k: string) => void): CheckpointOption => ({
  ...o, onSelect: () => cb?.(o.key),
})

/* ---- correct word (the "held" decision) ---- */

export function WordCheckpoint({ onSelect, showKeys = true, indent = false }: VariantProps) {
  return (
    <CheckpointSheet
      label="Held — you decide" category="Understanding · service" cost="dead air 0:12"
      claim={<>One word decides the booking, and it came through at <b className="text-warning">38%</b>.</>}
      subline="No capability check, no duration, no slots — the AI is holding the line with “Let me check that for you.”"
      evidence={<ClipPlayerRow label="0:11 · 2.0s" />}
      options={[
        pass({ key: 'Accept · Enter', title: '“fades”', pick: true, rationale: 'All 4 past visits. Pairs with beard trim. 45 min, Marco certified.' }, onSelect),
        pass({ key: 'Use this · 2', title: '“facials”', rationale: 'Never booked. Not offered with beard trim. 60 min, Nina.' }, onSelect),
        pass({ key: 'Ask · 3', title: 'Ask Jordan', dashed: true, rationale: 'AI reconfirms aloud. Costs ~8s and admits the mishear.' }, onSelect),
      ]}
      readback="A fade and a beard trim with Marco — let me find you an evening slot."
      showKeys={showKeys} indent={indent}
    />
  )
}

/* ---- confirm booking ---- */

function EvidenceRow({ label, value, last }: { label: string; value: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-2 ${last ? '' : 'border-b border-border'}`}>
      <span className="w-[66px] shrink-0 text-[11.5px] text-text-muted">{label}</span>
      <span className="ml-auto text-[13px] font-semibold text-text">{value}</span>
    </div>
  )
}

export function ConfirmCheckpoint({ onSelect, showKeys = true, indent = false }: VariantProps) {
  return (
    <CheckpointSheet
      label="Confirm — you decide" category="Booking · ready to save" cost="slot held 3:42"
      claim={<>All five fields are certain. Confirming charges <b className="text-warning">$15</b> to Visa ···· 4242 and texts Jordan.</>}
      subline="Marco's 6:30 chair is held until 6:34. After that the slot returns to the online pool."
      evidence={
        <div className="rounded-[11px] bg-bg-app px-3.5">
          <EvidenceRow label="Services" value="Haircut + beard trim" />
          <EvidenceRow label="Stylist" value="Marco Diaz" />
          <EvidenceRow label="When" value="Tue 15 Sep · 6:30 PM · 45 min" />
          <EvidenceRow label="Price" value={<>$48 <span className="font-normal text-text-muted">· $15 deposit now</span></>} last />
        </div>
      }
      options={[
        pass({ key: 'Confirm · Enter', title: 'Confirm & book', pick: true, rationale: 'Card on file, 0 no-shows in 4 visits. Deposit is standard for a 45 min evening chair.' }, onSelect),
        pass({ key: 'Use this · 2', title: 'Book, skip deposit', rationale: 'Saves the same booking, charges nothing now. Full $48 due in the chair.' }, onSelect),
        pass({ key: 'Read back · 3', title: 'Read it back first', dashed: true, rationale: 'AI repeats all four fields and waits for a yes. Costs ~11s, nothing is saved yet.' }, onSelect),
      ]}
      readback="You're booked with Marco at 6:30 tomorrow. I've taken the $15 deposit — a text is on its way."
      showKeys={showKeys} indent={indent}
    />
  )
}

/* ---- payment declined ---- */

export function PaymentCheckpoint({ onSelect, showKeys = true, indent = false }: VariantProps) {
  return (
    <CheckpointSheet
      label="Payment — you decide" category="Deposit · declined" cost="dead air 0:06"
      claim={<>The deposit failed — issuer declined, code <b className="text-warning">51</b>, insufficient funds.</>}
      subline="The booking is written but unpaid, and the AI has told Jordan only “one moment”. It will not mention money again without you."
      evidence={
        <div className="rounded-[11px] border-l-[3px] border-warning-solid bg-bg-app px-3.5 py-3">
          <div className="mb-1.5 flex items-baseline gap-2.5">
            <span className="text-[13px] font-semibold text-text">Visa ···· 4242</span>
            <span className="text-[11.5px] text-text-muted">on file since Jun 14 · 3 successful charges</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 text-[11.5px] leading-[1.4] text-text-secondary">
            {[
              ['Attempted', '$15.00 · 6:31:04 PM'],
              ['Issuer says', 'Do not honour (51)'],
              ['Retry window', 'Soft decline · retryable'],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.11em] text-text-muted">{k}</div>
                {v}
              </div>
            ))}
          </div>
        </div>
      }
      options={[
        pass({ key: 'Waive · Enter', title: 'Waive the deposit', pick: true, rationale: '4 visits, 0 no-shows, regular of Marco’s. Keeps the slot and never raises the decline with him.' }, onSelect),
        pass({ key: 'Retry · 2', title: 'Retry the charge', rationale: 'Same card, same amount. Soft declines clear about 1 in 5. ~4s of silence.' }, onSelect),
        pass({ key: 'Ask · 3', title: 'Ask for another card', dashed: true, rationale: 'AI says the card was declined and reads digits back. Honest, and ~25s on the phone.' }, onSelect),
      ]}
      readback="All set for 6:30 with Marco — no deposit needed this time. See you tomorrow."
      showKeys={showKeys} indent={indent}
    />
  )
}

/* ---- hand-off (ink; the AI has no good options) ---- */

export function HandoffCheckpoint({ onSelect, showKeys = true, indent = false }: VariantProps) {
  return (
    <CheckpointSheet
      tone="ink"
      label="Agent needs a human" category="Scheduling · unavailable" cost="dead air 0:09"
      claim={<>The calendar is unreachable, so there is nothing for the AI to offer — <b className="text-warning">2 retries</b> failed.</>}
      subline="Service and stylist are certain. Time, price and deposit stay withheld until someone can read availability."
      evidence={
        <div className="rounded-[11px] border-l-[3px] border-text bg-bg-app px-3.5 py-3">
          <div className="mb-1.5 text-[12.5px] font-semibold text-text">Why the agent stopped</div>
          <p className="mb-2 text-[12.5px] leading-[1.5] text-[color:var(--text-secondary)]">I can't reach the scheduling service, so I can't pull availability or hold a slot. Two retries failed.</p>
          <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold text-text-secondary">
            {['HTTP 503', 'retried 6:31:02 · 6:31:09', 'last good read 14 min ago', '4 calls affected'].map((c) => (
              <span key={c} className="rounded-[7px] bg-bubble-caller px-2 py-0.5">{c}</span>
            ))}
          </div>
        </div>
      }
      options={[
        pass({ key: 'Take over · ⌘⇧T', title: 'Take over the call', pick: true, rationale: 'Jordan is mid-sentence and the paper book is at the desk. AI goes silent, keeps transcribing.' }, onSelect),
        pass({ key: 'Queue · 2', title: 'Promise a callback', rationale: 'AI takes the request, ends politely, and queues Jordan at the top of the desk list.' }, onSelect),
        pass({ key: 'Text link · 3', title: 'Send a booking link', dashed: true, rationale: 'Texts the self-serve page. Only works if the calendar returns — unverified right now.' }, onSelect),
      ]}
      readback="Let me put you with someone at the desk — one second."
      showKeys={showKeys} indent={indent}
    />
  )
}
