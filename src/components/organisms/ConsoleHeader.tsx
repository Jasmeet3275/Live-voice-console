import { Scissors } from 'lucide-react'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * ConsoleHeader + its pieces. Matches design_handoff / Screen 1 top bar.
 * ------------------------------------------------------------------ */

export function BrandLock({ appName = 'Zoca Front Desk', tenant = 'Luxe Salon' }: { appName?: string; tenant?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-lg bg-accent text-accent-fg">
        <Scissors size={12} />
      </span>
      <span className="text-[14.5px] font-bold tracking-[-0.015em] text-text">{appName}</span>
      <span className="text-[13px] text-text-muted">{tenant}</span>
    </div>
  )
}

export function RecordingPill({ notified = true }: { notified?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border-strong py-1 pl-2.5 pr-3">
      <span className="h-[7px] w-[7px] animate-breathe rounded-full bg-error" />
      <span className="text-[11.5px] font-semibold tracking-[0.02em] text-text-secondary">Recording</span>
      {notified && (
        <>
          <span className="h-3 w-px bg-border-strong" />
          <span className="text-[11.5px] text-text-muted">caller notified</span>
        </>
      )}
    </div>
  )
}

export type CallState = 'listening' | 'held' | 'takenOver' | 'resolved'

export function StatusPill({ state, timer }: { state: Exclude<CallState, 'listening'>; timer?: string }) {
  if (state === 'takenOver') {
    return (
      <div className="flex items-center gap-2 rounded-full bg-text px-3 py-1">
        <span className="h-[7px] w-[7px] rounded-full bg-white" />
        <span className="text-[12.5px] font-semibold text-text-inverse">You have the line — AI muted</span>
      </div>
    )
  }
  if (state === 'resolved') {
    return (
      <div className="flex items-center gap-2 rounded-full border border-accent-border bg-accent-subtle px-3 py-1">
        <span className="h-[7px] w-[7px] rounded-full bg-accent" />
        <span className="text-[12.5px] font-semibold text-success">Corrected — booking derived</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-full border border-warning-border bg-warning-subtle px-3 py-1">
      <span className="h-[7px] w-[7px] animate-breathe rounded-full bg-warning-solid" />
      <span className="text-[12.5px] font-semibold text-warning">AI stalled — waiting on you</span>
      {timer && <span className="tabular text-[12px] font-bold text-warning">{timer}</span>}
    </div>
  )
}

export function ElapsedClock({ clock }: { clock: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-[0.11em] text-text-muted">Elapsed</div>
      <div className="tabular text-[13.5px] font-bold tracking-[-0.02em] text-text">{clock}</div>
    </div>
  )
}

export function OperatorChip({ name }: { name: string }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-hover text-[11px] font-semibold text-text-muted">{initials}</span>
      <span className="text-[12.5px] font-medium text-text-secondary">{name.split(' ')[0]}</span>
    </div>
  )
}

export function ConsoleHeader({
  state = 'listening',
  clock = '0:00',
  deadAir,
  operator = 'Jasmeet',
  right,
  className,
}: {
  state?: CallState
  clock?: string
  deadAir?: string
  operator?: string
  /** Extra controls on the right (e.g. page tabs). */
  right?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex h-14 shrink-0 items-center gap-3.5 border-b border-border bg-surface px-5', className)}>
      <BrandLock />
      <RecordingPill />
      {state !== 'listening' && <StatusPill state={state} timer={deadAir} />}
      <div className="ml-auto flex items-center gap-3.5">
        {right}
        <ElapsedClock clock={clock} />
        <span className="h-6 w-px bg-border" />
        <OperatorChip name={operator} />
      </div>
    </header>
  )
}
