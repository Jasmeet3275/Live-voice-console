import { generateWaveform, sampleLevel } from '@/lib/audio'
import type {
  ClientCommand,
  ClockController,
  ClockState,
  ServerEvent,
} from '@/types/call'
import { getScenario, Timeline, type Gate, type TimelineItem } from './scenarios'

/** How far the end stays ahead of the playhead (also the tail after the last item). */
const END_TAIL = 1500

/** Pull turn/step ids off a step event so a checkpoint can reference the step it blocks. */
function idsFromEvent(e: ServerEvent): { turnId?: string; stepId?: string } {
  if (e.type === 'step.started') return { turnId: e.turnId, stepId: e.step.id }
  if (e.type === 'step.updated') return { turnId: e.turnId, stepId: e.stepId }
  return {}
}

/**
 * The mock **backend**: a real-time clock plus the agent-graph runtime.
 *
 * The clock free-runs (a live call never stops) and drives the waveform. Agent
 * *emission* — not the clock — is what a checkpoint gates: on reaching a gate the
 * director emits an `input.requested` event and suspends emission until the
 * matching operator command arrives, then emits the resolver events + an
 * `input.cleared` event and rebases the remaining timeline so it resumes with
 * its original pacing. Nothing about the checkpoint touches `ClockState`; it all
 * travels as `ServerEvent`s, exactly as a real WebSocket backend would.
 */
export class CallDirector implements ClockController {
  private items: TimelineItem[]
  private cursor = 0
  private elapsed = 0
  private duration: number
  private playing = false
  private endedFlag = false

  /** Agent emission is suspended: either waiting on a checkpoint, or taken over. */
  private suspended = false
  /** The checkpoint currently blocking the agent, if any. */
  private awaitingGate?: { gate: Gate; gateDelay: number; turnId?: string; stepId?: string }

  private raf = 0
  private lastTs = 0
  private waveform = generateWaveform(140, 7)

  private listeners = new Set<() => void>()
  private snapshot: ClockState
  private emit: (e: ServerEvent) => void

  constructor(scenarioId: string, emit: (e: ServerEvent) => void) {
    this.emit = emit
    const tl = new Timeline()
    getScenario(scenarioId).build(tl)
    this.items = [...tl.items].sort((a, b) => a.delay - b.delay)
    const last = this.items.at(-1)?.delay ?? 0
    this.duration = last + END_TAIL
    this.snapshot = this.computeSnapshot()
  }

  // ---- ClockController (media plane) ----

  getState = (): ClockState => this.snapshot

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  play = () => {
    // The clock may run even while a checkpoint is open — the call is live.
    if (this.playing || this.endedFlag) return
    this.playing = true
    this.lastTs = performance.now()
    this.raf = requestAnimationFrame(this.tick)
    this.notify()
  }

  pause = () => {
    if (!this.playing) return
    this.playing = false
    cancelAnimationFrame(this.raf)
    this.notify()
  }

  toggle = () => (this.playing ? this.pause() : this.play())

  seek = (ms: number) => {
    // Move the playhead; advance() emits any now-due items but no-ops while
    // suspended, so a seek can't blow past an open checkpoint.
    this.elapsed = Math.max(0, Math.min(this.duration, ms))
    this.advance()
    this.notify()
  }

  /** Operator command (client → server). May resolve the open checkpoint. */
  onCommand(cmd: ClientCommand) {
    // Take over: stop the AI and abandon any open checkpoint — but the clock keeps
    // running, because the call is still live while the operator is on it.
    if (cmd.type === 'takeOver') {
      if (this.awaitingGate) this.emit({ type: 'input.cleared' })
      this.awaitingGate = undefined
      this.suspended = true
      this.notify()
      return
    }
    // Hand back: the AI resumes driving the (live) call.
    if (cmd.type === 'release') {
      this.suspended = false
      this.advance()
      this.notify()
      return
    }
    // End the call: close any checkpoint and stop the clock for good.
    if (cmd.type === 'endCall') {
      if (this.awaitingGate) this.emit({ type: 'input.cleared' })
      this.awaitingGate = undefined
      this.suspended = false
      this.playing = false
      this.endedFlag = true
      cancelAnimationFrame(this.raf)
      this.notify()
      return
    }

    // Otherwise: does this command resolve the open checkpoint?
    const info = this.awaitingGate
    if (!info) return
    const { gate } = info
    const isAlt = Boolean(gate.awaitAlt && cmd.type === gate.awaitAlt)
    const isThird = Boolean(gate.awaitThird && cmd.type === gate.awaitThird)
    if (cmd.type !== gate.await && !isAlt && !isThird) return

    this.awaitingGate = undefined
    this.suspended = false

    if (gate.paced) {
      // The branch is authored as relative-delay beats (see `beats(...)`). Close
      // the checkpoint now, then merge the beats onto the live timeline so they
      // play out one at a time via the normal emission loop — same delay logic as
      // the rest of the call.
      const branch = (isThird ? gate.onResolveThird : isAlt ? gate.onResolveAlt : gate.onResolve) ?? []
      this.emit({ type: 'input.cleared' })
      this.scheduleBeats(branch as TimelineItem[])
      this.notify()
      return
    }

    const events: ServerEvent[] =
      isThird ? (gate.onResolveThird as ServerEvent[]) ?? []
      : isAlt ? (gate.onResolveAlt as ServerEvent[]) ?? []
      : gate.onResolveWithInput ? gate.onResolveWithInput(cmd.type === 'correctWord' ? cmd.chosen : cmd.type === 'selectSlot' ? cmd.slotId : '', cmd)
      : (gate.onResolve as ServerEvent[]) ?? []

    events.forEach((e) => this.emit(e))
    this.emit({ type: 'input.cleared' })

    // The call kept playing while the operator decided; shift the remaining
    // timeline by that wait so the rest resumes with its authored pacing.
    this.rebaseRemaining(this.elapsed - info.gateDelay)
    this.advance()
    this.notify()
  }

  /** Merge a branch's relative-delay beats onto the timeline, offset to now, so
   *  the tick loop emits them at their authored times (the clock is running). */
  private scheduleBeats(beats: TimelineItem[]) {
    for (const b of beats) this.items.push({ delay: this.elapsed + b.delay, event: b.event })
    this.items.sort((a, b) => a.delay - b.delay)
    const last = this.items.at(-1)?.delay ?? 0
    this.duration = Math.max(this.duration, last + END_TAIL)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.listeners.clear()
  }

  // ---- internals ----

  private tick = (ts: number) => {
    const dt = ts - this.lastTs
    this.lastTs = ts
    this.elapsed += dt
    this.advance() // no-op while suspended
    if (this.suspended) {
      // Live call never "ends" while the agent waits — keep the end ahead.
      if (this.elapsed + END_TAIL > this.duration) this.duration = this.elapsed + END_TAIL
    } else if (this.elapsed >= this.duration) {
      this.elapsed = this.duration
      this.playing = false
      this.endedFlag = true
    }
    if (this.playing) this.raf = requestAnimationFrame(this.tick)
    this.notify()
  }

  /** Emit all items due by `elapsed`; on a gate, announce it and suspend emission. */
  private advance() {
    if (this.suspended) return
    while (this.cursor < this.items.length && this.items[this.cursor].delay <= this.elapsed) {
      const item = this.items[this.cursor]
      this.emit(item.event)
      this.cursor += 1
      // The agent closed the call → stop the clock right here (no dead air).
      if (item.event.type === 'call.state' && item.event.ended === true) {
        this.playing = false
        this.endedFlag = true
        cancelAnimationFrame(this.raf)
        break
      }
      if (item.gate) {
        this.enterGate(item)
        break
      }
    }
  }

  private enterGate(item: TimelineItem) {
    const gate = item.gate!
    const { turnId, stepId } = idsFromEvent(item.event)
    this.awaitingGate = { gate, gateDelay: item.delay, turnId, stepId }
    this.suspended = true
    this.emit({ type: 'input.requested', await: gate.await, request: gate.request, hint: gate.hint, turnId, stepId })
  }

  /** Push the not-yet-emitted items later by `shift` ms (the operator's wait). */
  private rebaseRemaining(shift: number) {
    if (shift <= 0) return
    for (let i = this.cursor; i < this.items.length; i++) this.items[i].delay += shift
    const last = this.items.at(-1)?.delay ?? 0
    this.duration = Math.max(this.duration, last + END_TAIL)
  }

  private computeSnapshot(): ClockState {
    const progress = this.duration ? Math.min(1, this.elapsed / this.duration) : 0
    return {
      elapsed: this.elapsed,
      duration: this.duration,
      progress,
      level: this.playing ? sampleLevel(this.waveform, progress) : 0,
      playing: this.playing,
      ended: this.endedFlag,
    }
  }

  private notify() {
    this.snapshot = this.computeSnapshot()
    this.listeners.forEach((l) => l())
  }
}
