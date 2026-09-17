/* Shared story fixtures — the same salon-call mock the ?demo Showcase uses, so
   stories read like the real console. Not a story file itself. */
import type { ReactNode } from 'react'
import type { Slot } from '@/components/molecules/SlotCard'
import type { Caller } from '@/components/organisms/CallerPanel'
import type { BadgeTone, Status } from '@/components/atoms'
import type { TranscriptWord } from '@/types/call'

export const CALLER: Caller = {
  name: 'Jordan Rivera',
  phoneMasked: '+1 (415) ··· 4821',
  status: 'returning',
  visitsCount: 4,
  lastVisit: '3 weeks ago',
  preferredStylist: 'Marco',
  usualService: 'Skin fade + beard',
  visits: [
    { date: 'Aug 22', service: 'Skin fade + beard', stylist: 'Marco' },
    { date: 'Jul 30', service: 'Skin fade', stylist: 'Marco' },
    { date: 'Jun 14', service: 'Skin fade', stylist: 'Marco' },
    { date: 'Jul 2', service: 'Haircut', stylist: 'Alex' },
  ],
  note: 'Prefers not to be upsold. Runs a few minutes late — Marco holds the chair.',
}

export const INFERENCE: ReactNode = (
  <>
    Never booked a facial. <b className="text-text">4 of 4</b> were fades.
  </>
)

const words = (s: string, confidence = 0.98): TranscriptWord[] =>
  s.split(' ').map((text) => ({ text, confidence }))

export const GREETING = words('Thanks for calling Luxe Salon — how can I help you today?')
export const AI_WORDS = words('A fade and a beard trim with Marco — let me find you an evening slot.')
export const CALLER_WORDS: TranscriptWord[] = [
  ...words('I need a haircut and a beard trim, someone good with', 0.97),
  { text: 'fades', confidence: 0.58, alternatives: ['fades', 'facials'] },
]
export const CALLER_WORDS_OK: TranscriptWord[] = [
  ...words('I need a haircut and a beard trim, someone good with', 0.97),
  { text: 'fades', confidence: 0.99, corrected: true },
]

export const SLOTS: Slot[] = [
  { id: 'r', time: 'Tmrw · 6:30 PM', stylist: 'Marco Diaz', stylistRating: 4.9, duration: '45 min', price: '$48', services: ['Haircut', 'Beard trim'], recommended: true, reasons: ['Only evening fade specialist', 'Booked 3 of 4 past visits', 'Fits both services back-to-back'] },
  { id: 'a', time: 'Tmrw · 8:00 PM', stylist: 'Alex Kim', stylistRating: 4.6, duration: '45 min', price: '$45', services: ['Haircut', 'Beard trim'], reasons: ['Also does fades', 'Later, relaxed pace'] },
  { id: 'l', time: 'Tmrw · 7:15 PM', stylist: 'Alex Kim', duration: '45 min', price: '$45', services: ['Haircut', 'Beard trim'], reasons: [], unavailable: true },
]

export const AVAIL_STEPS = [
  { name: 'read_services', detail: 'matched "fade + beard" → 45 min, station 2', ms: '180ms' },
  { name: 'read_staff', detail: 'Marco certified · Alex not · Nina facials only', ms: '240ms' },
  { name: 'read_calendar', detail: 'Tue 15 Sep after 17:00 → 3 open, 2 offerable', ms: '910ms' },
]

export const BADGE_TONES: BadgeTone[] = ['neutral', 'accent', 'info', 'success', 'warning', 'error']
export const STATUSES: Status[] = ['running', 'success', 'warning', 'error', 'waiting']

/** Fixed-size frame so rails/panels render at their real width in the canvas. */
export function Frame({ w, h, children }: { w?: number | string; h?: number | string; children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-border"
      style={{ width: w, height: h }}
    >
      {children}
    </div>
  )
}
