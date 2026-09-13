# High-Level Design — Zoca AI Front Desk (Voice → Booking)

A frontend-only operator console for a salon's AI front desk. The operator watches a
live AI-handled call, sees the agent's reasoning as a step trace, and can step in,
correct low-confidence transcription, adjust the booking, and confirm — with graceful
recovery when things go wrong. Backend is **mocked behind a real-shaped transport**.

> Companion docs: `SPEC.md` (product/interaction spec), `DESIGN.md` (design tokens),
> `FRONTEND.md` (coding conventions). This HLD covers architecture.

---

## 1. Architecture at a glance

```
                          ┌─────────────────────────────────────────────┐
                          │                 VIEW LAYER                    │
                          │  pages/ConsolePage  ──►  domain components     │
                          │        ▲   │ commands        (presentational)  │
                          │  state │   ▼                                   │
                          └────────┼───┼──────────────────────────────────┘
                                   │   │
                        useCall()  │   │  useCallSend(cmd)
                                   │   ▼
                          ┌────────┴───────────────┐        STATE LAYER
                          │        CallStore        │  (reducer + subscribe)
                          │  applyEvent(call, evt)  │
                          └────────▲───────┬────────┘
                          ServerEvent      │ ClientCommand
                                   │        ▼
                          ┌────────┴────────────────┐        API / TRANSPORT LAYER
                          │      CallTransport       │  (interface)
                          │  MockTransport (now)     │
                          │  WebSocketTransport (future)
                          └──────────────────────────┘
                                   ▲
                          media plane (audio): local .mp3 + useAudio clock
```

Three layers, one-directional data flow:

- **Transport (API) layer** emits `ServerEvent`s and accepts `ClientCommand`s.
- **State layer** folds events into a single `Call` object and dispatches commands.
- **View layer** renders `Call` and raises operator intents as commands.

The design principle throughout: **UI is a pure function of `Call`; everything
consequential is an event or a command.** Swapping the mock for a real socket touches
only the transport layer.

---

## 2. Folder structure

```
src/
├── main.tsx                    # entry: fonts, tokens, mount <App>
├── App.tsx                     # shell: header, theme toggle, view switch
│
├── pages/
│   └── ConsolePage.tsx         # the operator console (resizable split)
│
├── components/
│   ├── ui/                     # generic, product-agnostic primitives
│   │   ├── Button, IconButton, StatusChip, Badge, Card, Dialog,
│   │   │   Select, Switch, Tabs, Tooltip, TextInput, Avatar,
│   │   │   Skeleton, Spinner, EmptyState, Toast, Divider,
│   │   │   ResizableSplit
│   │   └── index.ts            # barrel export
│   │
│   └── domain/                 # product-specific, compose ui/
│       ├── SpeakerTile         # Meet-style glowing participant tile
│       ├── Waveform            # seekable amplitude bars
│       ├── CallDock            # transport + phone controls (frosted glass)
│       ├── RecordingIndicator  # persistent rec/privacy badge
│       ├── TranscriptLine      # a speaker turn
│       ├── ConfidenceWord      # word-level confidence + correction popover
│       ├── CallerContextCard   # caller identity + history
│       ├── StepShell           # one agent step (state + body + recovery)
│       ├── TurnGroup           # groups steps per utterance (collapsible)
│       ├── SlotCard            # recommendation + "why this fits"
│       ├── DepositForm         # deposit toggle + masked card
│       ├── CallSummary         # internal recap
│       ├── CustomerConfirmationCard  # customer-facing SMS
│       ├── RecoveryActions     # the 4 recovery archetypes
│       └── ConfidenceMeter     # compact confidence readout
│
├── types/                      # data models + wire contract (source of truth)
│   └── call.ts                 # Call, Turn, Step, Slot, ServerEvent, ClientCommand…
│
├── store/                      # state management (framework-agnostic core)
│   ├── callStore.ts            # applyEvent reducer + CallStore (subscribe/send)
│   ├── callContext.ts          # React context holding the store (no JSX)
│   └── CallProvider.tsx        # provider component; connects store on mount (JSX → .tsx)
│
├── hooks/                      # React hooks (pure .ts — no JSX)
│   ├── useCall.ts              # useCall() + useCallSend() over the store
│   ├── useAudio.ts             # <audio> controller + peak decoding
│   └── useTheme.ts             # light/dark theme hook
│
├── mock/                       # mock backend (swappable for a real transport)
│   └── mockTransport.ts        # scripted CallTransport implementation
│
├── lib/                        # pure, framework-free utilities
│   ├── audio.ts                # waveform generation / sampling / formatTime
│   └── cn.ts                   # className merge (clsx + tailwind-merge)
│
├── styles/
│   └── tokens.css              # design tokens (light + dark, incl. --dock-*)
│
├── preview/                    # dev-only component galleries (not shipped UX)
│   └── FoundationsShowcase, DomainShowcase, showcase-kit
│
└── index.css                   # Tailwind import + @theme token mapping + base
```

**Why the split** (addressing the review notes):
- **`store/`, `hooks/`, `mock/`, `types/` are separate top-level concerns**, not lumped
  into `lib/`. `lib/` is now reserved for pure, React-free utilities.
- **Hooks are pure `.ts`.** `useCall.tsx` was `.tsx` only because it also held the
  `CallProvider` JSX. That's now split: the **provider** (JSX) lives in
  `store/CallProvider.tsx`, the **context** in `store/callContext.ts`, and the **hooks**
  in `hooks/useCall.ts` (no JSX → correctly `.ts`).
- **Mock backend is isolated** in `mock/`, so replacing it with a real
  `WebSocketTransport` is a folder-local change.

**Layering rule:** `pages → components/domain → components/ui`; `store`/`hooks`/`mock`
depend on `types` (+ `lib`). Nothing in `store`/`types`/`lib` imports from `components`
except *type-only* (`Slot`, `TranscriptWord`) to avoid runtime coupling.

---

## 3. Data models (`types/call.ts`)

The **single source of truth** for shapes. Consumed by the store, transport, and views.

```ts
type StepOutcome = 'running' | 'success' | 'warning' | 'error' | 'waiting'
type Speaker = 'caller' | 'ai' | 'system'

type StepType =                                                     // agent ACTIONS (verbs)
  | 'transcribe' | 'assess_confidence' | 'classify_intent' | 'compose_reply' // spine
  | 'clarify' | 'update_context' | 'capability' | 'availability' | 'recommend'
  | 'hold' | 'conflict_check' | 'deposit' | 'payment' | 'confirm' | 'notify'
  | 'hold_booking' | 'schedule_callback'          // recovery-specific actions

interface Step { id; type: StepType; state: StepOutcome; statusLabel?; detail?; output?: unknown }
interface Turn { id; speaker; trigger; time?; steps: Step[]; status: StepOutcome; summary? }

interface TranscriptWord { text; confidence: number; alternatives?: string[]; corrected? }
interface TranscriptLineData { id; speaker: 'caller'|'ai'; words: TranscriptWord[]; time?; final }

interface Slot { id; time; stylist; stylistRating?; duration; price; services[]; reasons[]; recommended?; unavailable? }
interface DraftBooking { services[]; stylist; slotId; depositRequired; depositAmount }

interface Call {
  connected; recording; operatorInControl; muted; speakerOn; ended  // call/control flags
  transcript: TranscriptLineData[]   // LEFT panel (human view)
  turns: Turn[]                      // RIGHT panel (agent trace)
  slots: Slot[]                      // current recommendations (output of `recommend`)
  draft?: DraftBooking               // the editable booking (committed by `confirm`)
}
```

**Steps are verbs; these interfaces are the nouns those verbs produce/consume.** This is
the key distinction behind the review questions:

- **Why is `recommend` a step but `Slot` a model, not a step?** `recommend` *is* a
  `StepType` (the agent action). `Slot[]` is that step's **output payload** — the data it
  produces (`Step.output`, surfaced to the view as `call.slots`). A card isn't an action.
- **Why is booking not a step?** Confirming *is* a step (`confirm`); `deposit`/`payment`
  are steps too. `DraftBooking` is the **mutable state** the operator edits *before* the
  `confirm` step commits it — data, not an action.
- **Why is `detect_drop` no longer a `StepType`?** *(fixed per review.)* A caller drop is
  an **external event**, not something the agent *does*. It arrives as
  `call.state { connected: false }` and starts a **system-triggered turn** whose `trigger`
  is the drop; the agent's *response* — `hold_booking`, then re-engage via `notify` /
  `schedule_callback` — are the steps. So the drop is the turn's cause, and only the
  reactions are steps. `detect_drop` was removed from `StepType`.
- **Why no generic `recover` step?** *(fixed per review.)* "Recover" was too broad —
  recovery is error-specific. Two separate ideas: the **recovery *options*** are the four
  UI archetypes in `RecoveryActions` (retry / degrade / alternative / escalate); the
  **recovery *outcome*** is almost always a **re-run of an existing step** (retry `payment`,
  re-run `recommend` for a lost slot, re-run `availability`/`recommend` to reassign after a
  conflict) or a **specific action** (`clarify` for low confidence, `hold_booking` +
  `notify`/`schedule_callback` for a drop). So `recover` was removed; the concrete step
  vocabulary already expresses every recovery path.

Other modeling decisions:
- **`transcript` and `turns` are separate.** Transcript is the human-facing conversation
  (left); turns are the agent's step trace (right). They correlate by turn/line ids.
- **`Step.output` is `unknown`**, narrowed by the renderer per `type` (e.g. `recommend` →
  `Slot[]`, `assess_confidence` → `{ word, confidence }`). Keeps the wire generic; views
  own the interpretation.
- **One `Call` object.** No duplicated call data elsewhere; derived values
  (`activeSpeaker`, volume `level`, overall turn status) are computed at the edge.

---

## 4. API / transport layer

Frontend-only, but written against the interface a real backend would expose, so it is
**swappable without touching state or views**.

```ts
interface CallTransport {
  connect(): void
  close(): void
  subscribe(handler: (e: ServerEvent) => void): () => void
  send(cmd: ClientCommand): void
}
```

**Two planes** (see SPEC §11b):
- **Media plane (audio):** production = WebRTC / telephony media socket. Here = local
  `public/audio/call.mp3` driven by `useAudio` (rAF-smooth clock, decoded peaks). Not part
  of `CallTransport` — it's a separate concern the view consumes directly.
- **Event plane:** production = **one bidirectional WebSocket**. Here = `MockTransport`.

**Wire contract:**

```ts
type ServerEvent =            // server → client (things to render)
  | call.state | turn.started | turn.status
  | transcript.line | transcript.delta | transcript.final
  | step.started | step.updated
  | recommendation.updated | slot.taken | payment.result | booking.confirmed

type ClientCommand =          // client → server (operator intents)
  | takeOver | release | endCall | mute | speaker
  | correctWord | selectSlot | requireDeposit | chargeDeposit
  | confirmBooking | refreshAvailability
```

**MockTransport** = a scripted agent: `connect()` streams the greeting + request turns
(with the low-confidence "fades" step) on timers, emits `recommendation.updated`, and
fires `slot.taken` mid-decision to exercise stale availability. `send()` closes the loop —
`correctWord` re-emits recommendations, `chargeDeposit` → `payment.result`, etc. Edge
cases (payment decline, caller drop) are just scheduled/branched events.

**Production swap:** implement `WebSocketTransport` with the same interface (parse frames →
`ServerEvent`, serialize `ClientCommand` → frames; add heartbeat/reconnect, sequence
numbers for ordered replay, optimistic-then-confirmed actions). No store/view changes.

---

## 5. State layer

A tiny, dependency-free store (no Redux/Zustand needed for one aggregate).

- **`applyEvent(call, event): Call`** — a pure reducer; the only place events mutate state.
  Immutable updates; exhaustive over `ServerEvent`.
- **`CallStore`** — holds the current `Call`, `subscribe`/`getSnapshot` for React's
  `useSyncExternalStore`, binds to a `CallTransport` (subscribes to events on `connect`),
  and exposes `send(cmd)`.
- **Optimistic commands** — control toggles (mute/speaker/take-over/end) and transcript
  correction update `Call` locally *immediately* in `send()`, then forward to the
  transport; a real server would echo an authoritative event. This keeps the operator UI
  instant while remaining correct.

```
event:   transport ──emit──► CallStore.dispatch ──applyEvent──► setState ──► notify React
command: view ──useCallSend──► CallStore.send ──(optimistic setState)──► transport.send ──► (follow-up events)
```

Why not Redux/Zustand: one aggregate (`Call`), a clear event contract, and
`useSyncExternalStore` gives concurrent-safe subscriptions for free. Less machinery,
same guarantees.

---

## 6. View layer

- **`App`** — full-height shell: header (brand, view switch, theme toggle) + main. Hosts
  the light/dark theme (`data-theme`, no-flash inline script, token swap).
- **`ConsolePage`** — the product screen. Wrapped in `CallProvider` (mock transport) and
  laid out with `ResizableSplit`:

```
┌ LEFT — human view ────────────┬ RIGHT — agent view ───────────┐
│ SpeakerTiles (glow ← level)    │ [RecordingIndicator] (pinned) │
│ CallerContextCard              │ TurnGroup ▸ StepShell trace    │
│ TranscriptLine[] (confidence)  │   appended per turn.started    │
│ ── scroll ──                   │   ── scroll ──                 │
│ CallDock (transport+controls)  │                               │
└────────────────────────────────┴───────────────────────────────┘
```

- **Left = human view:** speaker tiles + transcript + caller context + call dock. Reads
  `call.transcript`, `call.muted/speakerOn/operatorInControl`; audio drives the shared
  clock (glow, transcript reveal). Controls dispatch commands.
- **Right = agent view:** `call.turns.map(TurnGroup)`; each turn renders its `steps` via a
  **step-type registry** (`StepType → label + icon`) into `StepShell`s. Completed turns
  collapse; the active turn stays open. Rich step outputs (SlotCard, DepositForm,
  ConfidenceMeter, correction) render by `type`.
- **Components are presentational** — `value + onChange`/`onSelect`; they never hold call
  state. Operator actions bubble up to `useCallSend`.
- **Responsive:** `ResizableSplit` drags on desktop and **auto-stacks** below ~860px.

**The connected flow** (the point of the product): correcting "fade" in a `ConfidenceWord`
→ `correctWord` command → optimistic transcript update + mock re-emits
`recommendation.updated` → `SlotCard`s refresh. One action visibly propagates end-to-end.

---

## 7. Communication & timing — how it all moves

- **One shared clock.** `useAudio` (playback time via `requestAnimationFrame`) is the
  single timeline. It drives: waveform playhead, speaker-tile glow (`level` sampled from
  decoded peaks), transcript reveal, and — conceptually — which step is `running`. No
  second timer may drift from it.
- **Event-sourced UI.** The mock streams events on timers as if a call were live; the store
  folds them; React re-renders the affected panel. Adding a turn = emit `turn.started` then
  `step.*` events; the right panel grows automatically.
- **Commands are intents, not mutations.** Views never mutate `Call` directly; they send
  commands. The store applies optimistic UI for control toggles and lets the transport be
  authoritative for everything consequential (recommendations, payment, booking).
- **Failure/edge handling is data.** `slot.taken`, `payment.result:false`,
  `call.state.connected:false` (drop) are ordinary events; the reducer + StepShell recovery
  actions turn them into calm, recoverable states.

---

## 8. Security & privacy

Handling call data means privacy is a first-class concern, even in a frontend-only slice.

**Data handling in the UI**
- **Mask all PII by default.** Phone (`+1 (415) •••-4821`) and card (`•••• 4242`) are
  rendered pre-masked; full values never enter the DOM. The store holds masked strings, not
  raw numbers.
- **No raw credential/payment entry.** There is no card-number/CVV field. Payment uses a
  display-only "card on file"; the actual charge would happen server-side (PCI stays off
  the client). The UI only expresses *intent* (`chargeDeposit`), never card data.
- **No secrets in the client.** No API keys/tokens in code, DOM, `localStorage`, or logs.
  Only non-sensitive UI prefs are persisted (theme, split ratio).
- **Recording/consent is visible.** A persistent recording + "Encrypted" indicator makes
  capture explicit (legal/consent requirement for call recording).

**Transport & backend boundary (production)**
- **AuthN/Z on the socket, not the client.** The `WebSocketTransport` authenticates with a
  short-lived token; the server authorizes which call/operator may subscribe. The client
  trusts server events; it never self-authorizes.
- **Server is authoritative for consequential actions.** `ClientCommand`s are *requests*.
  Optimistic UI is limited to reversible local toggles (mute/speaker); bookings, payments,
  and corrections are confirmed by server events — the client can't fabricate a booking.
- **Validate inbound events.** Real events would be schema-validated at the transport edge
  before hitting the reducer (guard against malformed/oversized frames); `applyEvent` treats
  `Step.output` as `unknown` and narrows, never trusting shape blindly.
- **Least-data principle.** The event stream carries only what the operator view needs;
  full customer records stay server-side and are fetched masked.

**App surface**
- **XSS:** React escaping only; no `dangerouslySetInnerHTML`; transcript/notes render as
  text. **Deps:** minimal, pinned; Radix/lucide are vetted. A strict CSP + HTTPS-only would
  be set at deploy.

---

## 9. Performance

The console is real-time (audio + streaming events), so the budget is about **smooth
playback and cheap re-renders**, not bundle size.

**Rendering**
- **One `rAF` loop while playing** (in `useAudio`), cancelled on pause/unmount — the only
  high-frequency updater. Volume-driven visuals (tile glow, waveform playhead) read from it;
  nothing else re-renders per frame.
- **`useSyncExternalStore` with immutable updates.** `applyEvent` returns new references only
  for the changed slice, so React can bail out of unaffected subtrees. Panels subscribe to
  the same store but only re-render when their slice changes.
- **Scoped subscriptions / selectors.** The left (transcript) and right (trace) panels read
  different parts of `Call`; selector hooks (or `memo` boundaries) keep a transcript delta
  from re-rendering the whole trace and vice-versa.
- **`memo` the leaves.** `TranscriptLine`, `StepShell`, `SlotCard` are memoized so appending
  one turn/word doesn't re-render the entire history.

**Work off the render path**
- **Decode audio peaks once** per source (`useAudioPeaks`), memoized; a synthetic waveform
  shows until decode completes. Waveform generation is `useMemo`'d.
- **CSS-driven motion**, not JS: glow/press/reveal animate `transform`/`opacity`/`box-shadow`
  (compositor-friendly), respecting `prefers-reduced-motion`.

**Scale & loading**
- **Virtualize when needed:** transcript/trace are plain lists now; if a call runs to
  hundreds of turns, windowing (e.g. virtual list) drops in behind the same components.
  Collapsing completed turns already caps mounted step nodes.
- **Bundle:** Vite code-splitting; the preview galleries are dev-only and can be excluded
  from the production entry. Inter is self-hosted/subset via `@fontsource`.
- **Backpressure (production):** coalesce rapid `transcript.delta`s per frame and drop stale
  `audio.level` frames so a chatty socket can't outrun the render loop.

---

## 10. Cross-cutting concerns

- **Design system:** tokens in `styles/tokens.css` → Tailwind `@theme`; components use
  semantic classes only; light/dark by token swap. Component-scoped tokens (`--dock-*`).
- **Accessibility:** keyboard-operable primary controls, `:focus-visible` rings, ARIA
  roles (`separator`, `meter`, `radio`, `aria-pressed`), `aria-live` for state changes,
  `prefers-reduced-motion`, color never the sole signal.
- **Reliability:** every async surface has loading/empty/error; every failable step has a
  recovery path (retry / degrade / alternative / escalate).
- **Testing seams:** pure `applyEvent` is unit-testable without React; `CallTransport` can
  be faked; components are presentational and snapshot-friendly.

---

## 11. Extensibility

- **New agent step:** add to `StepType`, add a renderer entry — no shell/store change.
- **Real backend:** implement `WebSocketTransport`; swap the transport passed to
  `CallProvider`. Store and views untouched.
- **Real STT partials:** already modeled — `transcript.delta` streams words; `.final`
  seals the line.
- **Multiple concurrent calls:** promote `Call` to `Call[]` keyed by id; the store and
  provider generalize; views scope to the active call.
