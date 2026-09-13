import { createContext } from 'react'
import type { CallStore } from './callStore'

/** Context holding the CallStore instance (no JSX — importable by pure hooks). */
export const CallStoreContext = createContext<CallStore | null>(null)
