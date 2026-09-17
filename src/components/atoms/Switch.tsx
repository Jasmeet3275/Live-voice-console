import { Switch as RadixSwitch } from 'radix-ui'
import { cn } from '@/lib/cn'

export interface SwitchProps {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  'aria-label'?: string
  className?: string
}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <RadixSwitch.Root
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full border border-transparent transition-colors duration-200',
        'bg-border-strong data-[state=checked]:bg-accent',
        'disabled:opacity-50 disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          'block h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out',
          'translate-x-0.5 data-[state=checked]:translate-x-[18px]',
        )}
      />
    </RadixSwitch.Root>
  )
}
