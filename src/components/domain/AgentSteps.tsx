import { useState } from 'react'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * AgentSteps — the collapsible tool-call trace, rendered as a QUIET
 * strip (never a bordered "Done" card that competes with the speech).
 * Matches design_handoff / Screen 3 "Agent steps" group.
 * ------------------------------------------------------------------ */

export interface AgentStepRow {
  /** Tool name, e.g. "read_services". */
  name: string
  /** What it found. */
  detail: string
  /** Latency label, e.g. "180ms". */
  ms: string
}

export function AgentSteps({
  summary,
  steps,
  defaultOpen = true,
  indent = false,
  className,
}: {
  /** Group summary, e.g. "availability · 3 calls, 1.4s". */
  summary: string
  steps: AgentStepRow[]
  defaultOpen?: boolean
  /** Indent to align under a speaker bubble (37px), as in the thread. */
  indent?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('rounded-[11px] bg-surface-2 px-[13px] py-[9px]', indent && 'ml-[37px]', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn('flex w-full items-center gap-2.5 text-left', open && 'border-b border-[rgba(34,31,28,0.07)] pb-1.5')}
      >
        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Agent steps</span>
        <span className="text-[11.5px] text-text-muted">{summary}</span>
        <span className="ml-auto text-[11px] text-text-muted">{open ? 'hide' : 'show'}</span>
      </button>
      {open && (
        <div>
          {steps.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5 py-[7px]">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-border-strong" />
              <span className="shrink-0 text-[12px] font-semibold text-text-2">{s.name}</span>
              <span className="min-w-0 flex-1 truncate text-[11.5px] text-text-muted">{s.detail}</span>
              <span className="tabular shrink-0 text-[11px] text-text-muted">{s.ms}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
