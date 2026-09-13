import { useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { StatusChip, Spinner, Pressable, type Status } from '@/components/ui'
import { cn } from '@/lib/cn'

const stateStyle: Record<Status, { color: string; subtle: string }> = {
  running: { color: 'var(--info)', subtle: 'var(--info-subtle)' },
  success: { color: 'var(--success)', subtle: 'var(--success-subtle)' },
  warning: { color: 'var(--warning-solid)', subtle: 'var(--warning-subtle)' },
  error: { color: 'var(--error)', subtle: 'var(--error-subtle)' },
  waiting: { color: 'var(--waiting)', subtle: 'var(--waiting-subtle)' },
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

/** One agent step in the right-panel trace. A left stripe + icon carry the
 *  state color; the chip names it; children hold the step's output; actions
 *  hold the recovery path. Uniform shell = every state reads the same way. */
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
  const s = stateStyle[state]
  const showBody = (!collapsible || open) && (children || actions)

  const header = (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ background: s.subtle, color: s.color }}
      >
        {state === 'running' ? <Spinner size={15} /> : icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-body-strong font-medium text-text">
        {label}
      </span>
      {time && (
        <span className="tabular text-micro text-text-muted">{time}</span>
      )}
      <StatusChip status={state} label={statusLabel} size="sm" />
      {collapsible && (
        <ChevronRight
          size={16}
          className={cn(
            'text-text-muted transition-transform',
            open && 'rotate-90',
          )}
        />
      )}
    </div>
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-surface',
        className,
      )}
    >
      {/* State stripe */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: s.color }}
      />

      {collapsible ? (
        <Pressable
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center px-3 py-2.5 text-left hover:bg-surface-hover"
        >
          {header}
        </Pressable>
      ) : (
        <div className="px-3 py-2.5">{header}</div>
      )}

      {showBody && (
        <div className="px-3 pb-3 pl-[calc(0.75rem+1.75rem+0.625rem)]">
          {children && (
            <div className="text-caption text-text-secondary">{children}</div>
          )}
          {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
    </div>
  )
}
