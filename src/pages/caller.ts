import type { Caller } from '@/components/organisms'

/** The caller for the demo call — shared by the console and the booking page
 *  (both read the same live store; this is just the static CRM context). */
export const CALLER: Caller = {
  name: 'Jordan Rivera',
  phoneMasked: '+1 (415) •••-4821',
  status: 'returning',
  visitsCount: 4,
  lastVisit: '3 weeks ago',
  preferredStylist: 'Marco',
  usualService: 'Skin fade + beard',
  visits: [
    { date: 'Aug 22', service: 'Skin fade + beard trim', stylist: 'Marco' },
    { date: 'Jul 30', service: 'Skin fade', stylist: 'Marco' },
    { date: 'Jul 2', service: 'Haircut', stylist: 'Alex' },
  ],
  note: 'Prefers not to be upsold. Runs a few minutes late.',
}

/** The operator persona shown as the author of manual bookings. */
export const OPERATOR = 'Dana K.'
