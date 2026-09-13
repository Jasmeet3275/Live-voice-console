import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { ButtonVariant } from './Button'

const gloss = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'

const variants: Record<ButtonVariant, string> = {
  primary: `bg-gradient-to-b from-accent to-accent-hover text-accent-fg ${gloss} shadow-e1 hover:brightness-[1.04] hover:shadow-e2`,
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-hover hover:border-border-strong hover:shadow-e1',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text',
  danger: `bg-gradient-to-b from-error to-error text-white ${gloss} shadow-e1 hover:brightness-[1.06] hover:shadow-e2`,
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — icon-only buttons must be labelled for screen readers. */
  'aria-label': string
  icon: ReactNode
  variant?: ButtonVariant
  size?: keyof typeof sizes
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, variant = 'ghost', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        'transition-[transform,box-shadow,background-color,border-color,filter] duration-150 active:scale-[0.96]',
        'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  ),
)
IconButton.displayName = 'IconButton'
