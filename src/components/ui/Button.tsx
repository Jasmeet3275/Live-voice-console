import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md ' +
  'transition-[transform,box-shadow,background-color,border-color,filter] duration-150 ' +
  'select-none whitespace-nowrap active:scale-[0.98] ' +
  'disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100'

// Subtle top-gloss highlight for filled buttons.
const gloss = 'shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'

const variants: Record<ButtonVariant, string> = {
  primary: `bg-gradient-to-b from-accent to-accent-hover text-accent-fg ${gloss} shadow-e1 hover:brightness-[1.04] hover:shadow-e2`,
  secondary:
    'bg-surface text-text border border-border hover:bg-surface-hover hover:border-border-strong hover:shadow-e1',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text',
  danger: `bg-gradient-to-b from-error to-error text-white ${gloss} shadow-e1 hover:brightness-[1.06] hover:shadow-e2`,
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loading?: boolean
  /** Render as the child element (Radix Slot) instead of a <button>. */
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      loading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot.Root : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </Comp>
    )
  },
)
Button.displayName = 'Button'
