# Zoca AI Front Desk — Live Voice Console

A frontend-only operator console for a salon's AI voice front desk. The operator watches an
AI-handled booking call unfold as a single merged feed (caller/AI transcript interleaved
with the agent's reasoning steps) and steps in at human-in-the-loop checkpoints — correct a
misheard word, pick a slot, handle a declined payment, confirm the booking, or take over.

The backend is **mocked behind a real-shaped transport** (`ServerEvent` / `ClientCommand`
over a swappable `CallTransport`), so the UI is a pure function of state and could be wired
to a real WebSocket without touching the store or views.

> Stack: React 19 + TypeScript + Vite 8, Tailwind v4, Radix UI. Tests: Vitest + Testing
> Library (unit) and Cypress (e2e).

---

## Prerequisites

- **Node ≥ 20.19** (or ≥ 22.12) and npm.

## Setup

```bash
npm install
```

## Run it

```bash
npm run dev        # start the dev server (Vite) → http://localhost:5173
```

Press **Start** (or the `Space` key) to begin the call. Use the **scenario picker** in the
header to switch between paths (see [Scenarios](#scenarios)). Press **`?`** any time for the
keyboard-shortcuts help.

```bash
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # serve the production build locally
```

---

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | `tsc -b` type-check + Vite production build |
| `npm run preview` | Serve the built `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest in watch mode |
| `npm run test:run` | Vitest once (CI mode) |
| `npm run test:coverage` | Vitest with a V8 coverage report (text + HTML in `coverage/`) |
| `npm run e2e` | Boot the app and run the Cypress suite headless |
| `npm run e2e:open` | Boot the app and open the Cypress runner |

---

## Testing

### Unit / component (Vitest + Testing Library, jsdom)

```bash
npm run test:run          # run once
npm test                  # watch mode
npm run test:coverage     # with coverage (HTML report at coverage/index.html)
```

Covers the core logic and the UI:

- **Reducer & store** — `applyEvent` folds every `ServerEvent`; optimistic `ClientCommand`s.
- **Mock backend** — `CallDirector`: the human-in-the-loop protocol (`input.requested` /
  `input.cleared`), the free-running clock, take-over / end-call, and per-scenario outcomes.
- **Components** — the checkpoint modal (incl. two-step Enter), dock, transcript /
  confidence, slot card, wizard stepper, live-region announcer, summary, and the primitives.
- **Hooks & helpers** — keyboard shortcuts, theme, the end-of-call summary derivation, audio
  utils.

~110 tests, ~90% statement coverage of the shipped `src/`.

### End-to-end (Cypress)

```bash
npm run e2e        # headless (starts the dev server on :4173 automatically)
npm run e2e:open   # interactive runner
```

Drives the real app through: the **happy path** (recommend → pick → confirm → booked →
summary), the **low-confidence** fade/facial correction, the **service outage → take over**
hand-off, and the **keyboard shortcuts**.

---

## Scenarios

Switch scenarios from the header picker; each is focused on one condition:

| Scenario | What it exercises |
|----------|-------------------|
| Happy path | Clean request → recommend → pick → confirm → booked |
| Low transcript confidence | "fades" heard at 61% → operator confirms the word → intent updates |
| Slot taken while deciding | Picked slot was just booked → re-recommend → pick again |
| Payment declined | Deposit charge declined → retry or waive → booked |
| Caller dropped | Caller hangs up before confirming → hold booking + SMS + callback |
| Staff conflict | Picked stylist double-booked → reassign to a free stylist |
| No slots available | Nothing tomorrow → agent checks the next day → offer Thursday |
| Availability service error | Scheduling service times out → auto-retry → recommend |
| Service outage → take over | Scheduling service fails hard → agent hands off → operator books manually |

---

## Keyboard shortcuts

`Space`/`K` play·pause · `M` mute · `S` speaker · `T` take over · `H` hand back ·
`B` book · `E` end call · `Esc` dismiss (or take over at a checkpoint) · `?` show help.

Shortcuts stand down while typing, while a modal is open, and before the call starts.

---

## Project structure

```
src/
├── pages/ConsolePage.tsx     # the operator console (single merged feed)
├── types/call.ts             # data model + wire contract (source of truth)
├── store/                    # applyEvent reducer + CallStore + providers
├── hooks/                    # useCall, useClock, useKeyboardShortcuts, useTheme
├── mock/                     # CallDirector (mock backend) + scenarios
├── components/ui/            # generic primitives
├── components/domain/        # product components
└── lib/                      # pure utilities
```

See the companion docs at the repository root:

- **`../ARCHITECTURE.md`** — layers, data model, wire protocol, the clock + HITL model.
- **`../ACCESSIBILITY.md`** — the a11y audit and what was implemented.
- **`../ASSIGNMENT_COVERAGE.md`** — requirement-by-requirement coverage.
- **`../AI_NOTES.md`** — how AI was used, verified, and directed.

---

## Assumptions & trade-offs

- **Frontend-only, mocked backend.** Everything server-side is simulated by `CallDirector`
  behind the `CallTransport` interface. The event/command contract is deliberately shaped
  like a real WebSocket so it's swappable; the human-in-the-loop "input needed" signal
  travels as real events (`input.requested`/`input.cleared`), not a UI side-channel.
- **Simulated audio.** There's no real STT/telephony (out of scope). The waveform + clock
  are a synthetic real-time timeline; the point is what the UI does with imperfect
  information (confidence, corrections, recovery), not speech recognition itself.
- **The clock represents a live call** — it keeps running during a checkpoint (a real call
  doesn't pause); the agent's *emission* is what gates on operator input.
- **Single-key operator shortcuts** (guarded), chosen over `Ctrl/Cmd`+key which collide with
  the browser. See `../AI_NOTES.md` for the rationale.
- **Deposit is display-only.** No card entry — the UI only expresses intent
  (`chargeDeposit`); a real charge would happen server-side (PCI off the client).
- **`ConsolePage` is covered by e2e** rather than unit tests (it's the composition root);
  its pure logic (`deriveCallSummary`) is unit-tested directly.
