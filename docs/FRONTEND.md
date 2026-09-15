# Frontend Best Practices — Zoca AI Front Desk

Conventions for this codebase. The goal is a small, polished, reliable product slice:
predictable state, accessible controls, and a design language enforced by tokens.

---

## 1. Architecture & state

- **Single source of truth for the call.** The UI is a function of one `Call` object
  (turns, `currentTime`, waveform, control flags). Components render it; they don't own
  duplicate copies of call data.
- **One clock.** `currentTime` drives audio playhead, transcript reveal, speaker-tile
  glow, and which step is `running`. Never introduce a second timer that can drift.
- **Controlled components.** Domain components are presentational and take
  `value + onChange` (e.g. `DepositForm`, `SlotCard`, `CallControls`). State lives in the
  page/model, not scattered in leaves — this keeps the "connected flow" coherent.
- **Mock backend is data, not UI.** The agent/engine emits `{type, state, output}` step
  objects with delays. The UI just renders whatever chain arrives. Branching (confidence,
  errors) is decided in the model, never hard-coded in components.
- **Derive, don't store.** Compute things like `activeSpeaker`, `level`, overall turn
  status from state where cheap; store only what can't be derived.

## 2. Components

- **Two layers:** `components/ui` (generic primitives) and `components/domain`
  (product-specific). Pages compose domain components; domain composes ui.
- **One responsibility each.** A component renders and emits events. Side effects
  (timers, fetches, audio) live in hooks (`lib/useAudio`, `lib/theme`).
- **Reusable shells over bespoke cards.** `StepShell` / `TurnGroup` standardize state
  and layout so every step and failure reads the same way. Add a step *type*, not a new
  card.
- **`forwardRef` on anything a Radix `asChild` / Tooltip / Popover wraps** — the trigger
  must forward its ref or positioning/focus breaks.
- **Props: explicit and typed.** Export the prop type. No `any`. Prefer unions
  (`'idle' | 'charging' | …`) over booleans-that-multiply.

## 3. Styling & design tokens

- **Tokens are the only source of color/spacing/radius.** Use semantic classes
  (`bg-surface`, `text-text`, `border-border`, `text-accent`) — never raw palette
  (`bg-slate-800`) or hex in components. One change in `tokens.css` re-themes everything.
- **Component-scoped tokens when a surface needs its own palette** (e.g. `--dock-*` for
  the call dock). Keep them in `tokens.css` beside the rest.
- **Theme by CSS variables, not `dark:` variants.** Light/dark swap the token values, so
  components stay theme-agnostic. Reach for `dark:` only for a true one-off.
- **Reserve color for meaning.** Neutral greys by default; accent for the primary path;
  semantic colors (info/success/warning/error/waiting) only for state; red/violet only
  where they signify (danger / operator-in-control).
- **`cn()` for conditional classes** (clsx + tailwind-merge) so later classes win cleanly.
- **Tabular numerals** (`.tabular`) on anything that ticks — timers, prices, %, durations.

## 4. Accessibility (non-negotiable for primary controls)

- **Every interactive element is reachable and operable by keyboard.** Native `<button>`
  where possible; visible `:focus-visible` ring (global) never removed.
- **Icon-only buttons require `aria-label`.** Toggles expose `aria-pressed`; the divider
  uses `role="separator"`; meters use `role="meter"` with `aria-valuenow`.
- **Announce state changes** that aren't obvious visually (speaker change, step state)
  with `aria-live="polite"`, throttled.
- **Color is never the only signal** — pair with icon/text (status chips, confidence).
- **Respect `prefers-reduced-motion`** (global) — glow/pulse/reveal degrade to static.
- **Hit targets ≥ 40px** for call controls and confirm actions.

## 5. Motion

- Purposeful only: reveal, state transition, speaker glow. Durations from tokens
  (`--dur-fast/base/slow`), ease-out for enters.
- Data-driven visuals (glow from volume) update via props, not infinite CSS loops.
- No layout-shifting animation; animate transform/opacity/box-shadow.

## 6. TypeScript

- `strict` + `noUnusedLocals/Parameters`. No `any`; use `unknown` + narrowing for
  step `output` payloads.
- Export shared types next to their component; import with `import type`.
- Discriminated unions for step/status/state so switches stay exhaustive.

## 7. Performance

- Keep the clock cheap: one `requestAnimationFrame` loop while playing, cancelled on
  pause/unmount. No per-frame React state for things that can be CSS.
- Memoize expensive derived data (`useMemo` for waveform generation/decoding).
- Decode audio peaks once per source; show a synthetic fallback until ready.
- Virtualize only if the transcript/trace grows beyond a few hundred rows (not now).

## 8. File & naming conventions

- One component per file, `PascalCase.tsx`; hooks `useX.ts`; utils lowerCamel in `lib/`.
- Barrel `components/ui/index.ts` for primitives; import domain components directly.
- `@/` path alias → `src/`. No deep relative `../../..` chains.
- Co-locate types; keep `preview/` (showcase) separate from product code.

## 9. Reliability & states

- Every async surface handles **loading / empty / error**, not just the happy path.
- Every failable step has a **recovery path** (one of the four archetypes:
  retry / degrade / alternative / escalate).
- Guard against stale data (availability) and mid-flow changes (slot lost); show it,
  offer the next action.

## 10. Security & privacy in the UI

- Never render raw PII: mask phone (`•••`) and card (`•••• 4242`).
- No raw credential/card entry fields — display-only "on file".
- No secrets/tokens in the DOM or logs.
