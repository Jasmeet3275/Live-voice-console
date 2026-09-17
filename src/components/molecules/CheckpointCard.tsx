import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * CheckpointCard — the shared inline shell for every operator input in
 * the thread (never a modal). Amber for a decision between good options,
 * ink for a failure the AI can't route around, red for hard danger.
 * Header, focused: dot · what needs you · elapsed cost of waiting.
 * ------------------------------------------------------------------ */

export type CheckpointTone = 'hold' | 'ink' | 'danger'

const TONES: Record<CheckpointTone, { card: string; head: string; dot: string; text: string; sub: string }> = {
  hold: {
    card: 'border-warning-border shadow-[0_10px_26px_-14px_rgba(176,117,20,0.5)] dark:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.8)]',
    head: 'border-warning-border bg-warning-subtle',
    dot: 'bg-warning-solid',
    text: 'text-warning',
    sub: 'text-warning',
  },
  danger: {
    card: 'border-error-border shadow-[0_10px_26px_-14px_rgba(192,57,43,0.4)] dark:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.8)]',
    head: 'border-error-border bg-error-subtle',
    dot: 'bg-error',
    text: 'text-error',
    sub: 'text-error',
  },
  ink: {
    card: 'border-text shadow-[0_12px_28px_-16px_rgba(34,31,28,0.55)] dark:shadow-[0_14px_30px_-16px_rgba(0,0,0,0.8)]',
    head: 'border-transparent bg-text',
    dot: 'bg-white',
    text: 'text-text-inverse',
    sub: 'text-text-inverse/70',
  },
}

export function CheckpointCard({
  label,
  cost,
  tone = 'hold',
  indent = true,
  children,
  className,
}: {
  /** Uppercase eyebrow — what needs you, e.g. "Held — you decide". */
  label: string
  /** Elapsed cost of waiting, verbatim, e.g. "dead air 0:12" or "slot held 3:42". */
  cost?: string
  tone?: CheckpointTone
  indent?: boolean
  children: React.ReactNode
  className?: string
}) {
  const t = TONES[tone]
  return (
    <div className={cn('animate-rise overflow-hidden rounded-[15px] border-[1.5px] bg-surface', t.card, indent && 'ml-[37px]', className)}>
      <div className={cn('flex items-center gap-2.5 border-b px-4 py-2.5', t.head)}>
        <span className={cn('h-2 w-2 shrink-0 rounded-full animate-breathe', t.dot)} />
        <span className={cn('min-w-0 shrink-0 text-[10px] font-bold uppercase tracking-[0.11em]', t.text)}>{label}</span>
        {cost && <span className={cn('ml-auto shrink-0 text-[11.5px]', t.sub)}>{cost}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}
