import { Star, Clock, Check } from 'lucide-react'
import { Avatar, Badge, Pressable } from '@/components/atoms'
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
  /** Top pick — shown with a teal border + "Best fit" badge (not the selected fill). */
  recommended?: boolean
  /** Slot was taken while deciding (stale availability) — struck neutral, never red. */
  unavailable?: boolean
}

/** A recommended booking slot. Selection (teal fill + check) is a distinct signal
 *  from recommendation (teal border + "Best fit"), so only the chosen card is
 *  filled. A slot taken while deciding is struck NEUTRAL — stale, not dangerous. */
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

  // ---- lost / just-taken (compact, struck neutral) ----
  if (disabled) {
    return (
      <Pressable
        role="radio"
        aria-checked={false}
        aria-disabled
        disabled
        {...rest}
        className={cn('w-full rounded-[13px] bg-bg-app p-3.5 text-left opacity-60', className)}
      >
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold tracking-[-0.02em] text-text-muted line-through">{slot.time}</span>
          <span className="text-[12px] font-semibold text-text-secondary">{slot.stylist.split(' ')[0]}</span>
          <span className="ml-auto text-[11px] font-semibold text-text-secondary">just taken</span>
        </div>
        <p className="mt-1 text-[11.5px] text-text-muted">Booked while you were deciding. Not offered to the caller.</p>
      </Pressable>
    )
  }

  return (
    <Pressable
      role="radio"
      aria-checked={selected}
      onClick={() => interactive && onSelect?.(slot.id)}
      {...rest}
      className={cn(
        'relative w-full rounded-[13px] border p-3.5 text-left transition-all',
        interactive && 'hover:-translate-y-px hover:shadow-e1',
        selected
          ? 'border-[1.5px] border-accent bg-accent-subtle'
          : slot.recommended
            ? 'border-[1.5px] border-accent bg-surface'
            : 'border-border-strong bg-surface',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-bold tracking-[-0.025em] text-text">{slot.time}</span>
            {slot.recommended && <Badge tone="accent">Best fit</Badge>}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-caption text-text-muted">
            <Clock size={12} />
            <span className="tabular">{slot.duration}</span>
            <span>·</span>
            <span className="tabular font-medium text-text">{slot.price}</span>
          </p>
        </div>

        <span
          aria-hidden
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong',
          )}
        >
          {selected && <Check size={13} />}
        </span>
      </div>

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

      <div className="mt-2 flex flex-wrap gap-1.5">
        {slot.services.map((s) => (
          <Badge key={s} tone="neutral">{s}</Badge>
        ))}
      </div>

      {slot.reasons.length > 0 && (
        <div
          className={cn(
            'mt-2.5 flex flex-col gap-1 border-t pt-2.5 text-[11.5px] leading-[1.5]',
            selected || slot.recommended ? 'border-accent-border text-success' : 'border-border text-text-secondary',
          )}
        >
          {slot.reasons.map((r, i) => <span key={i}>{r}</span>)}
        </div>
      )}
    </Pressable>
  )
}
