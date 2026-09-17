import { useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { StatusChip, Spinner, Pressable, type Status } from '@/components/atoms'
import { cn } from '@/lib/cn'

const stateColor: Record<Status, string> = {
  running: 'var(--info)',
  success: 'var(--success)',
  warning: 'var(--warning-solid)',
  error: 'var(--error)',
  waiting: 'var(--waiting)',
}

export interface StepShellProps {
  /** Human label, e.g. "Understanding request" (never a function name). */
  label: string
  icon?: ReactNode
  state: Status
  time?: string
  /** Optional short status text override on the chip. */
  statusLabel?: string
  /** The step's output / interaction. */
  children?: ReactNode
  /** Recovery actions row (shown for warning/error/waiting). */
  actions?: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  className?: string
}

/** One agent step — a deliberately QUIET strip (no border, no bordered "Done"
 *  card) so the machine's work never competes with the conversation. State is
 *  carried by the tinted icon + the status chip; children hold the step output,
 *  actions hold the recovery path. */
export function StepShell({
  label,
  icon,
  state,
  time,
  statusLabel,
  children,
  actions,
  collapsible = false,
  defaultOpen = true,
  className,
}: StepShellProps) {
  const [open, setOpen] = useState(defaultOpen)
  const showBody = (!collapsible || open) && (children || actions)

  const header = (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center"
        style={{ color: stateColor[state] }}
      >
        {state === 'running' ? <Spinner size={15} /> : icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-text-secondary">
        {label}
      </span>
      {time && <span className="tabular text-micro text-text-muted">{time}</span>}
      <StatusChip status={state} label={statusLabel} size="sm" />
      {collapsible && (
        <ChevronRight
          size={15}
          className={cn('text-text-muted transition-transform', open && 'rotate-90')}
        />
      )}
    </div>
  )

  return (
    <div className={cn('overflow-hidden rounded-[11px] bg-surface-2', className)}>
      {collapsible ? (
        <Pressable
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
        >
          {header}
        </Pressable>
      ) : (
        <div className="px-3 py-2.5">{header}</div>
      )}

      {showBody && (
        <div className="px-3 pb-3 pl-[calc(0.75rem+1.5rem+0.625rem)]">
          {children && <div className="text-caption text-text-secondary">{children}</div>}
          {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
    </div>
  )
}
