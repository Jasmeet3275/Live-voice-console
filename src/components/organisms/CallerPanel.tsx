import { useState } from 'react'
import { Phone, Scissors, Clock, CalendarDays, StickyNote } from 'lucide-react'
import { Avatar, Badge, Divider, Tooltip, Pressable } from '@/components/ui'
import { cn } from '@/lib/cn'

export interface PastVisit {
  date: string
  service: string
  stylist: string
}

export interface Caller {
  name: string
  /** Pre-masked for privacy, e.g. "+1 (415) •••-4821". */
  phoneMasked: string
  status: 'returning' | 'new' | 'vip'
  visitsCount?: number
  lastVisit?: string
  preferredStylist?: string
  usualService?: string
  visits?: PastVisit[]
  note?: string
}

const statusBadge = {
  returning: { tone: 'accent', label: 'Returning' },
  vip: { tone: 'warning', label: 'VIP' },
  new: { tone: 'neutral', label: 'New guest' },
} as const

function Kv({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-text-muted">{icon}</span>
      <span className="text-micro text-text-muted">{label}</span>
      <span className="ml-auto truncate text-micro font-medium text-text">{value}</span>
    </div>
  )
}

/** A circular avatar toggle that opens/closes the caller details from the same
 *  point. Details expand below the avatar and float over the chat. */
export function CallerPanel({ caller, className }: { caller: Caller; className?: string }) {
  const [open, setOpen] = useState(false)
  const badge = statusBadge[caller.status]

  return (
    <div className={className}>
      <Tooltip content={open ? 'Hide caller details' : `${caller.name} · ${badge.label} — view details`}>
        <Pressable
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Hide caller details' : `Show caller details for ${caller.name}`}
          className={cn(
            'rounded-full shadow-e2 ring-2 transition-transform hover:scale-105',
            open ? 'ring-accent' : 'ring-surface',
          )}
        >
          <Avatar name={caller.name} size="md" />
        </Pressable>
      </Tooltip>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[min(340px,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-surface/95 shadow-e3 backdrop-blur">
          <div className="flex items-center gap-2 p-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="truncate text-body-strong font-semibold text-text">{caller.name}</span>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>
              <p className="flex items-center gap-1 text-micro text-text-muted">
                <Phone size={10} />
                <span className="tabular">{caller.phoneMasked}</span>
              </p>
            </div>
          </div>

          {caller.status !== 'new' && (
            <>
              <Divider />
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-2.5">
                <div className="flex flex-col gap-1.5">
                  {caller.preferredStylist && <Kv icon={<Scissors size={12} />} label="Stylist" value={caller.preferredStylist} />}
                  {caller.usualService && <Kv icon={<Scissors size={12} />} label="Usual" value={caller.usualService} />}
                  {caller.lastVisit && <Kv icon={<Clock size={12} />} label="Last" value={caller.lastVisit} />}
                  {typeof caller.visitsCount === 'number' && <Kv icon={<CalendarDays size={12} />} label="Visits" value={String(caller.visitsCount)} />}
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-micro font-medium uppercase tracking-wide text-text-muted">Recent</p>
                  <ul className="flex flex-col gap-1">
                    {caller.visits?.slice(0, 3).map((v, i) => (
                      <li key={i} className="truncate text-micro text-text-secondary">
                        <span className="tabular text-text-muted">{v.date}</span> · {v.service}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {caller.note && (
            <div className="flex items-start gap-1.5 border-t border-warning-border bg-warning-subtle px-2.5 py-1.5">
              <StickyNote size={12} className="mt-0.5 shrink-0 text-warning" />
              <p className="text-micro text-warning">{caller.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
