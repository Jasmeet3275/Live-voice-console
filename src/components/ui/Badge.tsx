import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone =
  | 'neutral'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-text-secondary border-border',
  accent: 'bg-accent-subtle text-accent border-accent-border',
  info: 'bg-info-subtle text-info border-info-border',
  success: 'bg-success-subtle text-success border-success-border',
  warning: 'bg-warning-subtle text-warning border-warning-border',
  error: 'bg-error-subtle text-error border-error-border',
}

export interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
