import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Soft shadow in addition to the border. */
  raised?: boolean
  padded?: boolean
}

export function Card({
  className,
  raised = false,
  padded = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-surface',
        raised && 'shadow-e1',
        padded && 'p-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="text-title font-semibold text-text truncate">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
