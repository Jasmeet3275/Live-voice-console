import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { ButtonVariant } from './Button'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent border border-accent text-accent-fg hover:bg-accent-hover hover:border-accent-hover',
  secondary:
    'bg-surface border border-border-strong text-text hover:bg-surface-2',
  ghost: 'bg-transparent border border-transparent text-text-secondary hover:bg-surface-2 hover:text-text',
  danger: 'bg-error border border-error text-white hover:brightness-[0.95]',
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
