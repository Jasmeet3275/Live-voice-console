import { Avatar as RadixAvatar } from 'radix-ui'
import { cn } from '@/lib/cn'

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string
  src?: string
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <RadixAvatar.Root
      className={cn(
        'inline-flex select-none items-center justify-center overflow-hidden rounded-full bg-accent-subtle',
        sizes[size],
        className,
      )}
    >
      {src && (
        <RadixAvatar.Image
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      )}
      <RadixAvatar.Fallback className="font-semibold text-accent">
        {initials(name)}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  )
}
