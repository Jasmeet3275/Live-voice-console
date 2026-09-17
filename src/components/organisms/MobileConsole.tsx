import { useState } from 'react'
import { Mic, Headset, PhoneOff, Bot } from 'lucide-react'
import { WaveformTrack } from '@/components/domain/WaveformTrack'
import { CustomerRail } from '@/components/domain/CustomerRail'
import { BookingRail, type BookingFields, type ConfirmState } from '@/components/domain/BookingRail'
import { AiThinkingBubble } from '@/components/domain/threadParts'
import { FlaggedWordMobile } from '@/components/domain/consoleShared'
import type { Caller } from '@/components/domain/CallerPanel'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * Mobile variants (390×844). Same tokens + state as desktop; the record
 * lives in the thread (no right rail) and the tab strip is the nav.
 * Matches design_handoff / Screen 1 mobile.
 * ------------------------------------------------------------------ */

export function PhoneFrame({ dark = false, children }: { dark?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex h-[844px] w-[390px] shrink-0 flex-col overflow-hidden rounded-[38px] border shadow-e3',
        dark ? 'border-transparent bg-text' : 'border-border bg-bg-app',
      )}
    >
      {/* status bar */}
      <div className={cn('flex shrink-0 items-center justify-between px-7 pb-1.5 pt-3.5 text-[12.5px] font-semibold', dark ? 'text-white' : 'text-text')}>
        <span>9:41</span>
        <span className={cn('h-2 w-[15px] rounded-[2px] border', dark ? 'border-white' : 'border-text')} />
      </div>
      {children}
    </div>
  )
}

const TABS = ['Call', 'Booking', 'Customer'] as const
type Tab = (typeof TABS)[number]

export function MobileTabStrip({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="flex shrink-0 gap-1 border-b border-border bg-surface px-4 py-2">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            'flex-1 rounded-[10px] py-2.5 text-center text-[12.5px] font-semibold transition-colors',
            active === t ? 'bg-text text-text-inverse' : 'text-text-secondary',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function MobileBubble({ speaker, children }: { speaker: 'ai' | 'caller'; children: React.ReactNode }) {
  const ai = speaker === 'ai'
  return (
    <div
      className={cn(
        'max-w-[84%] px-3 py-2.5 text-[13px] leading-[1.55] text-text-2',
        ai ? 'self-start rounded-[4px_13px_13px_13px] border border-border bg-surface'
        : 'self-end rounded-[13px_4px_13px_13px] bg-bubble-caller',
      )}
    >
      {children}
    </div>
  )
}

const RECORD_WITHHELD: BookingFields = { customer: 'Jordan Rivera' }
const RECORD_FILLED: BookingFields = { customer: 'Jordan Rivera', service: 'Haircut + beard, fade', stylist: 'Marco Diaz', length: '45 min', time: 'Tue · 6:30 PM', price: '$48 · $15 deposit' }

export function MobileConsole({
  caller,
  inference,
  confirm = 'withheld',
}: {
  caller: Caller
  inference?: React.ReactNode
  confirm?: ConfirmState
}) {
  const [tab, setTab] = useState<Tab>('Call')
  const [inControl, setInControl] = useState(false)
  const filled = confirm === 'confirmed' || confirm === 'ready'

  return (
    <PhoneFrame>
      {/* compact call header */}
      <div className="shrink-0 border-b border-border bg-surface px-[18px] pb-3 pt-2">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-hover text-[13px] font-semibold text-text-secondary">JR</span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold tracking-[-0.02em] text-text">{caller.name}</div>
            <div className="text-[11.5px] text-text-muted">4 visits · usual: fade + beard</div>
          </div>
          <div className="text-right">
            <div className="tabular text-[14px] font-bold text-text">0:38</div>
            <div className="flex items-center justify-end gap-1"><span className="h-1.5 w-1.5 animate-breathe rounded-full bg-error" /><span className="text-[10.5px] text-text-muted">rec</span></div>
          </div>
        </div>
        <WaveformTrack height={30} progress={1} flags={[{ pos: 0.67, label: '38%' }]} />
      </div>

      <MobileTabStrip active={tab} onChange={setTab} />

      {/* body */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {tab === 'Call' && (
          <>
            <MobileBubble speaker="ai">Thanks for calling Luxe Salon — how can I help you today?</MobileBubble>
            <MobileBubble speaker="caller">
              I need a haircut and a beard trim tomorrow evening, someone good with <FlaggedWordMobile>fades</FlaggedWordMobile>
            </MobileBubble>
            {/* record lives in the thread on mobile */}
            <div className="rounded-[14px] border border-border bg-surface p-3.5">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Booking record</span>
                <span className="ml-auto text-[11px] text-text-muted">{filled ? 'saved' : 'draft'}</span>
              </div>
              {(['customer', 'service', 'stylist', 'time', 'price'] as const).map((k, i, a) => {
                const v = (filled ? RECORD_FILLED : RECORD_WITHHELD)[k]
                return (
                  <div key={k} className={cn('flex justify-between py-1.5', i < a.length - 1 && 'border-b border-border', v == null && 'opacity-60')}>
                    <span className="text-[12px] capitalize text-text-muted">{k}</span>
                    <span className={cn('text-[12.5px]', v == null ? 'text-text-muted' : 'font-semibold text-text')}>{v ?? '——'}</span>
                  </div>
                )
              })}
            </div>
            <AiThinkingBubble className="mt-auto" label="checking services, staff and the calendar" />
          </>
        )}

        {tab === 'Booking' && (
          <BookingRail className="h-full w-full rounded-none border-l-0" fields={filled ? RECORD_FILLED : RECORD_WITHHELD} confirm={confirm} withheldNote={!filled ? 'A field fills only when the AI is certain of it.' : undefined} />
        )}

        {tab === 'Customer' && (
          <CustomerRail className="h-full w-full rounded-none border-r-0" caller={caller} inference={inference} />
        )}
      </div>

      {/* action bar */}
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-surface px-4 py-3">
        <button aria-label="Mute" className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border bg-surface-2 text-text-2"><Mic size={18} /></button>
        {inControl ? (
          <button onClick={() => setInControl(false)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] bg-text text-[14px] font-semibold text-text-inverse"><Bot size={16} /> Hand back to AI</button>
        ) : (
          <button onClick={() => setInControl(true)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[12px] bg-accent text-[14px] font-semibold text-accent-fg shadow-[0_6px_16px_-9px_rgba(31,125,110,0.75)]"><Headset size={16} /> Take over</button>
        )}
        <button aria-label="End call" className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-error text-white"><PhoneOff size={18} /></button>
      </div>
    </PhoneFrame>
  )
}
