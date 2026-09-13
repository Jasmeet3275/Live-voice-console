import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronLeft, ChevronRight, Star, X, CalendarClock, Scissors } from 'lucide-react'
import { Button, Avatar, Badge, Switch, IconButton, Pressable, Modal } from '@/components/ui'
import { cn } from '@/lib/cn'
import { SERVICES, SLOT_TIMES, STYLISTS } from '@/mock/salon'

/** Roving arrow-key navigation within an option group: Arrow/Home/End move focus
 *  between the group's `[data-arrow-item]` controls (Enter/Space still activate). */
function onArrowNav(e: KeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('[data-arrow-item]:not([disabled])'),
  )
  const idx = items.indexOf(document.activeElement as HTMLElement)
  if (idx === -1 || items.length === 0) return
  e.preventDefault()
  let next = idx
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % items.length
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + items.length) % items.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = items.length - 1
  items[next].focus()
}

export interface OperatorBooking {
  services: string[]
  stylist: string
  time: string
  deposit?: string
}

const STEPS = ['Services', 'Stylist', 'Time', 'Review'] as const

/** Guided stepper the operator uses (after Take Over) to book manually —
 *  everything the agent can do: services, stylist (with skills), slot, deposit. */
export function TakeOverWizard({
  open,
  onClose,
  initialServices = ['Haircut', 'Beard trim'],
  onBook,
}: {
  open: boolean
  onClose: () => void
  initialServices?: string[]
  onBook: (b: OperatorBooking) => void
}) {
  const [step, setStep] = useState(0)
  const [services, setServices] = useState<string[]>(initialServices)
  const [fadeOnly, setFadeOnly] = useState(false)
  const [stylistId, setStylistId] = useState<string>()
  const [time, setTime] = useState<string>()
  const [depositOn, setDepositOn] = useState(true)

  // State resets to a clean first step on each open — the parent remounts this
  // component via `key` when it opens (no reset effect needed).
  const stylist = STYLISTS.find((s) => s.id === stylistId)
  const stylistList = fadeOnly ? STYLISTS.filter((s) => s.specialties.includes('Fades')) : STYLISTS
  const canNext =
    (step === 0 && services.length > 0) ||
    (step === 1 && Boolean(stylistId)) ||
    (step === 2 && Boolean(time)) ||
    step === 3

  const toggleService = (s: string) =>
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const confirm = () => {
    if (!stylist || !time) return
    onBook({ services, stylist: stylist.name, time, deposit: depositOn ? '$15' : undefined })
    onClose()
  }

  // Move focus into the newly shown step (on open and on each Next/Back) so the
  // keyboard operator lands on the first control instead of the nav button.
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const first = bodyRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    first?.focus()
  }, [step, open])

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()} className="flex max-w-lg flex-col overflow-hidden">
        {/* Header + stepper */}
        <div className="flex items-center gap-2 border-b border-border p-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-waiting-subtle text-waiting">
            <Scissors size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-micro font-semibold uppercase tracking-wide text-waiting">You're on the call</p>
            <Modal.Title className="text-title font-semibold text-text">Book appointment</Modal.Title>
          </div>
          <IconButton aria-label="Cancel" size="sm" variant="ghost" icon={<X size={18} />} onClick={onClose} />
        </div>

        <div className="flex items-center gap-1.5 px-4 pt-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-1.5">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  i < step ? 'bg-accent text-accent-fg' : i === step ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-text-muted',
                )}
              >
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              <span className={cn('truncate text-micro font-medium', i === step ? 'text-text' : 'text-text-muted')}>{label}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step body */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-auto p-4">
          {step === 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Services" onKeyDown={onArrowNav}>
              {SERVICES.map((s) => {
                const on = services.includes(s)
                return (
                  <Pressable
                    key={s}
                    data-arrow-item
                    onClick={() => toggleService(s)}
                    aria-pressed={on}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-caption font-medium transition-colors',
                      on ? 'border-accent bg-accent-subtle text-accent' : 'border-border text-text-secondary hover:bg-surface-2',
                    )}
                  >
                    {s}
                  </Pressable>
                )
              })}
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3" role="group" aria-label="Stylist" onKeyDown={onArrowNav}>
              <label className="flex items-center gap-2 text-caption text-text-secondary">
                <Switch checked={fadeOnly} onCheckedChange={setFadeOnly} aria-label="Fade specialists only" />
                Only show fade specialists
              </label>
              {stylistList.map((s) => {
                const on = stylistId === s.id
                return (
                  <Pressable
                    key={s.id}
                    data-arrow-item
                    onClick={() => setStylistId(s.id)}
                    aria-pressed={on}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors',
                      on ? 'border-accent ring-1 ring-accent' : 'border-border hover:bg-surface-2',
                    )}
                  >
                    <Avatar name={s.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-caption font-semibold text-text">{s.name}</span>
                        <Badge tone="info"><Star size={10} className="fill-current" /> {s.rating.toFixed(1)}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {s.specialties.map((sp) => (
                          <Badge key={sp} tone="neutral">{sp}</Badge>
                        ))}
                      </div>
                    </div>
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-full border', on ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong')}>
                      {on && <Check size={12} />}
                    </span>
                  </Pressable>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Time" onKeyDown={onArrowNav}>
              {SLOT_TIMES.map((t) => {
                const taken = stylist?.taken.includes(t)
                const on = time === t
                return (
                  <Pressable
                    key={t}
                    data-arrow-item
                    disabled={taken}
                    onClick={() => setTime(t)}
                    aria-pressed={on}
                    className={cn(
                      'tabular rounded-lg border px-2 py-2 text-caption font-medium transition-colors',
                      taken ? 'border-border bg-surface-2 text-text-muted line-through' : on ? 'border-accent bg-accent-subtle text-accent' : 'border-border text-text hover:bg-surface-2',
                    )}
                  >
                    {t.replace(' PM', '')}
                  </Pressable>
                )
              })}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-border bg-surface-2 p-3">
                <Row icon={<Scissors size={14} />} label="Services" value={services.join(' + ')} />
                <Row icon={<Star size={14} />} label="Stylist" value={stylist?.name ?? '—'} />
                <Row icon={<CalendarClock size={14} />} label="When" value={time ? `Tomorrow · ${time}` : '—'} />
              </div>
              <label className="flex items-center gap-3">
                <Switch checked={depositOn} onCheckedChange={setDepositOn} aria-label="Require deposit" />
                <span className="text-caption text-text">Collect a $15 deposit</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border p-4">
          <Button variant="ghost" leftIcon={<ChevronLeft size={16} />} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="primary" rightIcon={<ChevronRight size={16} />} disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button variant="primary" leftIcon={<Check size={16} />} onClick={confirm}>
              Confirm &amp; book
            </Button>
          )}
        </div>
    </Modal>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-text-muted">{icon}</span>
      <span className="text-caption text-text-muted">{label}</span>
      <span className="ml-auto text-caption font-medium text-text">{value}</span>
    </div>
  )
}
