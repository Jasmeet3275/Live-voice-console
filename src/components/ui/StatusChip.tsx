import { Check, TriangleAlert, OctagonX, Pause } from 'lucide-react'
import { cn } from '@/lib/cn'

export type Status = 'running' | 'success' | 'warning' | 'error' | 'waiting'

const config: Record<
  Status,
  { label: string; cls: string; dot: string; Icon?: typeof Check }
> = {
  running: {
    label: 'Running',
    cls: 'bg-info-subtle text-info border-info-border',
    dot: 'bg-info',
  },
  success: {
    label: 'Done',
    cls: 'bg-success-subtle text-success border-success-border',
    dot: 'bg-success',
    Icon: Check,
  },
  warning: {
    label: 'Review',
    cls: 'bg-warning-subtle text-warning border-warning-border',
    dot: 'bg-warning-solid',
    Icon: TriangleAlert,
  },
  error: {
    label: 'Error',
    cls: 'bg-error-subtle text-error border-error-border',
    dot: 'bg-error',
    Icon: OctagonX,
  },
  waiting: {
    label: 'Needs you',
    cls: 'bg-waiting-subtle text-waiting border-waiting-border',
    dot: 'bg-waiting',
    Icon: Pause,
  },
}

export interface StatusChipProps {
  status: Status
  /** Override the default label text. */
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

/** Pill that communicates step/flow state. Color is never the only signal —
 *  every status also carries an icon (or an animated dot for `running`). */
export function StatusChip({
  status,
  label,
  size = 'md',
  className,
}: StatusChipProps) {
  const { label: defaultLabel, cls, dot, Icon } = config[status]
  const text = label ?? defaultLabel
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        cls,
        className,
      )}
    >
      {status === 'running' ? (
        <span
          className={cn(
            'h-2 w-2 rounded-full animate-[pulse-dot_1.6s_ease-in-out_infinite]',
            dot,
          )}
          aria-hidden
        />
      ) : (
        Icon && <Icon size={size === 'sm' ? 12 : 13} aria-hidden />
      )}
      {text}
    </span>
  )
}
