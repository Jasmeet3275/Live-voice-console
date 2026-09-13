# Architecture — Zoca AI Front Desk (Live Voice Console)

A **frontend-only** operator console for a salon's AI voice front desk. The operator
watches an AI-handled call unfold as a single, merged conversation feed — caller/AI
utterances interleaved with the agent's reasoning steps — and steps in at
human-in-the-loop checkpoints to correct low-confidence transcription, pick a slot,
handle payment, and confirm the booking. The backend is **mocked behind a real-shaped
transport**, so swapping in a live WebSocket touches only one layer.

> Companion docs: `PRD.md` (product brief), `SPEC.md` (interaction spec),
> `DESIGN.md` (design tokens), `FRONTEND.md` (coding conventions), `HLD.md` (original
> high-level design). **This document reflects the current implementation** and is the
> authoritative description of the shipped data model and communication contracts.
> Where it differs from `HLD.md`, this document is correct (see §10, Drift from HLD).

---

## 1. Architecture at a glance

```
                    ┌──────────────────────────────────────────────┐
                    │                  VIEW LAYER                    │
                    │  pages/ConsolePage ──► domain/ui components     │
                    │     ▲  state          │ commands                │
                    └─────┼───────────────┬─┼──────────────────────────┘
              useCall()   │   useClock()  │ │  useCallSend(cmd)
                          │               │ ▼
                 ┌────────┴───────┐  ┌────┴──────────────┐   STATE LAYER
                 │   CallStore    │  │  (clock snapshot)  │
                 │ applyEvent()   │  │   ClockState       │
                 └────────▲───────┘  └────▲──────────────┘
                 ServerEvent │   ClientCommand │  clock ticks / gates
                          │  ▼                 │
                 ┌────────┴────────────────────┴─────────┐   TRANSPORT LAYER
                 │      CallTransport  (interface)         │
                 │  MockTransport ── wraps ── CallDirector │   (the "backend")
                 │  WebSocketTransport (future, same API)  │
                 └─────────────────────────────────────────┘
```

Three layers, one-directional data flow:

- **Transport layer** emits `ServerEvent`s and accepts `ClientCommand`s. In the mock it
  also exposes a **clock** (`ClockedTransport`) that owns the timeline.
- **State layer** folds events into one immutable `Call` object and dispatches commands.
- **View layer** renders `Call` + `ClockState` and raises operator intents as commands.

**Core principle:** *the UI is a pure function of `Call` and `ClockState`; everything
consequential is either a `ServerEvent` or a `ClientCommand`.* Replacing the mock with a
real socket is a transport-local change.

---

## 2. Two data planes

The system distinguishes two concerns, exactly as a real deployment would, and keeps them
strictly separated:

- **Event plane** — server↔client messages (`ServerEvent` / `ClientCommand`) over one
  bidirectional channel. Carries **everything the operator acts on**, including the
  human-in-the-loop checkpoint (`input.requested` / `input.cleared`). Production = one
  WebSocket; here = `MockTransport`.
- **Media plane** — a clock that carries **only playback timing** (elapsed, duration,
  progress, amplitude, playing). It never carries control or HITL state. Production =
  telephony/WebRTC media timing; here = `CallDirector`, a real-time clock.

**Critical rule (and a fixed design flaw):** anything the UI needs to *decide what to do*
must arrive as a `ServerEvent` and live in `Call` — never on the clock. An earlier version
leaked the HITL "input needed" signal onto `ClockState`, which a real WebSocket backend
has no equivalent for; it is now a pair of real events (§7). The clock is a pure,
swappable media source.

The mock's `CallDirector` plays **both roles at once** — it is the event source *and* the
clock — but the two are delivered to the client through different interfaces
(`CallTransport.subscribe` vs `ClockController`), so in production they split cleanly: the
socket delivers events, the audio stream delivers timing.

**The clock free-runs.** A live call never stops, so a checkpoint does **not** pause the
clock. When the agent needs input it suspends *event emission* (a server concern) while
the clock keeps ticking; on resolution the remaining timeline is rebased so it resumes
with its authored pacing (§7).

---

## 3. Folder structure

```
src/
├── main.tsx / App.tsx           # entry + shell (scenario picker, providers)
│
├── pages/
│   └── ConsolePage.tsx          # the operator console (single merged feed)
│
├── types/
│   └── call.ts                  # SOURCE OF TRUTH: Call, Step, FeedItem, Slot,
│                                #   ServerEvent, ClientCommand, ClockState, Gate inputs
│
├── store/                       # state layer (framework-agnostic core)
│   ├── callStore.ts             # applyEvent() reducer + CallStore (subscribe/send)
│   ├── callContext.ts           # React context holding the store (no JSX)
│   ├── clockContext.ts          # React context holding the clock (no JSX)
│   └── CallProvider.tsx         # binds store + clock to a transport; connects on mount
│
├── hooks/
│   ├── useCall.ts               # useCall() (Call state) + useCallSend() (commands)
│   ├── useClock.ts              # useClock() (ClockState + play/pause/seek)
│   ├── useTheme.ts              # light/dark theme
│   └── useAudio.ts              # <audio> controller (available; not wired to console)
│
├── mock/                        # the mock backend (swappable)
│   ├── mockTransport.ts         # ClockedTransport: forwards to a CallDirector
│   ├── director.ts              # CallDirector: the single clock + event scheduler + gates
│   ├── scenarios.ts             # Timeline authoring + the 7 scenarios (edge cases)
│   └── salon.ts                 # static salon/caller reference data
│
├── components/
│   ├── ui/                      # generic primitives (Button, Dialog, Select, Badge,
│   │                            #   StatusChip, Tooltip, EmptyState, ResizableSplit…)
│   └── domain/                  # product components (compose ui/)
│
├── lib/                         # pure utilities (audio waveform gen/sample, cn)
└── styles/tokens.css            # design tokens (light + dark)
```

**Layering rule:** `pages → components/domain → components/ui`;
`store` / `hooks` / `mock` depend on `types` (+ `lib`). Nothing in `store` / `types` /
`lib` imports runtime code from `components` — only *type-only* imports (`Slot`,
`TranscriptWord`) cross that line, to keep the model decoupled from the view.

---

## 4. Data model (`types/call.ts`)

The single source of truth for shapes, consumed by store, transport, and views.

### 4.1 Vocabulary

```ts
type StepOutcome = 'running' | 'success' | 'warning' | 'error' | 'waiting'  // === Status
type Speaker     = 'caller' | 'ai' | 'system' | 'operator'

type StepType =                                          // agent ACTIONS (verbs)
  | 'transcribe' | 'assess_confidence' | 'classify_intent' | 'compose_reply'  // spine
  | 'clarify' | 'update_context' | 'capability' | 'availability' | 'recommend'
  | 'hold' | 'conflict_check' | 'deposit' | 'payment' | 'confirm' | 'notify'
  | 'hold_booking' | 'schedule_callback'                 // recovery-specific actions
  | 'handoff'                                            // escalate to a human on an unrecoverable error
```

`StepOutcome` is deliberately the same union as the shared UI `Status` vocabulary, so a
step's lifecycle state renders directly through `StatusChip` / `StepShell` with no
mapping. `'waiting'` doubles as the "human input needed" state.

### 4.2 Aggregate

```ts
interface Step { id; type: StepType; state: StepOutcome; statusLabel?; detail?; output?: unknown }

type FeedItem =                                          // ONE merged conversation stream
  | { kind: 'utterance'; id; speaker: 'caller'|'ai'; words: TranscriptWord[]; time?; final }
  | { kind: 'turn';      id; speaker: Speaker; steps: Step[]; status: StepOutcome; summary? }
  | { kind: 'notice';    id; text; tone: 'neutral'|'error' }

interface Call {
  connected; recording; operatorInControl; muted; speakerOn; ended  // call/control flags
  feed: FeedItem[]              // the single source for the console body (chronological)
  slots: Slot[]                // current recommendations (output of a `recommend` step)
  selectedSlotId?: string      // operator's current pick
  pending?: PendingInput       // the open HITL checkpoint (from input.requested), or undefined
  draft?: DraftBooking         // reserved; not currently populated
}

interface PendingInput {       // what the operator is being asked for, right now
  await: ClientCommand['type'] // which command resolves it
  request: InputRequest        // which form to render (kind: correctWord | selectSlot | …)
  hint?: string
  turnId?: string; stepId?: string  // the step this checkpoint blocks
}
```

**Key modeling decisions:**

- **One merged `feed[]`, not separate `transcript`/`turns` arrays.** The console is a
  single vertical stream where caller/AI utterances and agent reasoning `turn`s are
  interleaved in the order they happen, plus `notice` items for out-of-band events
  ("Caller disconnected", "You took over"). This matches the actual product screen (a
  single column), rather than a left/right split.
- **Steps are verbs; the other interfaces are the nouns those verbs produce.**
  `recommend` is a `StepType`; `Slot[]` is that step's **output payload** (surfaced as
  `call.slots`). `confirm`/`deposit`/`payment` are steps; `DraftBooking` is booking data.
- **`Step.output` is `unknown`,** narrowed by the renderer per `type` (`recommend` →
  `Slot[]`, `assess_confidence` → `{ word, confidence }`). The wire stays generic; views
  own interpretation and never trust shape blindly.
- **Recovery is not a generic step.** A caller drop is an *external event*
  (`call.state { connected:false }`) that starts a **system-triggered turn**; the agent's
  *reactions* (`hold_booking`, `notify`, `schedule_callback`) are the steps. Most other
  recoveries are just a **re-run of an existing step** (retry `payment`, re-run
  `recommend` after a lost slot, re-run availability after a conflict).

---

## 5. Communication contract (the wire protocol)

Written against the interface a real backend would expose, so it is swappable without
touching state or views.

```ts
interface CallTransport {
  connect(): void
  close(): void
  subscribe(handler: (e: ServerEvent) => void): () => void
  send(cmd: ClientCommand): void
}
interface ClockedTransport extends CallTransport { clock: ClockController }  // the mock
```

### 5.1 Server → client (`ServerEvent` — things to render)

| Event | Effect on `Call` |
|-------|------------------|
| `call.state {recording?,connected?,ended?}` | update flags; caller-drop injects an error `notice` |
| `turn.started {turnId,speaker,trigger,time?}` | append an empty `turn` feed item (status `running`) |
| `turn.status {turnId,status,summary?}` | set a turn's status/summary |
| `transcript.line {line}` | append an `utterance` feed item |
| `transcript.delta {lineId,word}` | append a streamed word to a line |
| `transcript.final {lineId}` | mark a streaming line final |
| `step.started {turnId,step}` | append a step to its turn |
| `step.updated {turnId,stepId,state,statusLabel?,detail?,output?}` | patch a step |
| `recommendation.updated {slots}` | replace `slots`, auto-select the recommended one |
| `slot.taken {slotId}` | mark a slot unavailable |
| `input.requested {await,request,hint?,turnId?,stepId?}` | set `call.pending` — the agent needs operator input |
| `input.cleared` | clear `call.pending` — checkpoint resolved/abandoned |
| `payment.result {ok}` / `booking.confirmed` | currently no-ops (outcomes come via `step.updated`) |

### 5.2 Client → server (`ClientCommand` — operator intents)

```
takeOver | release | endCall | mute | speaker           // call control
correctWord | selectSlot                                // checkpoint resolutions (with input)
requireDeposit | chargeDeposit | waiveDeposit           // payment checkpoint
confirmBooking | refreshAvailability                    // booking checkpoint
operatorBook {services,stylist,time,deposit?}           // manual booking (take-over wizard)
```

`chargeDeposit` and `waiveDeposit` are **distinct** commands so the two payment-checkpoint
buttons resolve to different outcomes ("Charged" vs "Waived") rather than both charging.

---

## 6. State layer (`store/callStore.ts`)

A tiny, dependency-free store — no Redux/Zustand needed for a single aggregate.

- **`applyEvent(call, event): Call`** — a pure, immutable reducer; the only place events
  mutate state. Unit-testable without React.
- **`CallStore`** — holds the current `Call`, exposes `subscribe` / `getSnapshot` for
  `useSyncExternalStore`, subscribes to the transport on `connect()`, and exposes
  `send(cmd)`.
- **Optimistic commands** — `applyCommandOptimistic` applies reversible operator actions
  locally *before* forwarding to the transport, so the UI feels instant: mute/speaker,
  take-over/release (with a `notice`), `selectSlot`, `correctWord`, `endCall`,
  `operatorBook`. Consequential outcomes (recommendations, payment, confirmation) remain
  server-authoritative via events.

```
event:   transport ─emit─► CallStore.dispatch ─applyEvent─► setState ─► notify React
command: view ─useCallSend─► CallStore.send ─(optimistic setState)─► transport.send ─► follow-up events
```

> **Reconciliation note:** optimistic feed items are keyed by `feed.length` and there is
> no id-based dedup yet. Against a real socket that *echoes* an authoritative event for
> the same action (e.g. `operatorBook`), this could double-render — commands will need
> stable client ids and the reducer a reconcile step. Fine for the mock (no echo).

---

## 7. The clock & human-in-the-loop (`mock/director.ts`, `mock/scenarios.ts`)

`CallDirector` is the mock **backend** — a real-time clock plus the agent-graph runtime.

- **Timeline (the graph).** A scenario's `build(tl)` pushes `TimelineItem { delay, event,
  gate? }`s into a `Timeline` (helpers: `.at()`, `.say()`, `.step()`, `.gateAt()`). The
  director sorts them by `delay`; `duration = lastDelay + 1500ms`.
- **Advance (the runtime).** A `requestAnimationFrame` loop grows `elapsed`; `advance()`
  emits every item whose `delay <= elapsed`, in order. The clock also samples the waveform
  amplitude (`level`) at the playhead.
- **The clock free-runs — a checkpoint never stops it.** A live call doesn't pause because
  the agent needs a human. So on reaching a gate the director suspends **event emission**
  (`suspended = true`) but the clock keeps ticking: the timer counts up, the waveform keeps
  animating, and `duration` is stretched so the call never "ends" mid-wait.
- **Gates emit events, not clock state (HITL).** When `advance()` hits an item carrying a
  `gate`, it emits the item (a step entering `waiting`), then emits
  **`input.requested { await, request, hint, turnId, stepId }`**. That event folds into
  `Call.pending`, which is what `HumanInputModal` renders. **Nothing is written to
  `ClockState`** — the checkpoint travels entirely on the event plane, exactly as a real
  WebSocket backend would deliver it.
- **Resolution + rebase.** `onCommand(cmd)` resolves the open checkpoint when `cmd.type`
  matches the gate's `await` (or `awaitAlt`, e.g. `waiveDeposit`). It fires the resolver —
  `onResolve` (fixed events), `onResolveWithInput(input)` (the corrected word → intent, or
  chosen slot → confirmation line — the *conditional edge*), or `onResolveAlt` — then emits
  **`input.cleared`** (closing the modal) and **rebases** the not-yet-emitted timeline by
  the time the operator spent deciding, so the rest resumes with its authored pacing
  instead of firing in a burst.
- **Control commands.** `takeOver` emits `input.cleared`, abandons the checkpoint, and
  suspends the AI while the clock keeps running (the call is still live); `release` resumes
  the AI; `endCall` clears any checkpoint, marks `ended`, and stops the clock for good.

```ts
interface ClockState {                // pure media plane — timing only
  elapsed; duration; progress; level; playing; ended
}
// The checkpoint lives in Call.pending (from input.requested), NOT here:
type InputRequest =
  | { kind:'correctWord'; title; lineId; wordIndex; alternatives[] }
  | { kind:'selectSlot'; title }
  | { kind:'confirmBooking'; title; deposit? }
  | { kind:'payment'; title; card }
  | { kind:'handoff'; title; reason; detail? }   // unrecoverable error → operator must take over
```

**Round-trip:**

```
gate reached → emit(step waiting) + emit(input.requested) ; clock keeps running
   → Call.pending set → HumanInputModal renders
   → operator sends the awaited ClientCommand
   → resolver events (branch on input) + emit(input.cleared) + rebase remaining timeline
   → Call.pending cleared → modal closes → call plays on
```

This is verified headlessly (`scratchpad` harness): `input.requested` fires, the clock
stays `playing` and `elapsed` keeps growing through the wait, `input.cleared` fires on
resolve, `classify_intent` reflects the chosen word, and the next checkpoint arrives
rebased.

### Scenarios (edge-case coverage, `scenarios.ts`)

Nine scripted paths share `addIntro → recommendStep → selectAndClose → addBookingTurn`
(the last hands off instead of booking). Each is focused on **one** concern — the
low-confidence fade checkpoint lives only in `low-confidence`; every other path
transcribes cleanly (`addIntro`'s `clarify` option is off by default):

| id | Path exercised |
|----|----------------|
| `happy` | clean request → recommend → pick → confirm → booked |
| `low-confidence` | "fades" heard at 61% → operator confirms the word → intent updates → booked |
| `slot-lost` | picked slot was just booked → re-recommend vacant slots → pick again |
| `payment-declined` | deposit charge declined → retry **or waive** → booked |
| `caller-dropped` | caller hangs up before confirming → hold booking + SMS + callback |
| `staff-conflict` | picked stylist double-booked → reassign to a free stylist |
| `no-availability` | nothing tomorrow evening → offer next-day slots |
| `service-down` | scheduling service fails after a retry → agent **hands off** with the error reason → operator takes over to book manually |
| `availability-glitch` | scheduling service times out → auto-retry → recommend |

---

## 8. View layer (`pages/ConsolePage.tsx`)

- **`App`** — providers (`Toast`, `Tooltip`) + a scenario picker. Selecting a scenario or
  restarting bumps a `runId`, which remounts `ConsolePage` with a fresh `MockTransport`
  (clean timeline each run).
- **`ConsolePage`** — wraps everything in `CallProvider` (which wires the store **and** the
  transport's clock into context). Layout: a header (`DemoBar` transport + scenario select
  + `CallStatus`), a scrolling merged **`Feed`**, a floating `CallerPanel` and
  `RecordingIndicator`, a bottom `CallDock`, and the modal overlays.
- **`Feed`** renders `call.feed` in order: `utterance` → `TranscriptLine` (word-level
  confidence via `ConfidenceWord`); `turn` → `AgentBlock` (collapsible step trace, each
  step via a `STEP_META` type→label/icon registry into `StepShell`; rich outputs like
  `SlotCard` / `ConfidenceMeter` render by type); `notice` → an inline pill. Auto-scrolls
  to the latest activity.
- **`CallDock`** — presentational transport: `MiniSpeaker` indicators, seekable
  `Waveform`, timer, mute/speaker, end-call (confirm dialog), and take-over / hand-back /
  book. All actions dispatch commands; it holds no state.
- **`HumanInputModal`** — the single blocking checkpoint surface. It reads `clock.request`
  and renders the matching form (correct-word, select-slot, confirm-booking, payment),
  each sending the command the gate awaits. A "Take over" escape hatch is always present.
- **`TakeOverWizard`** — manual booking flow the operator drives after taking over; emits
  `operatorBook`.

**Components are presentational** (`value + onChange`); operator actions bubble up to
`useCallSend`. The connected story: correcting "fades" in the modal → `correctWord` →
optimistic transcript update + the gate's resolver flows the chosen word into
`classify_intent` → the rest of the flow stays consistent. One action propagates
end-to-end.

---

## 9. Cross-cutting concerns

- **Security/privacy.** PII is pre-masked (`+1 (415) •••-4821`, `•••• 4242`); no raw
  card/CVV entry exists — the UI only expresses *intent* (`chargeDeposit`), the charge
  would happen server-side (PCI off-client). No secrets in the client; recording/consent
  is a persistent, visible indicator. In production the socket authenticates with a
  short-lived token, the server authorizes subscriptions and is authoritative for
  consequential actions, and inbound events are schema-validated before the reducer.
- **Performance.** One `rAF` loop (the director) while playing; `useSyncExternalStore`
  with immutable slice updates lets React bail out of unaffected subtrees; the `Feed` and
  its leaves are memoized so appending one turn/word doesn't re-render history. Collapsed
  turns cap mounted step nodes; a chatty real socket would coalesce `transcript.delta`s
  per frame.
- **Accessibility.** Keyboard-operable controls, `:focus-visible` rings, ARIA roles
  (`dialog`, `radiogroup`, `meter`, `aria-pressed`, `role="status"`), color never the sole
  signal, motion respects `prefers-reduced-motion`. Modals use an accessible `Modal`
  primitive (Radix Dialog: focus trap, initial focus via `data-autofocus`, Escape, focus
  restore); a `LiveAnnouncer` exposes polite transcript + assertive alert live regions; a
  global `useKeyboardShortcuts` layer (with a `?` help sheet) drives the operator actions;
  `<main>` landmark + skip link. See `ACCESSIBILITY.md` for the full audit.
- **Testing seams.** `applyEvent` is a pure function; `CallTransport` is fakeable; the
  director's gate/resolver logic is deterministic given a scenario.

---

## 10. Testing

The layering makes the app testable without a browser for almost everything: the reducer is
pure, the transport is an interface, and the director is deterministic. Tests mirror that
structure — heaviest at the bottom (pure logic), lightest at the top (a few e2e flows).

**Tooling:** Vitest + Testing Library (jsdom) for unit/component; Cypress for e2e; V8 for
coverage. Config: `vitest.config.ts` (a separate config from `vite.config.ts` so tests skip
the tailwind / react-compiler build plugins) and `cypress.config.mjs`.

```
npm run test:run        # unit/component, once
npm run test:coverage   # + V8 coverage (text + coverage/index.html)
npm run e2e             # boots the app on :4173 and runs Cypress headless
```

**What's tested where:**

| Layer | How it's exercised |
|-------|--------------------|
| **State (`applyEvent`, `CallStore`)** | Pure-function assertions over every `ServerEvent`; a `FakeTransport` drives optimistic `ClientCommand`s. No DOM. |
| **Mock backend (`CallDirector`)** | A manual rAF clock (stubbed `requestAnimationFrame`/`performance.now`) advances the director; tests assert emitted **event sequences** — `input.requested` fires while the clock stays `playing`, the fade checkpoint appears in exactly one scenario, booking scenarios emit a terminal `call.state{ended}`, etc. |
| **Components** | Testing Library: the checkpoint modal (two-step Enter, hand-off, payment), dock (disabled-before-start), transcript/confidence, slot card, wizard stepper, live-region announcer, summary, primitives. Radix portals/pointer APIs are polyfilled in `src/test/setup.ts`. |
| **Hooks & helpers** | `useKeyboardShortcuts`, `useTheme`, `deriveCallSummary`, `lib/audio`. |
| **End-to-end (Cypress)** | Drives the real app: happy path → booked → summary, the low-confidence correction, the service-outage hand-off, and keyboard shortcuts. |

**Why this shape works:** because control state travels as events (not a side-channel), a
`FakeTransport` that just records `send()` and re-emits `ServerEvent`s is enough to test the
whole client; and because the director is the single clock, stubbing rAF makes time itself a
test input — no waiting, no flake. Coverage sits around **90%** of shipped `src/`;
`ConsolePage` (the composition root) is covered by e2e, with its pure logic
(`deriveCallSummary`) unit-tested directly. See `Live-voice-console/README.md` for the
full command list.

---

## 11. Drift from `HLD.md` (why this doc exists)

`HLD.md` captured the *original* design; the implementation evolved. Current truths:

- **Single merged `feed: FeedItem[]`**, not separate `transcript[]` + `turns[]` arrays,
  and a **single-column console**, not a left/right `ResizableSplit`. (`ResizableSplit`
  and `SpeakerTile` still exist as primitives but aren't wired into the console.)
- **The clock is `CallDirector`** (a synthetic timeline that also schedules events), not
  `useAudio` driving off an `<audio>` element. `useAudio` remains available but the
  console consumes `useClock()` from the director.
- **Human-in-the-loop** is central to the current architecture and was not in the original
  HLD. It is delivered as `input.requested` / `input.cleared` events → `Call.pending` →
  `HumanInputModal` (an earlier iteration put it on `ClockState`; that leak is fixed — the
  clock is now pure media and the call never stops for a checkpoint).
- **`Speaker` includes `'operator'`;** `ClientCommand` gained `waiveDeposit` and
  `operatorBook`.

---

## 12. Extensibility

- **New agent step:** add to `StepType`, add a `STEP_META` entry (label + icon) and, if it
  has a rich payload, a renderer branch — no store/shell change.
- **Real backend:** implement `WebSocketTransport` against `CallTransport` (parse frames →
  `ServerEvent`, serialize `ClientCommand`; add heartbeat/reconnect, sequence numbers,
  optimistic-then-confirmed reconciliation) and pass it to `CallProvider`. Store and views
  untouched. The clock then comes from the media stream instead of the director.
- **New scenario / edge case:** add a `Scenario` in `scenarios.ts` using the `Timeline`
  helpers and gates — no code outside `mock/` changes.
- **Multiple concurrent calls:** promote `Call` to a keyed collection; the store/provider
  generalize and views scope to the active call.
