# Zoca AI Front Desk — Voice to Booking · SPEC

A focused, polished front-end slice for a salon's AI-powered front desk. An AI agent
handles the call; a human operator can understand what's happening and step in at any
moment. Frontend only — everything backend is mocked.

**Canonical test case (the whole product must demo cleanly against this):**
> "Hi, I need a haircut and beard trim tomorrow evening. I prefer someone good with
> fades. What is available?"

- Two services → duration stacking
- "tomorrow evening" → fuzzy time → concrete slots
- "good with fades" → stylist *capability* matching
- **"fade" is the deliberate mishearing trap** (→ "facial"). The confidence + correction
  story is built around this one word.

---

## 1. Product principles (the rubric, internalized)

1. **Judgment over feature count.** A small, complete, connected slice beats many
   disconnected screens. Cut scope deliberately and say so in the README.
2. **Calm, informed, recoverable.** No alarm-red everywhere; the operator always knows
   what the AI knows and *why*; every wrong state has an obvious next action.
3. **Show uncertainty, don't hide it.** Confident output looks normal; only genuinely
   doubtful items draw attention. Make the operator *more* confident when the AI is unsure.
4. **Audio is connected, never decorative.** One clock drives audio, transcript, speaker
   tiles, and the step trace together.

---

## 2. The timing / mental model (resolves the "is this realistic?" question)

The AI runs the conversation in real time, but **every consequential step has a
human-supervisable pause in front of it.**

```
Call LIVE ───────────────────────────────────────────────► Call ends
 1. Caller states need
 2. AI extracts intent, proposes slots (fast, automatic)
 3. ⟵ OPERATOR supervises/edits HERE, during the natural "let me check…" pause ⟶
 4. AI offers the (corrected) options to the caller
 5. Caller picks → confirmed + deposit
                                                        ▼
                                              Caller hangs up (final)
```

- The operator does **not** race the AI word-by-word. Confidence **gates** autonomy: on
  low confidence the AI defers / asks the caller to clarify rather than acting.
- Editing happens in the pause **before** the caller commits — never behind the caller's
  back after they hang up.
- **Take Over** exists for the cases where the operator must intervene live.
- Because the supervise window is human-paced, availability can go **stale mid-decision**
  and the caller can **drop** — those aren't bugs, they're the required failure states.

---

## 3. Layout

Split screen. **Left = human view. Right = agent view.** Panels split vertically; the
divider is drag-resizable (nice-to-have, do last).

```
┌──────────────────────────────┬──────────────────────────────┐
│ LEFT — human view            │ RIGHT — agent view           │
│ ┌──┐┌──┐  ← speaker tiles    │ chat-style feed of TURN       │
│ │Cx││AI│    (absolute,       │ GROUPS; each group = the      │
│ └──┘└──┘     top-left)       │ variable chain of steps that  │
│                              │ ran for that utterance,       │
│ live transcript (both        │ appended as they run.         │
│ speakers, confidence)        │                               │
│                              │  ▸ past group (collapsed)  ✔  │
│ caller context card          │  ▾ active group (expanded) …  │
│                              │     ● step ✔                  │
│ ┌──────────────────────────┐ │     ● step ⚠ → [recovery]     │
│ │ audio player + waveform  │ │     ● step ● running          │
│ │ [Take Over][mute][spk][⏹]│ │                               │
│ └──────────────────────────┘ │                               │
└──────────────────────────────┴──────────────────────────────┘
```

**Mobile / narrow:** the two panels **stack into tabs** ("Call" / "Agent"). Speaker tiles
and audio+controls pin to the top/bottom of the Call view. No horizontal scroll. The
primary controls stay full-size and keyboard-accessible.

---

## 4. Left panel — human view

### 4.1 Speaker tiles (Google-Meet style)
- Two tiles, absolute top-left: **Customer** and **AI Agent**.
- The active speaker's tile **glows**; glow intensity ∝ speaker volume at `currentTime`.
- Driven from data on the shared clock — no real mic analysis:
  - *Who* → `activeSpeakerAt(t)` from transcript segments (`speaker`, `startTime`/`endTime`).
  - *How loud* → sample the **waveform amplitude array** at `t` (same array that draws the waveform).
- **Take Over swap:** on Take Over, the "AI Agent" tile becomes **"You (Operator)"** and
  takes the glow — the tiles reflect the real handoff.
- **A11y:** pair glow with a "speaking" label + mic icon + name; `aria-live="polite"`
  announces speaker changes (throttled); respect `prefers-reduced-motion` (static ring
  instead of pulsing).

### 4.2 Live transcript
- Moving two-sided script; segments reveal as `currentTime` reaches `startTime`.
- Speaker turns (Caller / AI).
- **Per-segment confidence signal:** confident words render normally; low-confidence
  words get an amber wavy underline + a small `⚠ 61%` affordance.
- Clicking a transcript line highlights its group on the right (shared `turnId`).

### 4.3 Caller context card
- Name, phone (masked), tags, **previous visits** (last stylist, usual service).
- Populated by the `caller_lookup` step; degrades gracefully to "New guest" on error.

### 4.4 Audio player + controls (pinned bottom)
- Waveform / playback-progress indicator. **Simulated playback** driven by the shared
  clock (forward-only "live" framing). Play/pause to freeze during demo.
- **Per-audio recording/privacy badge** (`🔴 Recording · 🔒 Encrypted`) — always visible
  while the active call records.
- **Call controls:** **Take Over**, mute, speaker, end call. Take Over is deliberate
  (confirm / clear mode-switch) and visibly flips the app into "operator driving".

---

## 5. Right panel — agent view (chat-style step trace)

React Flow is **not** used. The right panel is a chat-like feed of **turn groups**;
components append as steps run, exactly like tool/step traces under an assistant turn.

### 5.1 Grouping
- Unit = **Turn (Exchange)**: `{ trigger, steps[], outcome }`, keyed by `turnId`.
- **Every interaction produces a group — greeting included.** Same canonical pipeline,
  variable depth (short path for a greeting, long path for a booking).
- Trigger = a caller/AI utterance **or** a system event ("call connected", "silence").
- **Collapse history:** completed groups collapse to a one-line summary; the active group
  stays expanded; auto-scroll to newest.
- **Left↔right correlation:** shared `turnId`; the active group == what's playing on the
  shared clock.

### 5.2 Reusable shells (consistent states everywhere)
- **Group shell:** header (echoed trigger, timestamp, overall state chip, collapse toggle)
  → mapped step components → optional outcome footer ("AI said: …").
- **Step shell:** icon + **human label** ("Understanding request", not `extractIntent`) +
  state chip (`running · success · warning · error · waiting`) + type-specific body +
  recovery/action row when warning/error/waiting.
- **Rich interactions live in accessible DOM** (correction, slot edit, deposit form) —
  fully keyboard/ARIA, never buried in a canvas.

### 5.3 Step-type → component registry
```ts
const STEP_RENDERERS: Record<StepType, React.FC<{ step: Step }>> = {
  transcribe: TranscribeStep, assess_confidence: ConfidenceStep,
  classify_intent: IntentStep, clarify: ClarifyStep,        // fade→facial
  update_context: ContextStep, capability: CapabilityStep,
  availability: AvailabilityStep, recommend: SlotRecommendStep,
  hold: HoldStep, conflict_check: ConflictStep, deposit: DepositStep,
  payment: PaymentStep, confirm: ConfirmStep, notify: NotifyStep,
  detect_drop: DropStep, hold_booking: HoldBookingStep, recover: RecoveryStep,
  compose_reply: ReplyStep,
};
```
Add a step type = add one renderer. Short and long paths render identically.

---

## 6. The canonical pipeline (graph that stays the same)

Every turn runs the **spine**; the **middle** expands by intent; **every step can branch
on its outcome**.

```
SPINE (always): transcribe → assess_confidence → classify_intent → … → compose_reply

MIDDLE (by intent):
  greeting/smalltalk    → (nothing → reply)
  gives booking info    → update_context → capability → availability → recommend
  confirms a slot       → hold → conflict_check → deposit → payment → confirm → notify
  correction/clarify    → apply correction → re-run downstream
  low-confidence/unclear→ clarify (human-in-the-loop)
  silence / hangup      → detect_drop → hold_booking → recover
```

### 6.1 Branching is per-step OUTCOME, not just intent
Any step resolves to `success | warning | error | waiting` and routes accordingly.
The path a turn takes = **intent × the outcome of each step it hits**.

```
        <any step>
   success → next happy step
   warning → detour to clarify / review / degraded-continue
   error   → detour to recovery (retry / fallback / escalate)
   waiting → pause for operator (human-in-the-loop)
```

Routing lives in **data**, not the UI:
```ts
type StepOutcome = "success" | "warning" | "error" | "waiting";
type Step = {
  id: string; type: StepType; state: StepOutcome; output: unknown;
  routes: Partial<Record<StepOutcome, StepType | "recover" | "reply">>;
  recovery?: RecoveryAction[];
};
```

---

## 7. Failure taxonomy → recovery path

The **4 required failure states** (★) are just rows in one uniform "step failed →
recovery" pattern, alongside realistic extras (server, fetch-user).

| Step | Failure mode | State | Recovery path |
|---|---|---|---|
| `transcribe` | audio glitch / no speech | error | re-listen; repeats → escalate (Take Over) |
| `assess_confidence` | **low confidence** ★ | warning | → `clarify`: show alternatives, operator corrects (fade→facial) |
| `classify_intent` | ambiguous | warning | ask caller / operator picks intent |
| `caller_lookup` | server / API error | error | degrade → proceed as new guest; retry |
| `capability` | no capable staff | warning | widen criteria / alt service / escalate |
| `availability` | slow / stale data | warning | stale badge + refresh; hard error → manual |
| `recommend` | none available | empty | waitlist / offer another day |
| `hold` | **slot lost while deciding** ★ | error | auto-offer next-best, re-recommend |
| `conflict_check` | **staff conflict** ★ | error | reassign stylist / shift time |
| `payment` | **card declined / gateway** ★ | error | retry / alt method / waive deposit / send pay-link |
| `confirm` | booking write failed | error | retry; else hold + manual |
| `notify` | SMS failed | warning | retry / show number |
| `detect_drop` (event) | **caller drops** ★ | error | `hold_booking` + call-back / SMS |
| **any step** | generic server error | error | retry → fallback → escalate (shared handler) |

### 7.1 Four recovery archetypes (one reusable recovery-action component)
1. **Retry** — transient errors (server, gateway, SMS).
2. **Degrade / continue** — proceed with less (no history → guest).
3. **Alternative** — swap the thing (next-best slot, different stylist, alt payment).
4. **Escalate / hold** — hand to human (Take Over) or park the booking (caller drop).

---

## 8. Confidence: routing + gating (the signature interaction)

Confidence does **two** jobs:
- **Routes** — which step fires next (low → `clarify`).
- **Gates** — blocks the irreversible step. The **Confirm Booking** action is disabled/
  warned while a low-confidence intent is unresolved.

**fade → facial correction flow (must be fully built & demoable):**
1. `assess_confidence` on the "fade" segment → **warning (61%)**; transcript shows amber underline.
2. Routes to `clarify` (human-in-the-loop) → step body shows alternatives:
   `fade (61%)` · `facial (58%)` · `phase (40%)`.
3. Operator selects the correct word (accessible: focusable options, Enter/Esc).
4. **Downstream updates:** `capability` now matches fade specialists (not facial rooms),
   `recommend` re-runs → correct slots. This propagation proves it's one connected flow.

Also acceptable/encouraged: the AI *verbally* self-heals — "Just to confirm, did you say a
*fade*?" — shown in the transcript, so confidence visibly affects the conversation too.

---

## 9. Booking recommendation (Part 2 detail)

- `recommend` proposes **2–3 slots**, ranked by **service duration × staff capability ×
  availability**.
- Each slot card carries a **human-readable "why this fits"** rationale (not a black box),
  e.g. *"Marco — top fade specialist (4.9★ on fades); 45-min slot at 6:30 fits haircut +
  beard; served this client before."*
- The proposal is a **draft booking** the operator can mutate — service, stylist, time,
  deposit toggle. Any change **re-runs the fit** (duration, price, capability,
  availability recalc).
- **Slot-lost-while-deciding:** simulate the top slot getting taken mid-decision → it
  greys out with "just booked" → auto-offer the next-best alternative.

```ts
type DraftBooking = {
  services: Service[]; stylist: Stylist; slot: TimeSlot;
  depositRequired: boolean;
  status: "proposed" | "confirming" | "confirmed" | "slot_lost";
};
```

---

## 10. Booking confirmation (Part 3 detail)

- Confirm appointment; **optionally collect a deposit** (operator-controlled toggle;
  mocked / Stripe-test — card shown masked `•••• 4242`).
- **Two views:** internal **call summary** (what happened on the call) and the
  **customer-facing confirmation** (SMS/confirmation card).
- Failure states designed (see §7): payment failure, low transcript confidence, staff
  conflict, caller dropped before confirmation.

---

## 11. Core data model

```ts
type Confidence = number; // 0–1

type TranscriptSegment = {
  speaker: "caller" | "ai";
  text: string;
  startTime: number; endTime: number;   // shared clock
  confidence: Confidence;
  alternatives?: string[];              // ["fade","facial","phase"] — powers correction
};

type Turn = {
  id: string;
  trigger: TranscriptSegment | SystemEvent;   // utterance OR "call_connected"/"silence"
  steps: Step[];                              // path through the canonical graph
  outcome?: { aiReply?: string; state: StepOutcome };
};

type Call = {
  turns: Turn[];
  currentTime: number;        // THE shared clock — drives audio, transcript, tiles, trace
  duration: number;
  waveform: number[];         // amplitude envelope; also feeds speaker-tile glow
  recording: boolean;
  operatorInControl: boolean; // Take Over
};
```
The whole UI is a function of `Call`. One `currentTime` clock synchronizes audio playhead,
transcript reveal, speaker-tile glow, and which step is `running`.

---

## 11b. Communication & transport (mocked, real-shaped)

Production would use two data planes; we mock the second behind a swappable interface.

- **Media plane (audio):** real-time media stream — WebRTC or a telephony provider socket
  (e.g. Twilio Media Streams). Continuous, low-latency. **Not built** (brief says telephony
  isn't required). In the mock, audio = the local `.mp3` + `useAudio` clock.
- **Event plane (transcript / intent / steps / state):** bidirectional, because the
  operator issues commands mid-call. Production choice = **one WebSocket** carrying a typed
  event stream both ways. (SSE + REST is the one-way alternative; ours isn't one-way —
  Take Over, correction, confirm all flow upstream.) STT arrives as **streaming partials →
  finals**, each token with confidence.

**We build the UI against a transport interface, not a socket.** A `MockTransport` emits
scripted events on the shared clock; a future `WebSocketTransport` implements the same
interface — swapping is one line. The store consumes events → builds `Call`; operator
actions dispatch commands.

```ts
type ServerEvent =
  | { type: 'call.state'; recording: boolean; connected: boolean }
  | { type: 'turn.started'; turnId: string; trigger: string; speaker: Speaker }
  | { type: 'transcript.delta'; turnId: string; word: TranscriptWord }
  | { type: 'transcript.final'; turnId: string }
  | { type: 'step.started'; turnId: string; step: Step }
  | { type: 'step.updated'; turnId: string; stepId: string; state: StepOutcome; output?: unknown }
  | { type: 'recommendation.updated'; slots: Slot[] }
  | { type: 'slot.taken'; slotId: string }          // stale-availability event
  | { type: 'payment.result'; ok: boolean }
  | { type: 'booking.confirmed'; summary: unknown }

type ClientCommand =
  | { type: 'takeOver' } | { type: 'release' } | { type: 'endCall' }
  | { type: 'mute'; on: boolean } | { type: 'speaker'; on: boolean }
  | { type: 'correctWord'; turnId: string; wordId: string; chosen: string }
  | { type: 'selectSlot'; slotId: string } | { type: 'editDraft'; patch: Partial<DraftBooking> }
  | { type: 'requireDeposit'; on: boolean } | { type: 'chargeDeposit' }
  | { type: 'confirmBooking' } | { type: 'refreshAvailability' }

interface CallTransport {
  connect(): void
  close(): void
  subscribe(handler: (e: ServerEvent) => void): () => void
  send(cmd: ClientCommand): void
}
```

- **Command → event feedback loop:** `send()` produces follow-up events, mirroring a real
  backend. e.g. `correctWord('fade')` → `recommendation.updated` (fade specialists);
  `chargeDeposit` → `payment.result`.
- **Edge cases are just timed events:** `slot.taken` mid-decision, `payment.result:false`,
  `call.state.connected:false` (caller dropped).
- **Real-WS concerns to note (not implemented):** heartbeat/reconnect, resume token +
  sequence numbers for ordered replay, optimistic operator actions confirmed by the server.

---

## 12. Design for real conditions (checklist)

- [ ] Desktop **and** mobile (stack → tabs; no horizontal scroll).
- [ ] Loading / empty / error states (covered by step states + generic handler).
- [ ] Slow / stale availability (stale badge + refresh; slot-lost recovery).
- [ ] Keyboard focus + basic a11y on **primary controls** (Take Over, confirm, correct,
      edit slot): focus rings, tab order, ARIA labels, Enter/Esc, `aria-live` for state
      changes, `prefers-reduced-motion`.
- [ ] Clear recovery path whenever the AI is low-confidence or wrong.
- [ ] **Security:** mask card/phone, no raw PII dumps, no tokens/secrets in UI.

---

## 13. Stack & deployment

- **Vite + React + TypeScript**, **Tailwind** for styling.
- Mock "agent"/backend: an in-memory engine that, per utterance/event, emits a scripted
  step chain with delays (to simulate running) and drives outcomes/branches.
- State: lightweight (Zustand or Context) around the single `Call` object + clock.
- **Deploy: Vercel** (or Netlify) — set up early so the live URL isn't a last-hour scramble.

---

## 14. Build priority (4–5h timebox)

**Must-build (the graded core):**
1. Layout shell (left/right split, mobile stack→tabs) + the single `Call` clock.
2. Left: transcript reveal + confidence signal + audio/waveform + controls.
3. Speaker tiles (glow from waveform + activeSpeaker).
4. Right: turn-group + step-shell + registry; scripted happy-path chain.
5. **fade→facial** correction propagating to recommendations.
6. Recommendation cards with "why this fits" + editable draft + **slot-lost** recovery.
7. Confirmation + deposit + call summary + customer confirmation.
8. One more failure/recovery fully built (caller-drop **or** payment fail).
9. Mobile not broken + keyboard a11y on primary controls.

**Nice-to-have (cut freely, do last):**
- Drag-resizable split divider.
- Full generic server-error handler on *every* step (script 1–2 to demonstrate).
- Multiple recorded audio clips; extra failure paths beyond the two built.

---

## 15. Demo script (for the 5-min Loom)

1. Incoming call → caller context loads → tiles + recording badge visible.
2. Greeting turn on the right = short path (spine only).
3. Caller states the canonical request → long path; **"fade" flags amber (61%)**.
4. Operator opens `clarify`, picks **fade** → recommendations re-run to fade specialists.
5. Review 2–3 slots + "why this fits"; edit stylist → fit recalculates.
6. While deciding, top slot is **taken** → next-best offered (recovery).
7. Confirm + take deposit (masked card) → call summary + customer confirmation.
8. Show one failure/recovery: **caller drops** → booking held + call-back, *or* payment
   declined → retry/alt.
9. (Optional) Hit **Take Over** → operator tile takes the glow; deliberate handoff.

---

## 16. Assumptions & trade-offs (for the README)

- **No real STT / telephony** — simulated per the brief; effort goes into what the UI does
  with imperfect information.
- **Simulated playback**, forward-only "live" framing; play/pause for demo control.
- **AI proposes, human disposes**; consequential steps have a supervisable pause; edits
  happen before the caller commits, never after hang-up.
- **React Flow dropped** for the right panel in favor of an accessible chat-style trace —
  better a11y, mobile, and scope fit than a canvas.
- Deposit/payment mocked (Stripe test values); no real charges.
- Scope cuts (resizable split, exhaustive per-step server errors) are deliberate — a
  polished connected slice beats an overbuilt feature set.
