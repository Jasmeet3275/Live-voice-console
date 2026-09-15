import { Select as RadixSelect } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select…',
  disabled,
  'aria-label': ariaLabel,
  className,
}: {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  'aria-label'?: string
  className?: string
}) {
  return (
    <RadixSelect.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          'group inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm text-text transition-colors',
          'hover:bg-surface-2 data-[placeholder]:text-text-muted data-[state=open]:border-accent',
          'disabled:opacity-50 disabled:pointer-events-none',
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown size={16} className="text-text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-surface shadow-e3 animate-pop"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-3 text-sm text-text outline-none',
                  'data-[highlighted]:bg-surface-2 data-[disabled]:opacity-40 data-[disabled]:pointer-events-none',
                )}
              >
                <RadixSelect.ItemIndicator className="absolute left-2 inline-flex items-center">
                  <Check size={15} className="text-accent" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}
