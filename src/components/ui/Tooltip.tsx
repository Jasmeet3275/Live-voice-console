import type { ReactNode } from 'react'
import { Tooltip as RadixTooltip } from 'radix-ui'
import { cn } from '@/lib/cn'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <RadixTooltip.Provider delayDuration={300}>
      {children}
    </RadixTooltip.Provider>
  )
}

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-50 max-w-xs rounded-md bg-text px-2.5 py-1.5 text-xs font-medium text-surface shadow-e2',
            'animate-pop',
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-text" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
