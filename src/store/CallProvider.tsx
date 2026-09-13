import { useEffect, useMemo, type ReactNode } from 'react'
import { CallStore } from './callStore'
import { CallStoreContext } from './callContext'
import { ClockContext } from './clockContext'
import type { CallTransport, ClockController } from '@/types/call'

function getClock(t: CallTransport): ClockController | null {
  return 'clock' in t ? (t as { clock: ClockController }).clock : null
}

/** Provides a CallStore bound to the given transport (and the transport's clock,
 *  if any); connects on mount. */
export function CallProvider({
  transport,
  children,
}: {
  transport: CallTransport
  children: ReactNode
}) {
  const store = useMemo(() => new CallStore(transport), [transport])
  const clock = useMemo(() => getClock(transport), [transport])

  useEffect(() => {
    store.connect()
    return () => store.destroy()
  }, [store])

  return (
    <CallStoreContext.Provider value={store}>
      <ClockContext.Provider value={clock}>{children}</ClockContext.Provider>
    </CallStoreContext.Provider>
  )
}
