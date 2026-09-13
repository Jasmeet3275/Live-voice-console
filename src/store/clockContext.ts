import { createContext } from 'react'
import type { ClockController } from '@/types/call'

/** Context holding the demo clock (from a ClockedTransport), or null. */
export const ClockContext = createContext<ClockController | null>(null)
