import type { Slot } from '@/components/molecules'
import type { TranscriptWord } from '@/components/atoms'
import type { Status } from '@/components/atoms'

export type { Slot, TranscriptWord }

/** Step lifecycle state === the shared status vocabulary. */
export type StepOutcome = Status // running | success | warning | error | waiting

export type Speaker = 'caller' | 'ai' | 'system' | 'operator'

/** The fixed vocabulary of agent steps (the canonical pipeline). */
export type StepType =
  | 'transcribe'
  | 'assess_confidence'
  | 'classify_intent'
  | 'compose_reply'
  | 'clarify'
  | 'update_context'
  | 'capability'
  | 'availability'
  | 'recommend'
  | 'hold'
  | 'conflict_check'
  | 'deposit'
  | 'payment'
  | 'confirm'
  | 'notify' // also the SMS/pay-link re-engagement action
  // recovery-specific actions (most recoveries just re-run an existing step)
  | 'hold_booking' // park the pending booking (e.g. after a caller drop)
  | 'schedule_callback'
  | 'handoff' // the agent escalates to a human on an unrecoverable error

export interface Step {
  id: string
  type: StepType
  state: StepOutcome
  /** Optional chip override, e.g. "98%" / "Searching…". */
  statusLabel?: string
  /** Short human body text (rich bodies rendered by type where needed). */
  detail?: string
  /** Typed per step (slots, confidence, masked card…) — narrowed by consumers. */
  output?: unknown
}

export interface TranscriptLineData {
  id: string
  speaker: 'caller' | 'ai'
  words: TranscriptWord[]
  time?: string
  /** false while the recognizer is still streaming this line. */
  final: boolean
}

export interface Turn {
  id: string
  speaker: Speaker
  trigger: string
  time?: string
  steps: Step[]
  status: StepOutcome
  summary?: string
}

/** One item in the merged conversation feed (single-column view). */
export type FeedItem =
  | {
      kind: 'utterance'
      id: string
      speaker: 'caller' | 'ai'
      words: TranscriptWord[]
      time?: string
      final: boolean
    }
  | {
      kind: 'turn'
      id: string
      speaker: Speaker
      steps: Step[]
      status: StepOutcome
      summary?: string
    }
  | {
      kind: 'notice'
      id: string
      text: string
      tone: 'neutral' | 'error'
      /** Terminal notices render as a rich inline ThreadNotice (rendered where
       *  the event happened), not the plain pill. `took-over` is not terminal —
       *  it stays in the thread as call history and flips live → static on
       *  hand-back. */
      variant?: 'dropped-caller' | 'ended' | 'ended-operator' | 'took-over'
      /** For `took-over`: false while the operator holds the line (renders live —
       *  pulsing dot, timer, Hand back), true once control returns (static marker). */
      resolved?: boolean
    }

export interface DraftBooking {
  services: string[]
  stylist: string
  slotId: string
  depositRequired: boolean
  depositAmount: number
}

/** A human-in-the-loop checkpoint the agent is currently blocked on. Lives in
 *  `Call` (driven by `input.requested` / `input.cleared` events) — NOT on the
 *  clock — so it is delivered over the same wire a real backend would use. */
export interface PendingInput {
  await: ClientCommand['type']
  request: InputRequest
  hint?: string
  turnId?: string
  stepId?: string
}

export interface Call {
  connected: boolean
  recording: boolean
  operatorInControl: boolean
  muted: boolean
  speakerOn: boolean
  feed: FeedItem[]
  slots: Slot[]
  selectedSlotId?: string
  draft?: DraftBooking
  /** The current human-in-the-loop checkpoint, or undefined when none is open. */
  pending?: PendingInput
  ended: boolean
}

export const initialCall: Call = {
  connected: false,
  recording: true,
  operatorInControl: false,
  muted: false,
  speakerOn: true,
  feed: [],
  slots: [],
  ended: false,
}

// ---- Wire protocol (identical for mock or real WebSocket) ----

export type ServerEvent =
  | { type: 'call.state'; recording?: boolean; connected?: boolean; ended?: boolean }
  | { type: 'turn.started'; turnId: string; trigger: string; speaker: Speaker; time?: string }
  | { type: 'turn.status'; turnId: string; status: StepOutcome; summary?: string }
  | { type: 'transcript.line'; line: TranscriptLineData }
  | { type: 'transcript.delta'; lineId: string; word: TranscriptWord }
  | { type: 'transcript.final'; lineId: string }
  | { type: 'step.started'; turnId: string; step: Step }
  | { type: 'step.updated'; turnId: string; stepId: string; state: StepOutcome; statusLabel?: string; detail?: string; output?: unknown }
  | { type: 'recommendation.updated'; slots: Slot[] }
  | { type: 'slot.taken'; slotId: string }
  | { type: 'payment.result'; ok: boolean }
  | { type: 'booking.confirmed' }
  // Human-in-the-loop: the agent reached a checkpoint and needs operator input.
  | { type: 'input.requested'; await: ClientCommand['type']; request: InputRequest; hint?: string; turnId?: string; stepId?: string }
  | { type: 'input.cleared' }

export type ClientCommand =
  | { type: 'takeOver' }
  | { type: 'release' }
  | { type: 'endCall' }
  | { type: 'mute'; on: boolean }
  | { type: 'speaker'; on: boolean }
  | { type: 'correctWord'; lineId: string; wordIndex: number; chosen: string }
  | { type: 'selectSlot'; slotId: string; offer?: 'one' | 'both' | 'ask' }
  | { type: 'requireDeposit'; on: boolean }
  | { type: 'chargeDeposit' }
  | { type: 'waiveDeposit' }
  | { type: 'confirmBooking' }
  | { type: 'refreshAvailability' }
  | { type: 'operatorBook'; services: string[]; stylist: string; time: string; deposit?: string }
  // "Slower / safer" checkpoint paths — the AI stays on the line and does the
  // extra step aloud instead of committing silently.
  | { type: 'askCaller' } // re-ask a low-confidence word aloud
  | { type: 'readBack' } // read the booking back before saving
  | { type: 'askForCard' } // ask the caller for another card after a decline
  | { type: 'scheduleCallback' } // queue a desk callback (hand-off)
  | { type: 'sendBookingLink' } // text the self-serve booking page (hand-off)
  // Caller-dropped recovery — the operator picks one and the flow branches.
  | { type: 'callBack' } // redial and resume at the readback
  | { type: 'holdAndText' } // hold the slot + text a one-tap confirm
  | { type: 'releaseSlot' } // release the chair, save nothing

export interface CallTransport {
  connect(): void
  close(): void
  subscribe(handler: (e: ServerEvent) => void): () => void
  send(cmd: ClientCommand): void
}

// ---- One shared clock (drives event emission + waveform + tiles) ----

/** Describes the input a human-in-the-loop checkpoint needs (drives the form). */
export type InputRequest =
  | { kind: 'correctWord'; title: string; lineId: string; wordIndex: number; alternatives: string[] }
  | { kind: 'selectSlot'; title: string }
  | { kind: 'confirmBooking'; title: string; deposit?: string }
  | { kind: 'payment'; title: string; card: string }
  /** Unrecoverable agent error — the operator must take over. Carries the reason. */
  | { kind: 'handoff'; title: string; reason: string; detail?: string }
  /** The caller hung up mid-booking — the operator chooses how to recover. */
  | { kind: 'callerDropped'; title: string; service?: string; stylist?: string; time?: string }

/** Pure media/timing plane. Carries only playback state — never control or
 *  human-in-the-loop state (that travels as events into `Call`). In production
 *  this would come from the audio stream, independent of `CallTransport`. */
export interface ClockState {
  elapsed: number // ms
  duration: number // ms
  progress: number // 0–1
  level: number // 0–1 amplitude at the playhead
  playing: boolean
  ended: boolean
}

export interface ClockController {
  getState(): ClockState
  subscribe(cb: () => void): () => void
  play(): void
  pause(): void
  toggle(): void
  seek(ms: number): void
}

/** A transport that also exposes a controllable clock (the mock). */
export interface ClockedTransport extends CallTransport {
  clock: ClockController
}
