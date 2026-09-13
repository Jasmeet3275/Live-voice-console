import type {
  ClockController,
  ClockedTransport,
  ClientCommand,
  ServerEvent,
} from '@/types/call'
import { CallDirector } from './director'

/** Scripted mock backend implementing the wire contract + a controllable clock.
 *  The director drives all emission off one clock; `send()` may resolve a gate
 *  and resume. Swap for a WebSocketTransport (same CallTransport interface) in
 *  production. */
export class MockTransport implements ClockedTransport {
  private handlers = new Set<(e: ServerEvent) => void>()
  private director: CallDirector

  constructor(scenarioId: string) {
    this.director = new CallDirector(scenarioId, (e) => this.emit(e))
  }

  subscribe(handler: (e: ServerEvent) => void) {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  private emit = (e: ServerEvent) => this.handlers.forEach((h) => h(e))

  // The demo is started from the UI (header) — nothing auto-plays on connect.
  connect() {}

  send(cmd: ClientCommand) {
    this.director.onCommand(cmd)
  }

  close() {
    this.director.destroy()
    this.handlers.clear()
  }

  get clock(): ClockController {
    return this.director
  }
}
