import {
  initialCall,
  type Call,
  type CallTransport,
  type ClientCommand,
  type ServerEvent,
} from '@/types/call'

/** Pure reducer: fold a server event into the Call state. */
export function applyEvent(call: Call, e: ServerEvent): Call {
  switch (e.type) {
    case 'call.state': {
      const next: Call = {
        ...call,
        recording: e.recording ?? call.recording,
        connected: e.connected ?? call.connected,
        ended: e.ended ?? call.ended,
      }
      // The call ending (ended:true, however it got there — even after an earlier
      // drop) marks a terminal "ended" notice. A caller hanging up mid-call
      // (connected:false, not ended) marks the "dropped by the caller" notice.
      const nowEnding = e.ended === true && !call.ended
      const nowDropped = call.connected && e.connected === false && e.ended !== true && !call.ended
      if (nowEnding) {
        next.feed = [...call.feed, { kind: 'notice', id: `notice-${call.feed.length}`, text: 'Call ended', tone: 'neutral', variant: 'ended' }]
      } else if (nowDropped) {
        next.feed = [...call.feed, { kind: 'notice', id: `notice-${call.feed.length}`, text: 'Caller disconnected — call ended', tone: 'error', variant: 'dropped-caller' }]
      }
      return next
    }

    case 'turn.started':
      return {
        ...call,
        feed: [
          ...call.feed,
          { kind: 'turn', id: e.turnId, speaker: e.speaker, steps: [], status: 'running' },
        ],
      }

    case 'turn.status':
      return {
        ...call,
        feed: call.feed.map((it) =>
          it.kind === 'turn' && it.id === e.turnId
            ? { ...it, status: e.status, summary: e.summary ?? it.summary }
            : it,
        ),
      }

    case 'transcript.line':
      return {
        ...call,
        feed: [
          ...call.feed,
          {
            kind: 'utterance',
            id: e.line.id,
            speaker: e.line.speaker,
            words: e.line.words,
            time: e.line.time,
            final: e.line.final,
          },
        ],
      }

    case 'transcript.delta':
      return {
        ...call,
        feed: call.feed.map((it) =>
          it.kind === 'utterance' && it.id === e.lineId
            ? { ...it, words: [...it.words, e.word] }
            : it,
        ),
      }

    case 'transcript.final':
      return {
        ...call,
        feed: call.feed.map((it) =>
          it.kind === 'utterance' && it.id === e.lineId ? { ...it, final: true } : it,
        ),
      }

    case 'step.started':
      return {
        ...call,
        feed: call.feed.map((it) =>
          it.kind === 'turn' && it.id === e.turnId
            ? { ...it, steps: [...it.steps, e.step] }
            : it,
        ),
      }

    case 'step.updated':
      return {
        ...call,
        feed: call.feed.map((it) =>
          it.kind !== 'turn' || it.id !== e.turnId
            ? it
            : {
                ...it,
                steps: it.steps.map((s) =>
                  s.id !== e.stepId
                    ? s
                    : {
                        ...s,
                        state: e.state,
                        statusLabel: e.statusLabel ?? s.statusLabel,
                        detail: e.detail ?? s.detail,
                        output: e.output ?? s.output,
                      },
                ),
              },
        ),
      }

    case 'recommendation.updated': {
      const preferred = e.slots.find((s) => s.recommended && !s.unavailable) ?? e.slots.find((s) => !s.unavailable)
      return { ...call, slots: e.slots, selectedSlotId: preferred?.id }
    }

    case 'slot.taken':
      return {
        ...call,
        slots: call.slots.map((s) =>
          s.id === e.slotId ? { ...s, unavailable: true } : s,
        ),
      }

    case 'input.requested':
      return {
        ...call,
        pending: {
          await: e.await,
          request: e.request,
          hint: e.hint,
          turnId: e.turnId,
          stepId: e.stepId,
        },
      }

    case 'input.cleared':
      return { ...call, pending: undefined }

    case 'payment.result':
    case 'booking.confirmed':
      return call // handled by step.updated events in the mock

    default:
      return call
  }
}

/** Optimistic local updates for operator control commands (the mock/server
 *  may also echo authoritative events). */
function applyCommandOptimistic(call: Call, cmd: ClientCommand): Call {
  switch (cmd.type) {
    case 'mute':
      return { ...call, muted: cmd.on }
    case 'speaker':
      return { ...call, speakerOn: cmd.on }
    case 'takeOver':
      if (call.operatorInControl) return call // already holding — no duplicate marker
      return {
        ...call,
        operatorInControl: true,
        pending: undefined, // abandon any open checkpoint when the operator steps in
        // A take-over is a fact about the call, not a decision — append it to the
        // feed so it stays as history. It renders live (pulsing, Hand back) while
        // the operator holds, then flips to a static marker on release.
        feed: [
          ...call.feed,
          { kind: 'notice', id: `notice-${call.feed.length}`, text: 'You took over the line', tone: 'neutral', variant: 'took-over', resolved: false },
        ],
      }
    case 'release':
      // Control returns to the AI, but the take-over stays in the thread —
      // mark the open take-over notice resolved so it renders as a static marker.
      return {
        ...call,
        operatorInControl: false,
        feed: call.feed.map((it) =>
          it.kind === 'notice' && it.variant === 'took-over' && !it.resolved
            ? { ...it, resolved: true }
            : it,
        ),
      }
    case 'operatorBook':
      return {
        ...call,
        feed: [
          ...call.feed,
          {
            kind: 'turn',
            id: `op-${call.feed.length}`,
            speaker: 'operator',
            status: 'success',
            summary: `Booked · ${cmd.time} with ${cmd.stylist}`,
            steps: [
              { id: `op-${call.feed.length}:book`, type: 'confirm', state: 'success', detail: `${cmd.services.join(' + ')} · ${cmd.stylist} · ${cmd.time}${cmd.deposit ? ` · deposit ${cmd.deposit}` : ''}` },
              { id: `op-${call.feed.length}:notify`, type: 'notify', state: 'success', detail: 'Confirmation SMS sent to the caller' },
            ],
          },
        ],
      }
    case 'endCall':
      return {
        ...call,
        ended: true,
        connected: false,
        pending: undefined, // close any open checkpoint when the call ends
        feed: [
          ...call.feed,
          { kind: 'notice', id: `notice-${call.feed.length}`, text: 'Call ended by operator', tone: 'neutral', variant: 'ended-operator' },
        ],
      }
    case 'selectSlot':
      return { ...call, selectedSlotId: cmd.slotId }
    case 'correctWord':
      return {
        ...call,
        feed: call.feed.map((it) =>
          it.kind !== 'utterance' || it.id !== cmd.lineId
            ? it
            : {
                ...it,
                words: it.words.map((w, i) =>
                  i !== cmd.wordIndex
                    ? w
                    : { ...w, text: cmd.chosen, corrected: true },
                ),
              },
        ),
      }
    default:
      return call
  }
}

type Listener = () => void

/** Subscribable call store bound to a transport. Consume via useSyncExternalStore. */
export class CallStore {
  private state: Call = initialCall
  private listeners = new Set<Listener>()
  private unsub?: () => void
  private transport: CallTransport

  constructor(transport: CallTransport) {
    this.transport = transport
  }

  connect() {
    this.unsub = this.transport.subscribe((e) => this.dispatch(e))
    this.transport.connect()
  }

  destroy() {
    this.unsub?.()
    this.transport.close()
    this.listeners.clear()
  }

  getSnapshot = (): Call => this.state

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  send = (cmd: ClientCommand): void => {
    const next = applyCommandOptimistic(this.state, cmd)
    if (next !== this.state) this.setState(next)
    this.transport.send(cmd)
  }

  private dispatch(e: ServerEvent) {
    this.setState(applyEvent(this.state, e))
  }

  private setState(next: Call) {
    this.state = next
    this.listeners.forEach((l) => l())
  }
}
