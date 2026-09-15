# Component inventory — Zoca Front Desk Console

Everything needed to build Screen 1 (AI handling), Screen 2 (Held for the operator), Screen 3 (Resolved and confirmed) and the interactive console (desktop + mobile). Organised primitives → molecules → organisms → templates. Names are suggestions; props listed are the ones the screens actually exercise.

---

## 0. Tokens (build first — everything below depends on them)

**Color**
| Token | Value | Use |
|---|---|---|
| `bg/page` | `#ece7df` | canvas behind the app frame |
| `bg/app` | `#f4efe8` | console body, transcript column |
| `bg/surface` | `#fffdfa` | header, side panels, bubbles, cards |
| `bg/sunken` | `#f1ede6` | inset rows, disabled buttons, chips |
| `bg/callerBubble` | `#e9e3d9` | caller message |
| `ink/1` | `#221f1c` | primary text |
| `ink/2` | `#3a352f` | body text |
| `ink/3` | `#57514a` | secondary |
| `ink/4` | `#6b645b` / `#6f6860` | meta, labels |
| `ink/5` | `#7d756b` | withheld `——` |
| `accent/teal` | `#1f7d6e` (dark `#164f45`, text `#1a6357`) | AI voice + recommendations only |
| `accent/tealTint` | `oklch(0.972 0.022 170)` / `oklch(0.95 0.04 170)` | AI pick surfaces, correction flash |
| `accent/amber` | `#d9a53c` (border `rgba(176,117,20,.55)`, text `#6b4a0d`) | human-action-required only |
| `accent/amberTint` | `oklch(0.965 0.04 82)` | hold surfaces |
| `danger` | `#c0392b` | recording dot + End call only |
| `line/hairline` | `rgba(34,31,28,.06–.13)` | dividers, borders |

**Type** — Public Sans 300–800. Scale used: 9/9.5/10/10.5 (uppercase labels, `.11–.14em` tracking), 11/11.5/12/12.5 (meta, chips), 13/13.5/14 (body, bubbles), 14.5/15/16 (titles), 18 (best-fit slot time). Weights 400/500/600/650/700. `font-variant-numeric: tabular-nums` on the whole console.

**Radius** 3–5 (ticks, tags) · 8–11 (chips, buttons, inset rows) · 12–15 (cards, sheets) · 20 (app frame, pills) · 38 (phone frame) · asymmetric `4px 13px 13px 13px` for speech bubbles.

**Spacing** 2 / 4 / 6 / 8 / 9 / 11 / 13 / 16 / 18 / 22 / 30 grid.

**Elevation** `0 2px 6px rgba(34,31,28,.06), 0 20px 50px -26px rgba(34,31,28,.34)` (frame) · `0 10px 26px -14px rgba(176,117,20,.5)` (hold sheet) · `0 6px 16px -9px` accent-colored (primary buttons).

**Motion** keyframes: `rec` (1.8s blink), `breathe` (1.4s), `riseIn` (.35s), `fadeIn` (.5s), `flash` (1.2s correction highlight), `strike` (word strike-through), `spin` (.7s). Hover lift `translateY(-2px)` @ .12s.

---

## 0b. Dark mode tokens

Same three color roles, same structure — only the surface/ink ramps invert and the accents brighten so they keep 4.5:1 on dark ground. Nothing changes semantically: teal is still only the AI's voice and recommendations, amber only where a human must act, red only the recording dot and End call.

| Token | Light | Dark | Notes |
|---|---|---|---|
| `bg/page` | `#ece7df` | `#14120e` | warm charcoal, never pure black |
| `bg/app` | `#f4efe8` | `#1c1a16` | console body, transcript column |
| `bg/surface` | `#fffdfa` | `#24211c` | header, side panels, AI bubbles, cards |
| `bg/sunken` | `#f1ede6` | `#2b2823` | inset rows, disabled buttons, chips |
| `bg/callerBubble` | `#e9e3d9` | `#322e28` | caller message — still the lighter of the two speakers |
| `ink/1` | `#221f1c` | `#f2ede4` | primary text |
| `ink/2` | `#3a352f` | `#ddd6ca` | body text |
| `ink/3` | `#57514a` | `#b8b0a4` | secondary |
| `ink/4` | `#6b645b` | `#948c81` | meta, uppercase labels |
| `ink/5` | `#7d756b` | `#7a7268` | withheld `——` (only role that barely moves) |
| `accent/teal` | `#1f7d6e` | `#4fb8a4` | buttons, AI avatar, active borders |
| `accent/tealText` | `#1a6357` | `#8fdcca` | teal-on-tint copy |
| `accent/tealDeep` | `#164f45` | `#c9f0e6` | headline on teal tint |
| `accent/tealTint` | `oklch(0.972 0.022 170)` | `oklch(0.30 0.045 170)` | AI pick surface, "Booked" panel |
| `accent/tealFlash` | `oklch(0.95 0.04 170)` | `oklch(0.38 0.07 170)` | correction highlight |
| `accent/amber` | `#d9a53c` | `#e8bb63` | hold dot, flags, borders |
| `accent/amberText` | `#6b4a0d` | `#f2d493` | hold copy |
| `accent/amberTint` | `oklch(0.965 0.04 82)` | `oklch(0.31 0.05 82)` | hold sheet header, header pill |
| `accent/amberBorder` | `rgba(176,117,20,.55)` | `rgba(232,187,99,.5)` | hold sheet outline |
| `danger` | `#c0392b` | `#e1614f` | recording dot, End call |
| `line/hairline` | `rgba(34,31,28,.06–.13)` | `rgba(242,237,228,.08–.14)` | dividers, card borders |
| `line/strong` | `rgba(34,31,28,.3)` | `rgba(242,237,228,.28)` | hover borders, dashed ask-back card |
| `ink/inverse` | `#fff` on dark fills | `#14120e` on teal fills | button label on `accent/teal` flips to dark |
| `takenOver/surface` | `#221f1c` | `#f2ede4` | the take-over frame inverts again — in dark mode it goes *light* so "you have the line" stays a visual break |
| `takenOver/ink` | `#fff` | `#221f1c` | |

**Elevation in dark** — shadows stop reading; depth comes from surface steps plus a 1px `line/hairline` border. Keep the frame shadow at `0 24px 60px -30px rgba(0,0,0,.7)` and drop the inner `0 2px 6px`. Accent glows stay but halve in opacity: `0 6px 16px -9px rgba(79,184,164,.45)`.

**Two things that must not be auto-inverted**
- The waveform bars: use `ink/4` at 55% for past, `ink/2` for the current window, `accent/teal` for the playhead — a straight invert makes them vibrate.
- The struck misheard word: keep the strike in `ink/4`, not amber, so amber stays reserved for the actionable element next to it.

**Implementation** — declare both ramps as CSS custom properties on `:root` / `[data-theme="dark"]`, and reference tokens only by role name in components. No component should branch on theme; the only conditional is `ink/inverse` on teal fills and the two take-over tokens.


---

## 1. Primitives (atoms)

| Component | Props | Notes / where used |
|---|---|---|
| `Text` | `variant` (label/meta/body/title/mono-num), `tone` (ink1–5, teal, amber, danger) | or pure tokens + native tags; the screens only ever use these combinations |
| `SectionLabel` | `children` | 9.5px/700/.12em uppercase ink4 — "Transcript", "Slots", "Visits", "Team note" |
| `Avatar` | `initials`, `size` (22/26/28/42), `shape` (rounded-square \| circle), `tone` (teal = AI, sand = human) | AI avatar, caller avatar, operator chip, customer header |
| `Dot` | `size` (7–11), `color`, `pulse` (none/rec/breathe) | recording, hold, sentiment, timeline markers |
| `Chip` | `children`, `tone` (neutral/teal/amber/dark) | "4 visits", "0 no-shows" |
| `Tag` | `children`, `tone` (teal-solid/dark/neutral) | "AI's pick", "Best fit", "withheld", "your correction" |
| `KeycapHint` | `children` | `⌘⇧T`, `Enter`, `2`, `3` |
| `Divider` | `orientation`, `inset` | 1px hairlines + 1px vertical rules in the header |
| `Button` | `variant` (primary-teal / danger / dark / secondary / ghost / disabled), `size` (sm/md/lg), `iconLeft`, `keyHint`, `fullWidth` | Take over, End call, Confirm, Hand back to AI, walkthrough nav |
| `IconTile` | `icon`, `size` (38 desktop / 44 mobile), `state` | mute, speaker, keypad, transfer in the transport bar |
| `Spinner` | `size` | "Taking deposit…" |
| `TypingDots` | — | 3 dots, staggered `rec` animation |
| `PlayButton` | `playing`, `size` (26/32), `onToggle` | clip playback + transport |
| `ProgressPill` / `CountdownLabel` | `seconds` | "dead air 0:07", "next stall line in 6s" |
| `StruckWord` | `children` | line-through misheard word |
| `HighlightWord` | `children`, `tone` (teal = corrected, amber = low confidence) | flash + underline treatments |
| `WithheldValue` | — | renders `——` in ink5 |
| `PhoneStatusBar` | `time`, `carrier` | mobile only |

**Icons needed** (12–16px, 1.5px stroke): mic/mic-off, speaker, keypad, transfer, play, pause, card, check, chevron, x, arrow-left, phone-down, clock, user, calendar, alert-triangle. No decorative icons anywhere else.

---

## 2. Molecules

| Component | Props | Used in |
|---|---|---|
| `RecordingPill` | `notified` | header, all screens |
| `StatusPill` | `tone` (amber hold / dark taken-over / teal resolved), `label`, `timer` | header banner slot |
| `ElapsedClock` | `seconds` | header, transport |
| `OperatorChip` | `initials`, `name` | header right |
| `BrandLock` | `appName`, `tenantName` | header left |
| `ConfidenceMeter` | `pct` | "Avg confidence 91%" + the 38% waveform flag |
| `TranscriptBubble` | `speaker` (ai/caller), `timestamp`, `children`, `badge?`, `tail` | the single most reused molecule |
| `AiThinkingBubble` | `label` | "checking services, staff and the calendar" / "stalling the caller" |
| `ResolvedInlineRow` | `count`, `summary`, `expandable` | "AI resolved 2 on its own" collapsed row |
| `RecordRow` | `label`, `value`, `state` (known/withheld/held), `reason?` | 6 rows × 3 screens; owns the `——` + dependency copy |
| `RecordNote` | `children` | "Withheld, not unknown…" |
| `SlotCard` | `time`, `stylist`, `meta`, `tag?`, `rationale?`, `state` (best-fit / alt / lost), `onPick` | slots list; lost variant is struck + 60% opacity |
| `DecisionOptionCard` | `title`, `subtitle?`, `rationale`, `keyHint`, `variant` (ai-pick / as-heard / ask-back dashed), `onSelect` | hold sheet, 3 across |
| `ClipPlayerRow` | `duration`, `offset`, `waveform` | inside the hold sheet |
| `PreviewLine` | `label`, `quote` | "Jordan then hears …" |
| `VisitRow` | `service`, `date`, `stylist`, `price` | customer history |
| `InsightNote` | `children` | "Never booked a facial. 4 of 4 were fades." |
| `TeamNoteCard` | `children` | left rail |
| `PaymentCard` | `brand`, `last4`, `note` | left rail bottom |
| `ConfirmCta` | `state` (enabled / confirming / confirmed / withheld), `amount`, `onConfirm` | the four-state footer button |
| `MobileTabStrip` | `tabs`, `active`, `onChange` | mobile: Call / Booking / Customer |
| `WalkthroughControl` | `steps`, `current`, `onJump` | console page only |

---

## 3. Organisms

| Component | Composition | Props / state |
|---|---|---|
| `ConsoleHeader` | BrandLock + RecordingPill + StatusPill + ElapsedClock + OperatorChip | `callState` |
| `CustomerRail` (left, 264px) | Avatar + name + phone + Chips, TeamNoteCard, VisitRow list + InsightNote, PaymentCard | `customer` |
| `TranscriptPanel` (center, fluid) | panel header (SectionLabel + review flag + confidence) + scroll body of TranscriptBubble / ResolvedInlineRow / AiThinkingBubble / HoldSheet / TakeOverBar | `messages[]`, `callState` |
| `HoldSheet` | amber header (reason, category, dead-air timer) + explanation + ClipPlayerRow + 3 × DecisionOptionCard + PreviewLine | `hold`, `onAccept/onUseHeard/onAskBack`; animates `riseIn` |
| `TakeOverBar` | prompt text + "Hand back to AI" | shown only when `takenOver` |
| `BookingRecordPanel` (right, 330px) | header + draft/saved state + 6 × RecordRow + RecordNote + SlotList + ConfirmCta | `record`, `slots`, `callState` — enforces the dependency rule: any held field forces all downstream rows to withheld and disables Confirm |
| `SlotList` | SectionLabel + freshness + SlotCard[] | `slots[]`, `onPick` |
| `TransportBar` (bottom) | PlayButton + clock + `WaveformTrack` + window label + IconTile row + Take over + End call | `playhead`, `flags[]`, `playing` |
| `WaveformTrack` | bar array + playhead + confidence flag markers | `samples`, `t`, `window`, `flags` — deterministic bar generator, see README for the algorithm |
| `PhoneFrame` | 390×844 shell + PhoneStatusBar + safe areas | `variant` (normal / taken-over dark) |
| `MobileCallScreen` | compact header, transcript thread with record threaded inline, MobileTabStrip, action bar (mute / Take over / end) | `callState` |
| `MobileBookingScreen` | RecordRow list + SlotCard list + ConfirmCta | `record` |
| `MobileCustomerScreen` | CustomerRail contents, stacked | `customer` |
| `MobileTakeOverScreen` | dark variant of MobileCallScreen | — |
| `WalkthroughBar` | scenario buttons (Held / Resolved / Take over) + caption | console page only, not production |

---

## 4. Templates / pages

| Page | Organisms | Fixed state |
|---|---|---|
| **Screen 1 — AI handling** | ConsoleHeader, CustomerRail, TranscriptPanel (2 bubbles + resolved row + thinking), BookingRecordPanel (all withheld), TransportBar | `listening` |
| **Screen 2 — Held for the operator** | same + HoldSheet open, amber StatusPill, amber word highlight, record still withheld with reason, Confirm withheld | `held` |
| **Screen 3 — Resolved and confirmed** | same + correction bubbles, filled record, SlotList with one lost slot, ConfirmCta `confirmed` | `confirmed` |
| **Interactive console** | all of the above driven by one state machine, plus PhoneFrame ×1–4 and WalkthroughBar | all states |

---

## 5. Shared state model (one store, both viewports)

```
callState: 'listening' | 'stalling' | 'held' | 'resolved' | 'offered' | 'confirming' | 'confirmed' | 'takenOver'
clock, deadAir, playhead        // seconds, tick at 1s
hold: { field, heardWord, confidence, clipOffset, options[] }
record: { customer, service, stylist, duration, time, price, deposit }  // undefined = withheld
slots: [{ time, stylist, state }]
derived: canConfirm, notResolved, hasTime, flagInWindow, slotLost
```

Derive every visual (record rows, Confirm, header pill, waveform flag, mobile screens) from this — nothing should hold its own copy of call state.

## 6. Suggested build order

1. Tokens + `Text`/`Button`/`Chip`/`Tag`/`Avatar`/`Dot`
2. `TranscriptBubble` + `TranscriptPanel` with static messages
3. `RecordRow` + `BookingRecordPanel` with the dependency rule (the core idea — get it right before the hold UI)
4. `HoldSheet` + `DecisionOptionCard` + `ClipPlayerRow`
5. `WaveformTrack` + `TransportBar`
6. `CustomerRail`, `ConsoleHeader`
7. State machine, then wire the three static screens as fixtures of it
8. `PhoneFrame` + the four mobile screens
9. Motion + keyboard bindings last

**Count:** ~26 primitives, ~23 molecules, ~16 organisms, 4 templates.
