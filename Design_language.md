# Zoca console — design language

Reference for building the live-call operator console. Written to be pasted into Claude Code as context. Values track the shipped implementation: the source of truth for colour is `src/styles/tokens.css` (the dark ramp below matches it), and structure, motion and copy follow the built components. Don't invent new ones.

---

## 1. The premise

An AI answers the phone and books appointments. A human operator watches. The console's only job is to let that operator **read the call fast and intervene late**. Every design decision follows from this:

- The operator is scanning, not reading. One decision per surface, stated in the first line.
- The AI always shows its reasoning **on the thing it recommends**, not in a tooltip or an expander.
- Nothing irreversible happens without a human, and every surface says what is already irreversible.
- Time is the scarce resource. Anything with a countdown shows it.

---

## 2. Color

Color carries meaning here. It is not decoration — there are exactly four semantic assignments and adding a fifth breaks the system.

| Meaning | Light | Dark |
|---|---|---|
| **Amber** — a decision is waiting on you | header bg `oklch(0.965 0.04 82)`, border `rgba(176,117,20,.55)`, ink `#6b4a0d`, dot `#d9a53c` | header bg `oklch(0.31 0.05 82)`, border `rgba(232,187,99,.5)`, ink `#f2d493`, dot `#e8bb63` |
| **Teal** — the AI's pick, or work that completed | surface `oklch(0.972 0.022 170)`, border `#1f7d6e`, ink `#164f45` / `#1a6357` | surface `oklch(0.3 0.045 170)`, border `#4fb8a4`, ink `#c9f0e6` / `#8fdcca` |
| **Ink / bone** — the AI has stopped; a human is involved | `#221f1c` on paper | inverts to bone `#f2ede4` |
| **Red** | reserved: recording dot, End call. Nothing else, ever. | same |

### Neutrals

| Role | Light | Dark |
|---|---|---|
| Page / transcript | `#ece7df` | `#1c1a16` |
| Raised card | `#fffdfa` | `#24211c` |
| Inset (evidence, readback) | `#f4efe8` / `#f1ede6` | `#2b2823` |
| Chip | `#e9e3d9` | `#322e28` |
| Text primary | `#221f1c` | `#f2ede4` |
| Text secondary | `#57514a` | `#b8b0a4` |
| Text tertiary | `#6b645b` / `#6f6860` | `#948c81` |
| Hairline | `rgba(34,31,28,.10–.16)` | `rgba(242,237,228,.10–.14)` |

### Rules

- **Red is never a status color.** A dropped call is not an error, it is unfinished work — it gets ink, and its urgency comes from the live slot countdown, not from hue. If red also meant "ended", red would stop meaning "the line is hot."
- **Amber means a choice between good options.** When the AI has no options at all (hand-off, integration down), amber is wrong: the header inverts to ink/bone so the row reads as a stop rather than a prompt.
- **Going dark is not a filter.** Amber and teal move up in lightness and down in chroma so they carry without glowing, and anything that was near-black for emphasis becomes the lightest surface in the set — on a dark ground, black recedes.
- Max two background tints per screen.

---

## 3. Type

Public Sans, weights 400 / 600 / 650 / 700. Tabular numerals on any container with times, prices or counts (`font-variant-numeric: tabular-nums`).

| Role | Spec |
|---|---|
| Eyebrow / section label | `700 10px`, `letter-spacing:.14em`, uppercase |
| In-card label | `700 9–9.5px`, `letter-spacing:.11–.12em`, uppercase, tertiary |
| Screen title | `650 20px`, `letter-spacing:-.02em` |
| Claim (the deciding sentence) | `400 14px/1.5`, deciding number bolded in amber |
| Body / consequence | `400 12.5px/1.5` |
| Option card title | `650 14.5px` |
| Option card reasoning | `400 11.5px/1.45` |
| Metadata, timers | `400 11–11.5px` |
| Big time value | `700 16–18px`, `letter-spacing:-.025em` |
| Readback quote | `400 13px/1.5`, italic |

Prose copy sits in a `max-width:660px` measure. Cards never do.

---

## 4. Shape and depth

- Radius: `15px` card, `11–12px` inset and option card, `9px` button, `7–8px` chip, `50%` dot.
- Borders: `1.5px` when the border carries meaning (amber frame, teal pick, ink stop); `1px` otherwise. **Dashed `1px`** marks the slower/safer option — always the last card.
- One shadow only, on the checkpoint card: `0 10px 26px -14px <accent at .5>` light, `0 14px 30px -16px rgba(0,0,0,.8)` dark. Insets and notices are flat.
- Spacing: `9–10px` between option cards, `11–14px` card padding, `12px` between stacked blocks, `26–34px` between components, `40px` after a section's closing note.
- Hover: option cards `translateY(-2px)` + a shadow or a border-darkening, `.12s ease`. Buttons darken their border only.

---

## 5. The two surface families

Everything in the console is one of two things. Getting this distinction right matters more than any individual value.

### A. CheckpointSheet — the operator must choose

One component, five variants (slot recommendation, confirm booking, payment declined, hand-off, hold). The **frame never changes**; only the evidence block and the options do.

```
┌─ header ── dot · WHAT NEEDS YOU · category · elapsed cost of waiting ─┐
│  Claim: one sentence, deciding number bolded in the accent            │
│  One line of what is blocked downstream                               │
│  ┌─ Evidence ────────────────────────────────────────────────────┐    │
│  │ the thing the operator checks the claim against               │    │
│  └───────────────────────────────────────────────────────────────┘    │
│  ┌─ AI's pick ──┐ ┌─ alternative ─┐ ┌─ slower, safer (dashed) ─┐      │
│  │ teal border  │ │               │ │                          │      │
│  │ + reasoning  │ │ + reasoning   │ │ + reasoning              │      │
│  │ shortcut     │ │ shortcut      │ │ shortcut                 │      │
│  └──────────────┘ └───────────────┘ └──────────────────────────┘      │
│  ┌─ Readback: what the caller hears the moment you choose ───────┐    │
└───────────────────────────────────────────────────────────────────────┘
```

Non-negotiable parts:

- **Header** states what is blocked and **the cost of waiting** (`dead air 0:03`, `slot held 3:42`) — never a generic timestamp.
- **Evidence** is whatever makes the claim checkable: the slot list, the record about to be saved, the issuer response, the error trace with retry times. A checkpoint without evidence is a demand for trust.
- **Options** are 2–3 equal-width cards, never a primary button plus a link. Each carries its own one-sentence reasoning in its own voice ("4 visits, 0 no-shows, regular of Marco's"). The AI's pick gets the teal border and an `AI's pick` badge. The last card is dashed and is the slow path.
- **Readback** quotes what the caller will hear. It kills the "what did it just say" question.
- Keyboard: `Enter` for the pick, `2` / `3` for the others, `⌘⇧T` for take over. Shown on the card, toggleable.

### B. Notice — something happened, nothing to decide

Same vocabulary, stripped to one row. No header band, no evidence block, no option cards.

```
──────────  Line closed 6:31 PM · 0:47  ──────────
│ ● │ Title — who/what        actor · desk    state │ [ one action ]
│   │ one sentence of consequence                    │
```

- A **divider with a timestamp** above it, so the transcript stays readable after the line closes.
- Left rail `3px` in the meaning color: bone/ink while a human is live on the line, grey once the call is over, teal when the booking completed.
- Exactly one sentence of consequence — what was or wasn't saved, charged, released.
- Exactly one action, the one that reverses or follows up (`Hand back to AI`, `Call back`, `Open booking`).
- Only a live state animates (`breathe` on the dot, 1.4s). A closed call is static.

Current set: operator took over · dropped by operator · dropped by caller · call ended (booking complete).

---

## 6. Motion

Two keyframes carry every operator-facing surface — nothing in the transcript, the checkpoint, or the record animates by any other means.

```css
@keyframes breathe { 0%,100%{opacity:.55} 50%{opacity:1} }   /* 1.4s — live/waiting only */
@keyframes riseIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }  /* .22s — surface entering */
```

`breathe` is a claim that something is happening right now — the recording dot, the hold dot, the AI's typing dots. Never put it on a static row; a closed call is still. `riseIn` plays once as a checkpoint or notice enters the thread. Transitions are `.12s ease` on hover and nothing else — an operator mid-call should not be waiting on an animation.

Generic UI primitives outside the operator surfaces (the deposit `Spinner`, Radix tooltip/toast enter-exit) carry their own minimal, framework-owned transitions. They never touch the transcript or a checkpoint, so they don't count against the two-keyframe rule above — but don't reach for them inside a domain component.

---

## 7. Copy

- Say the consequence, not the event. "Nothing was saved and no deposit was taken" beats "Call terminated."
- Name people and things: Marco, Jordan, `··· 4821`, `Visa ···· 4242`.
- Give every option its cost in seconds or dollars: "Costs ~11s, nothing is saved yet."
- The AI speaks in the first person only inside an evidence block quoting it ("I can't reach the scheduling service").
- Never an exclamation mark, never an emoji, no reassurance ("Don't worry"). Sentence case everywhere except the uppercase micro-labels.
- Numbers are exact. `3 of 4 visits`, not "most visits."

---

## 8. Building it

- Colour lives in one place: role-named CSS custom properties declared on `:root` (light) and `[data-theme="dark"]` (dark) in `src/styles/tokens.css`, surfaced as Tailwind utilities. Components reference roles (`bg-surface`, `text-warning`, `border-accent`) and never a raw hex — switching `data-theme` re-themes everything at runtime. The only theme conditionals a component may carry are the two the ramps can't express: the button label on a teal fill flipping to dark ink, and the take-over frame inverting. The dark ramp above is the shipped one; light and dark are peers, not a filter of each other.
- One domain component per screen family (`CheckpointSheet`, the transcript thread, the booking record), composed from shared primitives.
- Expose behavior as props, not copy: `showKeyHints`, `showReadback` are booleans with `?? true` fallbacks.
- Fluid: `max-width` on prose, `flex:1; min-width:150–190px; flex-wrap:wrap` on option rows so three cards become one column under ~520px.
- Accessibility floor: body text 4.5:1 against its own surface. That is why dark-mode teal text is `#8fdcca` and not the border color (`#4fb8a4`).

---

## 9. Quick checklist

Before shipping a new surface:

1. Is it a decision (checkpoint) or a fact (notice)? Don't blend them.
2. Does the header state the **cost of waiting**, not just the time?
3. Can the operator check the AI's claim without leaving the surface?
4. Does each option carry its own reasoning and its own cost?
5. Is amber only present because a choice is genuinely open?
6. Is red only on the recording dot or End call?
7. Does only the live thing animate?
