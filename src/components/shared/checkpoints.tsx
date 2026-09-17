import { CheckpointSheet, type CheckpointOption } from '@/components/organisms/CheckpointSheet'

/* ------------------------------------------------------------------ *
 * The checkpoint family — one CheckpointSheet, four variants, focused.
 * Each supplies its question, one line of context, and single-line
 * decision rows; the frame is shared. Matches design_handoff
 * "Checkpoint components - focused".
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
      label="Held — you decide" cost="dead air 0:12"
      claim={<>One word decides the booking, and it came through at <b className="text-warning">38%</b>. Which is it?</>}
      subline="The AI is holding the line with “Let me check that for you.”"
      options={[
        pass({ key: 'Accept · Enter', title: '“fades”', note: 'as transcribed', pick: true }, onSelect),
        pass({ key: 'Use this · 2', title: '“facials”', note: 'swap this in' }, onSelect),
        pass({ key: 'Ask · 3', title: 'Ask Jordan', note: 'reconfirms aloud · ~8s', dashed: true }, onSelect),
      ]}
      showKeys={showKeys} indent={indent}
    />
  )
}

/* ---- confirm booking ---- */

export function ConfirmCheckpoint({ onSelect, showKeys = true, indent = false }: VariantProps) {
  return (
    <CheckpointSheet
      label="Confirm — you decide" cost="slot held 3:42"
      claim={<>Save the booking?</>}
      subline="Marco · Tue 6:30 PM · haircut + beard trim · $48 · $15 deposit now"
      options={[
        pass({ key: 'Confirm · Enter', title: 'Confirm & book', note: 'card on file · 0 no-shows', pick: true }, onSelect),
        pass({ key: 'Use this · 2', title: 'Book, skip deposit', note: 'full $48 in the chair' }, onSelect),
        pass({ key: 'Read back · 3', title: 'Read it back first', note: 'saves nothing yet · ~11s', dashed: true }, onSelect),
      ]}
      showKeys={showKeys} indent={indent}
    />
  )
}

/* ---- payment declined ---- */

export function PaymentCheckpoint({ onSelect, showKeys = true, indent = false }: VariantProps) {
  return (
    <CheckpointSheet
      label="Payment — you decide" cost="dead air 0:06"
      claim={<>The <b className="text-warning">$15</b> deposit was declined. What now?</>}
      subline="Visa ···· 4242 · code 51, soft decline · booking saved, unpaid"
      options={[
        pass({ key: 'Waive · Enter', title: 'Waive the deposit', note: '0 no-shows in 4 visits', pick: true }, onSelect),
        pass({ key: 'Retry · 2', title: 'Retry the charge', note: 'same card · ~4s of silence' }, onSelect),
        pass({ key: 'Ask · 3', title: 'Ask for another card', note: 'tells Jordan it declined · ~25s', dashed: true }, onSelect),
      ]}
      showKeys={showKeys} indent={indent}
    />
  )
}

/* ---- hand-off (ink; the AI has no good options) ---- */

export function HandoffCheckpoint({ onSelect, showKeys = true, indent = false }: VariantProps) {
  return (
    <CheckpointSheet
      tone="ink"
      label="Agent needs a human" cost="dead air 0:09"
      claim={<>Scheduling service error — <b className="text-warning">HTTP 503</b></>}
      subline="Calendar unreachable, 2 retries failed. No availability to offer, and Jordan is mid-sentence."
      options={[
        pass({ key: 'Take over · ⌘⇧T', title: 'Take over the call', note: 'AI goes silent, keeps transcribing', pick: true }, onSelect),
        pass({ key: 'Queue · 2', title: 'Promise a callback', note: 'tops the desk queue' }, onSelect),
        pass({ key: 'Text link · 3', title: 'Send a booking link', note: 'needs the calendar back', dashed: true }, onSelect),
      ]}
      showKeys={showKeys} indent={indent}
    />
  )
}
