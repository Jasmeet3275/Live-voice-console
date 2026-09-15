import { ArrowLeft, NotebookPen, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCall } from '@/hooks/useCall'
import { useClock } from '@/hooks/useClock'
import { formatTime } from '@/lib/audio'
import { CALLER } from './caller'

/* ------------------------------------------------------------------ *
 * CustomerPage — the mobile "Customer" route (/customer), reached by
 * tapping the caller summary in the header. What the AI knew before it
 * answered: identity, lifetime stats, the pinned team note, the
 * preferences the AI applies, and full visit history. Reads the shared
 * store for the live "on call" state. Matches design_handoff / Screen 3
 * mobile "Customer".
 * ------------------------------------------------------------------ */

const PREFERENCES: { label: string; value: string }[] = [
  { label: 'Usual service', value: 'Skin fade + beard' },
  { label: 'Usual stylist', value: 'Marco Diaz' },
  { label: 'Usual window', value: 'Weekday evenings' },
  { label: 'Never booked', value: 'Facials, colour' },
]

const HISTORY: { service: string; price: string; meta: string }[] = [
  { service: 'Skin fade + beard trim', price: '$48', meta: 'Aug 22 · Marco · 45 min · arrived 6 min late' },
  { service: 'Skin fade', price: '$34', meta: 'Jul 30 · Marco · 30 min' },
  { service: 'Skin fade', price: '$34', meta: 'Jun 14 · Marco · 30 min' },
  { service: 'Haircut', price: '$30', meta: 'Jul 2 · Alex · 30 min · first visit' },
]

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export function CustomerPage() {
  const navigate = useNavigate()
  const call = useCall()
  const clock = useClock()
  const onCall = clock.elapsed > 0 && !call.ended

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-bg-app pb-[env(safe-area-inset-bottom)]">
      {/* header */}
      <header className="shrink-0 border-b border-border bg-surface px-4 pb-3.5 pt-3">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            aria-label="Back to the call"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-text">Customer</span>
          {onCall && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-error animate-[pulse-dot_1.6s_ease-in-out_infinite]" />
              <span className="text-[11px] font-semibold text-text-secondary">on call {formatTime(clock.elapsed / 1000)}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-surface-2 text-[19px] font-semibold tracking-[-0.02em] text-text-secondary">
            {initials(CALLER.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[19px] font-semibold tracking-[-0.025em] text-text">{CALLER.name}</div>
            <div className="mt-0.5 text-[12.5px] text-text-muted">{CALLER.phoneMasked} · since Mar 2022</div>
          </div>
        </div>
      </header>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {/* stat tiles */}
          <div className="flex gap-2">
            <Stat value={String(CALLER.visitsCount ?? 4)} label="visits" />
            <Stat value="$146" label="lifetime" />
            <Stat value="0" label="no-shows" />
          </div>

          {/* pinned team note (amber) */}
          <div className="rounded-2xl border border-waiting-border bg-waiting-subtle p-4">
            <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-waiting">Team note · pinned</div>
            <p className="text-[13px] leading-[1.55] text-waiting">{CALLER.note}</p>
            <div className="mt-2 text-[11px] text-waiting">Added by Marco, Aug 22</div>
          </div>

          {/* preferences */}
          <Card title="Preferences the AI applies">
            {PREFERENCES.map((p, i) => (
              <div key={p.label} className={`flex items-center justify-between py-[7px] ${i < PREFERENCES.length - 1 ? 'border-b border-border' : ''}`}>
                <span className="text-[12.5px] text-text-muted">{p.label}</span>
                <span className="text-[12.5px] font-semibold text-text">{p.value}</span>
              </div>
            ))}
          </Card>

          {/* visit history */}
          <Card title="Visit history">
            <div className="flex flex-col gap-3">
              {HISTORY.map((v, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="w-0.5 shrink-0 rounded-full bg-border-strong" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-[12.5px] font-semibold text-text">{v.service}</span>
                      <span className="text-[12.5px] font-semibold text-text-secondary">{v.price}</span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-text-muted">{v.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="rounded-2xl bg-surface-2 px-[15px] py-3 text-[12px] leading-[1.5] text-text-secondary">
            Card kept on file for deposits only. Every charge needs an operator confirmation — the AI cannot take money on its own.
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="flex shrink-0 gap-2 border-t border-border bg-surface px-4 py-3.5">
        <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-[13.5px] font-semibold text-text-secondary transition-colors hover:bg-surface-2">
          <NotebookPen size={15} /> Add note
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-[13.5px] font-semibold text-accent-fg"
        >
          <Phone size={15} /> Back to call
        </button>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-border bg-surface px-3 py-3">
      <div className="text-[21px] font-bold tracking-[-0.03em] text-text">{value}</div>
      <div className="mt-0.5 text-[11.5px] text-text-muted">{label}</div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">{title}</div>
      {children}
    </div>
  )
}
