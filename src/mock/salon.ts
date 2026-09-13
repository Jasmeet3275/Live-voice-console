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

export const STYLISTS: Stylist[] = [
  { id: 'marco', name: 'Marco Diaz', rating: 4.9, specialties: ['Fades', 'Beard', 'Skin fade'], taken: ['6:00 PM'] },
  { id: 'alex', name: 'Alex Kim', rating: 4.6, specialties: ['Fades', 'Classic cut', 'Color'], taken: ['7:00 PM'] },
  { id: 'sam', name: 'Sam Lee', rating: 4.4, specialties: ['Color', 'Long hair'], taken: [] },
]
