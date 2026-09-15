/** Static salon data for the operator's manual booking (Take Over). */

export interface Stylist {
  id: string
  name: string
  rating: number
  specialties: string[]
  /** Times already booked (from SLOT_TIMES) — shown as unavailable. */
  taken: string[]
}

export const SERVICES = ['Haircut', 'Beard trim', 'Skin fade', 'Color', 'Kids cut']

export const SLOT_TIMES = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:15 PM', '7:30 PM']

/** Per-service duration + price, so the operator's edited Length/Price stay
 *  derived (and live-recompute) from whatever services they pick. */
export const SERVICE_META: Record<string, { minutes: number; price: number }> = {
  Haircut: { minutes: 30, price: 30 },
  'Beard trim': { minutes: 15, price: 18 },
  'Skin fade': { minutes: 45, price: 34 },
  Color: { minutes: 60, price: 60 },
  'Kids cut': { minutes: 20, price: 22 },
}

/** Sum the picked services into a single Length + Price. Unknown services
 *  contribute nothing, so the record degrades gracefully. */
export function deriveServiceTotals(services: string[]): { length: string; price: string } {
  const totals = services.reduce(
    (acc, s) => {
      const meta = SERVICE_META[s]
      if (meta) {
        acc.minutes += meta.minutes
        acc.price += meta.price
      }
      return acc
    },
    { minutes: 0, price: 0 },
  )
  return { length: `${totals.minutes} min`, price: `$${totals.price}` }
}

export const STYLISTS: Stylist[] = [
  { id: 'marco', name: 'Marco Diaz', rating: 4.9, specialties: ['Fades', 'Beard', 'Skin fade'], taken: ['6:00 PM'] },
  { id: 'alex', name: 'Alex Kim', rating: 4.6, specialties: ['Fades', 'Classic cut', 'Color'], taken: ['7:00 PM'] },
  { id: 'sam', name: 'Sam Lee', rating: 4.4, specialties: ['Color', 'Long hair'], taken: [] },
]
