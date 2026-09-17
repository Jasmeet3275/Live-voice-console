import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

// Border-first, flat fills (no gradient/gloss) — tactile press via translate.
const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-md border ' +
  'transition-[transform,background-color,border-color,color,filter] duration-150 ease-out ' +
  'select-none whitespace-nowrap active:translate-y-px ' +
  'disabled:opacity-50 disabled:pointer-events-none disabled:active:translate-y-0'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent border-accent text-accent-fg shadow-e1 hover:bg-accent-hover hover:border-accent-hover hover:-translate-y-px hover:shadow-e2',
  secondary:
    'bg-surface border-border-strong text-text hover:bg-surface-2 hover:border-border-strong',
  ghost: 'bg-transparent border-transparent text-text-secondary hover:bg-surface-2 hover:text-text',
  danger: 'bg-error border-error text-white shadow-e1 hover:brightness-[0.97] hover:-translate-y-px',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
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
