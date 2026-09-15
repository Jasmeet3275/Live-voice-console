# Accessibility & Keyboard Analysis — Live Voice Console

An audit of the operator console against WCAG 2.1 AA and keyboard-operability goals, with
a prioritized remediation plan. The operator is a power user who watches many calls a day,
often needs both hands elsewhere (phone, notes), and must act fast at checkpoints — so
**keyboard ergonomics and timely screen-reader announcements are core to the product**, not
a compliance afterthought.

Scope: `src/` (the shipped console). Evidence is cited as `file:line`.

---

## 0. Verdict at a glance

The foundations are unusually strong for a prototype — a global focus ring, reduced-motion
support, Radix primitives, icon+text status, a keyboard-operable waveform. But the two
things the operator relies on most — **the human-in-the-loop checkpoints and the live
call/agent stream** — are the weakest for keyboard and screen-reader users. The blocking
decision modals have **no focus management**, and nothing about the live call is announced.

| # | Finding | Severity | WCAG |
|---|---------|----------|------|
| 1 | Custom modals (checkpoint + wizard) have no focus trap, initial focus, Escape, or focus restore | **High** | 2.1.2, 2.4.3, 2.1.1 |
| 2 | No live regions for transcript, agent steps, or the "needs you"/error events | **High** | 4.1.3, 1.3.1 |
| 3 | No keyboard shortcuts for core operator actions (mute, take over, end, play/pause) | **Medium** | 2.1.1 (enhancement) |
| 4 | Slot radio group lacks roving-tabindex / arrow-key selection | **Medium** | 2.1.1, 4.1.2 |
| 5 | No `<main>` landmark, no skip link, unlabeled content regions | **Medium** | 1.3.1, 2.4.1 |
| 6 | Color-contrast not yet verified (muted text on subtle fills, focus ring) | **Medium** | 1.4.3, 1.4.11 |
| 7 | Disclosure buttons lack `aria-controls`; modal lacks `aria-describedby` | **Low** | 1.3.1, 4.1.2 |
| 8 | Extra tab stops on non-interactive status spans; waveform could use `aria-valuetext` | **Low** | 2.4.3, 4.1.2 |

---

## 0a. Implementation status (updated)

| # | Finding | Status |
|---|---------|--------|
| 1 | Modal focus management | ✅ **Done** — new `Modal` primitive (`components/ui/Modal.tsx`) on Radix Dialog; `HumanInputModal` + `TakeOverWizard` migrated → focus trap, initial focus (`data-autofocus` on the primary action), Escape, focus restore, scroll-lock. At a checkpoint, Escape/outside no longer dismiss; **Escape = Take over**. |
| 2 | Live regions | ✅ **Done** — `LiveAnnouncer` (`components/domain/LiveAnnouncer.tsx`): polite transcript announcements + an assertive `role="alert"` for checkpoints and error notices. |
| 3 | Keyboard shortcuts + help | ✅ **Done** — `useKeyboardShortcuts` (Space/K, M, S, T, H, B, E, `?`), a header **Shortcuts** button, and a `ShortcutsDialog` help sheet sharing one `SHORTCUTS` source of truth. End-call confirmation lifted to the shell so the `E` shortcut and the dock button share it. |
| 4 | Roving-tabindex slot group | ⬜ **Deferred** — slots are Tab-navigable inside the now-trapped modal; arrow-key roving is the remaining enhancement. |
| 5 | Landmarks + skip link | ✅ **Done** — `<main id="conversation" aria-label="Call conversation">` + a "Skip to conversation" link. |
| 6 | Contrast audit | ⬜ **Deferred** — needs an automated + manual measurement pass in both themes. |
| 7 | `aria-controls` / `aria-describedby` | ✅ **Done** — agent-block disclosure now has `aria-controls`; the hand-off modal wires `aria-describedby` to its reason. (StepShell disclosure still to do.) |
| 8 | `aria-valuetext` / extra tab stops | 🟡 **Partial** — waveform now announces "m:ss of m:ss" via `aria-valuetext`; the status-span tab stops are unchanged (deliberate "focusable status"). |

Remaining: roving-tabindex slot navigation (4), a contrast audit (6), StepShell `aria-controls` (7).

---

## 1. What's already good (keep it)

- **Global `:focus-visible` ring** on every interactive element (`index.css:125`), radius-aware,
  in both themes via `--focus-ring` tokens (`tokens.css:57,121`).
- **`prefers-reduced-motion` honored globally** (`index.css:131`) — all animation/transition
  durations collapse, including the glow/pulse effects.
- **Theme-aware** (`prefers-color-scheme` + `data-theme` toggle) — no light-only assumptions.
- **Status is never color-only** — `StatusChip` pairs every state with an icon + text label
  (`StatusChip.tsx:10-39`); `RecordingIndicator` shows "REC" + lock icon, not just red.
- **Waveform is a real slider** — `role="slider"`, `aria-valuemin/max/now`, `aria-label`,
  Arrow/Home/End keys (`Waveform.tsx:72-81`).
- **Radix primitives** (`Dialog`, `Tooltip`, `Select`, `Switch`) bring focus trap, Escape,
  and ARIA for free — the end-call confirm `Dialog` (`Dialog.tsx`) is the accessible
  reference the custom modals should match.
- **Icon-only buttons require a label** — `IconButton` types `aria-label` as required
  (`IconButton.tsx`); the low-confidence transcript word is a labeled button
  (`ConfidenceWord.tsx:92`).
- **`Pressable`** keeps native `<button>` semantics (keyboard + focus) under all the custom
  interactive containers.

---

## 2. High-severity findings

### 2.1 The checkpoint & wizard modals have no focus management

`HumanInputModal` (`HumanInputModal.tsx:16-23`) and `TakeOverWizard` (`TakeOverWizard.tsx:56`)
are hand-rolled `fixed inset-0` overlays with `role="dialog"` + `aria-modal="true"`, but:

- **No focus trap** — Tab moves out of the modal into the page behind it. The overlay is
  visual only; keyboard focus is not contained.
- **No initial focus** — opening a checkpoint doesn't move focus into the dialog, so a
  screen-reader/keyboard user isn't told a blocking decision appeared and must hunt for it.
- **No `Escape` handler** — nothing dismisses or steps back from the keyboard (grep for
  `onKeyDown`/`Escape` in these files: none).
- **No focus restoration** — on close, focus isn't returned to the control that opened it.

**Why it matters most:** these are the *primary operator surfaces* — correct the misheard
word, pick a slot, confirm the booking, handle a declined payment, and the new error
**hand-off**. For a keyboard/SR operator this is where the product either works or doesn't.

**Fix:** route both modals through the **Radix `Dialog`** already in the codebase (it solves
all four for free), or extract a shared `Modal` primitive built on
`@radix-ui/react-dialog` with `<Dialog.Content>` (trap + Escape + restore),
`onOpenAutoFocus` to focus the primary action, `<Dialog.Title>`/`<Dialog.Description>`
wired to `aria-labelledby`/`aria-describedby`. Migrating is low-risk and removes hand-rolled
overlay code.

> Nuance for *blocking* checkpoints: a required decision shouldn't be silently
> `Escape`-dismissable into nothing. Recommend Escape on a checkpoint maps to **Take over**
> (the safe human fallback), while the manual booking wizard uses normal Escape-to-close.

### 2.2 Nothing about the live call is announced (no live regions)

Only two `role="status"` regions exist — the unused `SpeakerTile` (`SpeakerTile.tsx:53`)
and the notice pills (`ConsolePage.tsx:174`). The two continuously-changing surfaces have
**no `aria-live`**:

- **Transcript stream** — new caller/AI utterances append silently (`Feed`,
  `ConsolePage.tsx:159`). A blind operator hears nothing as the conversation unfolds.
- **Agent step trace** — steps start/succeed/warn/error with no announcement; the trace is
  also collapsed by default, so it's invisible to SR until expanded.
- **"Needs you" / error / hand-off** — the most urgent moments. Because the modal doesn't
  take focus (2.1), their arrival isn't announced at all.

**Fix:**
- Wrap the transcript feed in a **polite** live region (`aria-live="polite"`), announcing
  new final lines as "Caller: …" / "AI: …".
- Add a **visually-hidden assertive** live region for status changes that need attention:
  checkpoint opened ("Action needed: choose the correct word"), step errors, hand-off, and
  caller-dropped. Prefer a small dedicated `role="alert"` announcer over making the whole
  trace assertive (which would be too chatty).
- Announce active-step transitions politely (e.g. "Checking availability… done"), throttled
  to avoid flooding.

---

## 3. Medium-severity findings

### 3.1 No operator keyboard shortcuts

There are **no global shortcuts** for the call controls (grep: keyboard handling exists only
in `Waveform` and the unused `ResizableSplit`). Every action requires locating and clicking
a button. For a high-throughput operator this is the biggest ergonomic win.

**Proposed shortcut map** (register at the console root; ignore while typing in an
input/textarea/contenteditable, and expose a `?` help sheet):

| Key | Action |
|-----|--------|
| `Space` / `K` | Play / pause the call clock |
| `←` / `→` | Seek (waveform already supports when focused) |
| `M` | Toggle mute |
| `S` | Toggle speaker |
| `T` | Take over |
| `H` | Hand back (when in control) |
| `B` | Open booking wizard (when in control) |
| `E` | End call (opens confirm dialog) |
| `Enter` | Submit the focused checkpoint's primary action |
| `Esc` | Wizard: close · Checkpoint: Take over (safe fallback) |
| `?` | Show keyboard shortcuts |

Implement as a single `useKeyboardShortcuts` hook dispatching the existing `ClientCommand`s /
clock methods — no new state model needed.

### 3.2 Slot selection isn't a proper radio group for the keyboard

`SelectSlotForm` renders `role="radiogroup"` with `role="radio"` cards
(`HumanInputModal.tsx`, `SlotCard.tsx:41-43`), but each card is a separate **Tab** stop and
**arrow keys don't move** between them — native radios use a single tab stop + arrow
navigation. So SR announces "radio, 1 of 3" but the interaction model doesn't match.

**Fix:** implement **roving tabindex** (selected/first card `tabIndex=0`, others `-1`) with
Arrow Up/Down/Left/Right to move+select and Space/Enter to choose — or adopt Radix
`RadioGroup`. Apply to the in-trace `SlotCard`s too.

### 3.3 Missing landmarks & skip link

Only `<header>` exists (`ConsolePage.tsx:324`). The scrollable conversation — the primary
content — is a plain `<div>` (`ConsolePage.tsx:352`) with no landmark or accessible name,
and there's no skip link.

**Fix:** wrap the feed in `<main aria-label="Call conversation">`, add a
"Skip to conversation" link as the first focusable element, and give the caller panel and
(future) trace region labelled regions. This makes landmark navigation (a primary SR
shortcut) actually work.

### 3.4 Color contrast is unverified

The design leans on `text-text-muted` / `text-micro` over `*-subtle` fills in many places
(status chips, hints, reasons, timers). None of these have been measured. The teal
`--focus-ring` on teal-ish surfaces also needs a 3:1 non-text check.

**Fix:** run an automated pass (axe / Lighthouse) plus manual contrast checks on: muted body
text (needs 4.5:1), micro/caption text, disabled states, and the focus ring (3:1 against
adjacent colors) — in **both** themes.

---

## 4. Low-severity findings

- **4.1 Disclosure association** — `AgentBlock` (`ConsolePage.tsx`) and `StepShell`
  (`StepShell.tsx:92`) toggles have `aria-expanded` but no `aria-controls` pointing at the
  panel, and the revealed panel isn't labeled. Add `aria-controls` + an `id`.
- **4.2 Modal description** — the dialog sets `aria-label={req.title}` but no
  `aria-describedby` for the body/reason (esp. the hand-off `reason`). Associate it so SR
  reads the "why" automatically.
- **4.3 Extra tab stops** — `MiniSpeaker` (`MiniSpeaker.tsx:35`) and `RecordingIndicator`
  (`RecordingIndicator.tsx:18`) put `tabIndex={0}` on non-interactive `<span>`s to expose
  their tooltip. They're labeled (fine for SR) but add tab stops with no action; consider
  conveying the same via `aria-label` on a container instead, or accept as a deliberate
  "focusable status" choice.
- **4.4 Waveform `aria-valuetext`** — it announces a percentage; "1:23 of 3:00" (via
  `aria-valuetext`) is far more useful to an operator scrubbing a call.

---

## 5. Prioritized roadmap

1. **Focus-manage the modals** (Finding 1) — migrate `HumanInputModal` + `TakeOverWizard`
   onto the Radix `Dialog` / a shared `Modal`. *Highest impact, self-contained.*
2. **Add live-region announcers** (Finding 2) — a polite transcript announcer + an assertive
   alert announcer for checkpoints/errors/hand-off.
3. **Operator shortcut layer + `?` help** (Finding 3.1).
4. **Landmarks + skip link** (Finding 3.3) — quick, broad SR win.
5. **Roving-tabindex slot group** (Finding 3.2).
6. **Contrast audit + fixes** (Finding 3.4) in both themes.
7. **Low-severity polish** (Section 4).

Items 1, 3, and 4 are small and give the largest keyboard/SR gains; I'd start there.

---

## 6. How to verify

- **Automated:** `axe-core` (or Lighthouse a11y) on each scenario, both themes — targets
  contrast, names/roles, landmarks.
- **Keyboard-only pass:** unplug the mouse and run the happy path + the `service-down`
  hand-off end-to-end — reach and resolve every checkpoint, take over, book via the wizard,
  end the call. No focus should ever be lost behind a modal.
- **Screen reader:** VoiceOver (Safari) / NVDA (Firefox) — confirm the call is narratable:
  greeting, caller request, "action needed" at each checkpoint, step outcomes, booking
  confirmation, and the hand-off error reason.
- **Reduced motion / zoom:** verify at `prefers-reduced-motion` and 200% zoom / 320px width
  (responsive already stacks).

---

*This is an analysis, not a change set. Say the word and I'll implement the roadmap
top-down — I'd begin with the Radix modal migration (Finding 1) and the live-region
announcers (Finding 2), which together cover the two highest-severity gaps.*
