import { CheckpointSheet, type CheckpointOption } from '@/components/domain/CheckpointSheet'
import { type Slot } from '@/components/domain/SlotCard'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * The slot-recommendation checkpoint — one CheckpointSheet, matching
 * design_handoff "Checkpoint · slot recommendation". The ranked openings
 * are the EVIDENCE the operator checks (best-fit teal, taken struck, alt);
 * the decision is what to OFFER the caller (offer the top pick / offer two /
 * ask how late). It never was a radio picker + Book button.
 * ------------------------------------------------------------------ */

/** "Tomorrow · 6:30 PM" → "6:30 PM"; "Thu · 6:30 PM" → "6:30 PM". */
const shortTime = (t: string) => t.split('·').pop()?.trim() ?? t
const firstName = (s: string) => s.split(' ')[0]

/** The best offerable slot (recommended, else first free) and a second free one. */
export function pickBestAlt(slots: Slot[]): { best?: Slot; alt?: Slot } {
  const free = slots.filter((s) => !s.unavailable)
  const best = free.find((s) => s.recommended) ?? free[0]
  const alt = free.find((s) => s.id !== best?.id)
  return { best, alt }
}

/** The ranked-openings evidence block: best-fit (teal), taken (struck), alt. */
export function SlotOpenings({ slots }: { slots: Slot[] }) {
  const day = slots.find((s) => !s.unavailable)?.time.split('·')[0].trim() ?? 'today'
  return (
    <div className="rounded-[11px] bg-bg-app px-3 py-3">
      <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-text-muted">Openings · {day}</div>
      <div className="flex flex-col gap-2">
        {slots.map((s) => <OpeningRow key={s.id} slot={s} />)}
      </div>
    </div>
  )
}

function OpeningRow({ slot }: { slot: Slot }) {
  if (slot.unavailable) {
    return (
      <div className="rounded-[11px] border border-border bg-surface px-3 py-2 opacity-60">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold tracking-[-0.02em] text-text-muted line-through">{shortTime(slot.time)}</span>
          <span className="text-[12px] font-semibold text-text-secondary">{firstName(slot.stylist)}</span>
          <span className="ml-auto text-[11px] font-semibold text-text-secondary">just taken</span>
        </div>
        <div className="mt-0.5 text-[11.5px] text-text-muted">Booked while you were deciding. Not offered to the caller.</div>
      </div>
    )
  }
  if (slot.recommended) {
    return (
      <div className="rounded-[11px] border-[1.5px] border-accent bg-accent-subtle px-3 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-bold tracking-[-0.025em] text-text">{shortTime(slot.time)}</span>
          <span className="text-[12.5px] font-semibold text-text-secondary">{firstName(slot.stylist)}</span>
          <span className="ml-auto rounded-[7px] bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-accent-fg">Best fit</span>
        </div>
        <div className="mt-0.5 text-[11.5px] text-success">{slot.duration} · {slot.price}</div>
        {slot.reasons.length > 0 && (
          <div className="mt-1.5 border-t border-accent-border pt-1.5 text-[11.5px] leading-[1.5] text-success">
            {slot.reasons.join('. ')}.
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="rounded-[11px] border border-border bg-surface px-3 py-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[16px] font-bold tracking-[-0.02em] text-text">{shortTime(slot.time)}</span>
        <span className="text-[12.5px] font-semibold text-text-secondary">{firstName(slot.stylist)}</span>
        <span className="ml-auto text-[11px] text-text-muted">alt</span>
      </div>
      <div className="mt-0.5 text-[11.5px] text-text-muted">
        {slot.duration} · {slot.price}{slot.reasons[0] ? ` · ${slot.reasons[0]}` : ''}
      </div>
    </div>
  )
}

/** The offer strategy for a slot checkpoint. */
export type OfferMode = 'one' | 'both' | 'ask'

export interface SlotOptionSpec {
  mode: OfferMode
  hotkey: 'Enter' | '2' | '3'
  key: string
  title: string
  rationale: string
  pick?: boolean
  dashed?: boolean
}

/** The 2–3 offer decision cards (AI's pick first, dashed "ask" last). */
export function slotOptionSpecs(best: Slot, alt?: Slot): SlotOptionSpec[] {
  const specs: SlotOptionSpec[] = [
    { mode: 'one', hotkey: 'Enter', key: 'Offer · Enter', title: `Offer ${shortTime(best.time)} only`, pick: true, rationale: 'One clear option closes fastest — callers usually take the first offer.' },
  ]
  if (alt) {
    specs.push({ mode: 'both', hotkey: '2', key: 'Offer both · 2', title: `Offer ${shortTime(best.time)} and ${shortTime(alt.time)}`, rationale: 'Gives a choice and holds both briefly. Adds a few seconds and risks the later one.' })
  }
  specs.push({ mode: 'ask', hotkey: alt ? '3' : '2', key: `Ask · ${alt ? 3 : 2}`, title: 'Ask how late they can go', dashed: true, rationale: 'No times released yet. Useful if you would rather keep the prime slot for a walk-in.' })
  return specs
}

/** Shared claim/evidence/readback for the slot checkpoint — used live and in the demo. */
export function buildSlotDecision(slots: Slot[]) {
  const { best, alt } = pickBestAlt(slots)
  if (!best) return null
  const first = firstName(best.stylist)
  return {
    best,
    alt,
    label: 'Slot — you decide',
    category: 'Availability · what to offer',
    claim: <>The best evening opening is a {best.duration} block with {first} — <b className="text-warning">{shortTime(best.time)}</b>.</>,
    subline: 'The AI reads out only what you release here. Availability is live, so the longer this sits the more likely a slot goes.',
    evidence: <SlotOpenings slots={slots} />,
    readback: `I have ${shortTime(best.time)} with ${first} — that's a ${best.services.join(' and ').toLowerCase()}. Shall I take it?`,
    specs: slotOptionSpecs(best, alt),
  }
}

/** Demo/reference slot checkpoint (used by ?demo). The live app builds the same
 *  sheet in InlineCheckpoint so it can dispatch real commands + own the keyboard. */
export function InlineSlotPick({
  slots, onOffer, showKeys = true, indent = false, className,
}: {
  slots: Slot[]
  onOffer: (slotId: string, mode: OfferMode) => void
  showKeys?: boolean
  indent?: boolean
  className?: string
}) {
  const d = buildSlotDecision(slots)
  if (!d) return null
  const options: CheckpointOption[] = d.specs.map((sp) => ({
    key: sp.key, title: sp.title, rationale: sp.rationale, pick: sp.pick, dashed: sp.dashed,
    onSelect: () => onOffer(d.best.id, sp.mode),
  }))
  return (
    <CheckpointSheet
      label={d.label} category={d.category}
      claim={d.claim} subline={d.subline} evidence={d.evidence}
      options={options} readback={d.readback}
      showKeys={showKeys} indent={indent} className={cn(className)}
    />
  )
}
