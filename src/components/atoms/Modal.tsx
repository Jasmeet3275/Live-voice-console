import { useRef, type ReactNode } from 'react'
import { Dialog as RadixDialog } from 'radix-ui'
import { cn } from '@/lib/cn'

export interface ModalProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
  className?: string
  /** Accessible name when the content has no `<Modal.Title>` (rare — prefer a Title). */
  label?: string
  /** id of the element describing the dialog (wires `aria-describedby`). */
  describedBy?: string
  /** Allow Escape / outside-click to dismiss (default true). Set false for a
   *  blocking checkpoint and handle Escape via `onEscapeKeyDown` instead. */
  dismissable?: boolean
  onEscapeKeyDown?: (e: KeyboardEvent) => void
}

/**
 * Accessible modal built on Radix Dialog — gives focus trapping, Escape, focus
 * restoration, and scroll-lock for free (the hand-rolled overlays did none of
 * these). Initial focus targets the element marked `data-autofocus`, else the
 * first tabbable node.
 *
 * `Modal.Title` / `Modal.Description` are re-exported Radix parts; include a
 * `<Modal.Title>` (visually hidden if needed) so the dialog has an accessible name.
 */
export function Modal({
  open,
  onOpenChange,
  children,
  className,
  label,
  describedBy,
  dismissable = true,
  onEscapeKeyDown,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm animate-fade" />
        <RadixDialog.Content
          ref={contentRef}
          aria-label={label}
          aria-describedby={describedBy}
          onOpenAutoFocus={(e) => {
            const target = contentRef.current?.querySelector<HTMLElement>('[data-autofocus]')
            if (target) {
              e.preventDefault()
              target.focus()
            }
          }}
          onEscapeKeyDown={(e) => {
            if (onEscapeKeyDown) onEscapeKeyDown(e)
            if (!dismissable) e.preventDefault()
          }}
          onPointerDownOutside={(e) => {
            if (!dismissable) e.preventDefault()
          }}
          onInteractOutside={(e) => {
            if (!dismissable) e.preventDefault()
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto',
            'rounded-2xl border border-border bg-surface shadow-e3 animate-pop focus-visible:outline-none',
            className,
          )}
        >
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

Modal.Title = RadixDialog.Title
Modal.Description = RadixDialog.Description
Modal.Close = RadixDialog.Close
