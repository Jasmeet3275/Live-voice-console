import { useContext, useSyncExternalStore } from 'react'
import { ClockContext } from '@/store/clockContext'
import type { ClockController, ClockState } from '@/types/call'

export type UseClock = ClockState & Pick<ClockController, 'play' | 'pause' | 'toggle' | 'seek'>

/** Subscribe to the demo clock + get its controls. */
export function useClock(): UseClock {
  const clock = useContext(ClockContext)
  if (!clock) throw new Error('useClock must be used within <CallProvider> with a clocked transport')
  const state = useSyncExternalStore(clock.subscribe, clock.getState)
  return {
    ...state,
    play: clock.play,
    pause: clock.pause,
    toggle: clock.toggle,
    seek: clock.seek,
  }
}
