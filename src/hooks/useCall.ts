import { useContext, useSyncExternalStore } from 'react'
import { CallStoreContext } from '@/store/callContext'
import type { CallStore } from '@/store/callStore'
import type { Call, ClientCommand } from '@/types/call'

function useStore(): CallStore {
  const store = useContext(CallStoreContext)
  if (!store) throw new Error('useCall must be used within <CallProvider>')
  return store
}

/** Subscribe to the live Call state. */
export function useCall(): Call {
  const store = useStore()
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}

/** Get the command dispatcher (operator actions). */
export function useCallSend(): (cmd: ClientCommand) => void {
  return useStore().send
}
