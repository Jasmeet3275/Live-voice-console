import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/cn'

export interface PressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Render as the child element (Radix Slot) instead of a <button>. */
  asChild?: boolean
  /** Subtle press-scale feedback (opt-in). Off by default so Pressable stays
   *  visually neutral; enable it for tap-targets that benefit from the cue. */
  pressFeedback?: boolean
}

/**
 * Unstyled interactive base — the *semantics* of a pressable element with **zero
 * visual opinion** (no size, radius, colour, or fill).
 *
 * It provides what every clickable element should share: a real `<button>` with
 * `type="button"` (so it never accidentally submits a form), consistent
 * `disabled` handling, optional press feedback, and `asChild` composition.
 * Keyboard focus rings come from the global `:focus-visible` rule (index.css).
 *
 * Use this for interactive **containers** that are not action buttons —
 * disclosure rows, selectable cards, toggles, themed controls. For standard
 * action buttons use `<Button>` / `<IconButton>`, which carry the button look.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  ({ className, asChild = false, pressFeedback = false, type, children, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : 'button'
    return (
      <Comp
        ref={ref}
        // Only a real <button> takes `type`; a Slot child supplies its own element.
        {...(asChild ? {} : { type: type ?? 'button' })}
        className={cn(
          'cursor-pointer select-none transition-[transform,filter] duration-150',
          pressFeedback && 'active:scale-[0.98]',
          'disabled:cursor-default disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)
Pressable.displayName = 'Pressable'
