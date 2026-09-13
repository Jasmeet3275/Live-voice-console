import { Star, Clock, Check, Sparkles, CalendarX } from 'lucide-react'
import { Avatar, Badge, Pressable } from '@/components/ui'
import { cn } from '@/lib/cn'

export interface Slot {
  id: string
  /** Human time, e.g. "Tomorrow · 6:30 PM". */
  time: string
  stylist: string
  stylistRating?: number
  duration: string // "45 min"
  price: string // "$48"
  services: string[]
  /** Plain-language reasons this slot fits — the explainability. */
  reasons: string[]
  /** Top pick. */
  recommended?: boolean
  /** Slot was taken while deciding (stale availability). */
  unavailable?: boolean
}

/** A recommended booking slot. Shows the fit rationale rather than a black-box
 *  answer, and handles the "taken while deciding" state. */
export function SlotCard({
  slot,
  selected = false,
  onSelect,
  className,
  ...rest
}: {
  slot: Slot
  selected?: boolean
  onSelect?: (id: string) => void
  className?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect' | 'slot'>) {
  const disabled = slot.unavailable
  const interactive = Boolean(onSelect) && !disabled

  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => interactive && onSelect?.(slot.id)}
      {...rest}
      className={cn(
        'relative w-full rounded-lg border bg-surface p-3 text-left transition-all',
        interactive && 'hover:border-border-strong hover:shadow-e1 active:scale-[0.995]',
        selected ? 'border-accent ring-1 ring-accent' : 'border-border',
        disabled && 'opacity-60',
        className,
      )}
    >
      {/* Top: time + badges + price */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-body-strong font-semibold text-text',
                disabled && 'line-through',
              )}
            >
              {slot.time}
            </span>
            {slot.recommended && !disabled && (
              <Badge tone="accent">Best fit</Badge>
            )}
            {disabled && (
              <Badge tone="error">
                <CalendarX size={11} /> Just booked
              </Badge>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-caption text-text-muted">
            <Clock size={12} />
            <span className="tabular">{slot.duration}</span>
            <span>·</span>
            <span className="tabular font-medium text-text">{slot.price}</span>
          </p>
        </div>

        {/* Selection indicator */}
        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
            selected
              ? 'border-accent bg-accent text-accent-fg'
              : 'border-border-strong',
          )}
        >
          {selected && <Check size={13} />}
        </span>
      </div>

      {/* Stylist */}
      <div className="mt-2.5 flex items-center gap-2">
        <Avatar name={slot.stylist} size="sm" />
        <span className="text-caption font-medium text-text">{slot.stylist}</span>
        {typeof slot.stylistRating === 'number' && (
          <Badge tone="info">
            <Star size={11} className="fill-current" />
            {slot.stylistRating.toFixed(1)} on fades
          </Badge>
        )}
      </div>

      {/* Services */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {slot.services.map((s) => (
          <Badge key={s} tone="neutral">
            {s}
          </Badge>
        ))}
      </div>

      {/* Why this fits */}
      {slot.reasons.length > 0 && (
        <div className="mt-2.5 rounded-md bg-accent-subtle/60 px-2.5 py-2">
          <p className="mb-1 flex items-center gap-1.5 text-micro font-semibold uppercase tracking-wide text-accent">
            <Sparkles size={12} /> Why this fits
          </p>
          <ul className="flex flex-col gap-1">
            {slot.reasons.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-caption text-text-secondary"
              >
                <Check size={13} className="mt-0.5 shrink-0 text-accent" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Pressable>
  )
}
