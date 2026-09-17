import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** A keycap chip for showing keyboard shortcuts inline. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'tabular inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-border-strong bg-surface-2 px-1.5 py-0.5 text-micro font-medium text-text-secondary',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
