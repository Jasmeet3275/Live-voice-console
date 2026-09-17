import { useRef, type ReactNode } from 'react'
import { Dialog as RadixDialog } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { IconButton } from '@/components/atoms/IconButton'

export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  className?: string
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-fade" />
        <RadixDialog.Content
          ref={contentRef}
          onOpenAutoFocus={(e) => {
            // Prefer a control marked data-autofocus (e.g. the primary action)
            // over Radix's default of the first tabbable (the ✕ close button).
            const target = contentRef.current?.querySelector<HTMLElement>('[data-autofocus]')
            if (target) {
              e.preventDefault()
              target.focus()
            }
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-surface p-5 shadow-e3 animate-pop',
            'focus-visible:outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <RadixDialog.Title className="text-title font-semibold text-text">
                {title}
              </RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-caption text-text-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <IconButton aria-label="Close dialog" icon={<X size={18} />} size="sm" />
            </RadixDialog.Close>
          </div>
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

export const DialogClose = RadixDialog.Close
