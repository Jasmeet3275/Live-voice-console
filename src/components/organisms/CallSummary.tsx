import {
  Scissors,
  User,
  CalendarClock,
  Clock,
  Receipt,
  ListChecks,
} from 'lucide-react'
import { Card, CardHeader, StatusChip, Divider, type Status } from '@/components/ui'
import { cn } from '@/lib/cn'

export interface CallSummaryProps {
  customer: string
  services: string[]
  stylist: string
  when: string
  duration: string
  price: string
  deposit?: { amount: number; status: 'collected' | 'waived' | 'pending' }
  status: 'confirmed' | 'pending' | 'failed'
  /** Key decisions/events during the call (corrections, preferences, flags). */
  notes?: string[]
  className?: string
}

const statusMap: Record<CallSummaryProps['status'], { chip: Status; label: string }> = {
  confirmed: { chip: 'success', label: 'Confirmed' },
  pending: { chip: 'waiting', label: 'Pending' },
  failed: { chip: 'error', label: 'Not booked' },
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-text-muted">{icon}</span>
      <span className="text-caption text-text-muted">{label}</span>
      <span className="ml-auto text-caption font-medium text-text">{value}</span>
    </div>
  )
}

const depositText = (d: NonNullable<CallSummaryProps['deposit']>) =>
  d.status === 'collected'
    ? `$${d.amount} collected`
    : d.status === 'waived'
      ? 'Waived'
      : `$${d.amount} pending`

/** Internal recap of what happened on the call — for the operator's records. */
export function CallSummary({
  customer,
  services,
  stylist,
  when,
  duration,
  price,
  deposit,
  status,
  notes,
  className,
}: CallSummaryProps) {
  const s = statusMap[status]
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader
        title="Call summary"
        action={<StatusChip status={s.chip} label={s.label} size="sm" />}
      />
      <Divider className="my-3" />

      <div className="flex flex-col">
        <Row icon={<User size={14} />} label="Customer" value={customer} />
        <Row
          icon={<Scissors size={14} />}
          label="Services"
          value={services.join(' + ')}
        />
        <Row icon={<User size={14} />} label="Stylist" value={stylist} />
        <Row icon={<CalendarClock size={14} />} label="When" value={when} />
        <Row icon={<Clock size={14} />} label="Duration" value={duration} />
        <Row
          icon={<Receipt size={14} />}
          label="Price"
          value={
            <span className="tabular">
              {price}
              {deposit && (
                <span className="ml-1 text-text-muted">
                  · deposit {depositText(deposit)}
                </span>
              )}
            </span>
          }
        />
      </div>

      {notes && notes.length > 0 && (
        <>
          <Divider className="my-3" />
          <p className="mb-2 flex items-center gap-1.5 text-micro font-medium uppercase tracking-wide text-text-muted">
            <ListChecks size={12} /> Decisions & notes
          </p>
          <ul className="flex flex-col gap-1.5">
            {notes.map((n, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-caption text-text-secondary"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                {n}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
