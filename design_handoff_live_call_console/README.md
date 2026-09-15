# Handoff: Zoca Front Desk — live AI call console with operator take-over

## Overview

A single-caller live call console for an AI voice agent that books salon appointments. One customer is on the line at a time. The AI runs the call; a human operator watches, resolves anything the AI refuses to guess at, and can take the line at any moment.

The design's central assertion: **take-over is a state the whole screen reflects, not a button**. Every message is attributed, the AI's next move is visible before it happens, and a low-confidence field does not merely block the final submit — it starves every derived field downstream of it.

## About the design files

The files in `screens/` are **design references written as HTML prototypes**. They show intended look and behaviour. They are not production code to copy.

The task is to **recreate these designs in the target codebase's existing environment** — React, Vue, Svelte, SwiftUI, native, whatever is already there — using its established component library, routing, and state patterns. If no environment exists yet, pick the framework that best fits the product and implement there.

The HTML uses a small custom template runtime (`support.js`, `<sc-if>`, `<sc-for>`, `{{ }}` holes). Do not port that runtime. Read the markup for structure, styling, and copy; read the `<script type="text/x-dc">` logic class at the bottom of each file for the state machine.

Open any file directly in a browser to view it. `screens/Interactive console.dc.html` is the only one that animates — press Space, or use the "Jump to state" buttons.

## Fidelity

**High fidelity.** Final colours, typography, spacing, radii, copy, and interaction states. Recreate pixel-perfectly using the codebase's existing primitives where they match, and follow the token table below where they don't.

Two caveats:
- The waveform is synthesised from a scripted envelope. In production it comes from real audio levels. The *visual language* (bar width, per-speaker colour, trailing window, playhead at the right edge) is the spec; the data source changes.
- Copy in the transcript and the customer record is representative sample data, not fixed strings.

## Layout: desktop

Fixed 1320 × ~860 shell, `border-radius: 20px`, `overflow: hidden`, vertical flex column. Ground `#f4efe8`.

```
┌──────────────────────────────────────────────────────────────┐
│ top bar  h=56  bg #fffdfa  border-bottom 1px rgba(34,31,28,.09)│
├───────────┬────────────────────────────────┬─────────────────┤
│ customer  │  transcript                    │ booking record  │
│ w=264     │  flex:1  min-width:0           │ w=330           │
│ #fffdfa   │  #f4efe8                       │ #fffdfa         │
├───────────┴────────────────────────────────┴─────────────────┤
│ transport  bg #fffdfa  border-top 1px      padding 12/20/14  │
└──────────────────────────────────────────────────────────────┘
```

Middle row is `display:flex; flex:1; min-height:0`. Side rails are `flex:none`. Both side rails have a 1px vertical border in `rgba(34,31,28,.09)`.

### Top bar

`display:flex; align-items:center; gap:14px; padding:0 20px; height:56px`

1. **Brand** — 22×22 `#1f7d6e` square, `border-radius:8px`; "Zoca Front Desk" 700/14.5px `letter-spacing:-.015em` `#221f1c`; "Luxe Salon" 400/13px `#6f6860`.
2. **Recording pill** — `padding:5px 11px 5px 9px`, `border:1px solid rgba(34,31,28,.12)`, `border-radius:20px`. 7px `#c0392b` dot animating `rec` (opacity 1 → .2 → 1, 1.8s ease-in-out infinite); "Recording" 600/11.5px `#57514a`; 1×11px divider `rgba(34,31,28,.14)`; "caller notified" 400/11.5px `#6b645b`.
3. **State pill** (conditional) — held: bg `oklch(0.965 0.04 82)`, `border:1px solid rgba(176,117,20,.32)`, 7px `#d9a53c` dot animating `breathe`, "AI stalled — waiting on you" 600/12.5px `#6b4a0d`, dead-air seconds 700/12px `#6b4a0d`. Taken over: bg `#221f1c`, white dot, "You have the line — AI muted" 600/12.5px `#fff`.
4. **Right cluster** (`margin-left:auto`) — "Elapsed" 400/10px `letter-spacing:.11em` uppercase `#6f6860` over the clock 700/13.5px `#221f1c`; 1×26px divider; 28px circle avatar `#e4ddd2` with initials 600/11px `#6d665e`; operator name 500/12.5px `#57514a`.

### Left rail — customer (w 264, padding 18, `gap:16px`, flex column)

- **Identity** — 42×42 `#e4ddd2` tile `border-radius:14px`, initials 600/15px `#57514a`. Name 650/16px `letter-spacing:-.02em`. Phone 400/12px `#6b645b`.
- **Tags** — `padding:4px 9px`, bg `#f1ede6`, `border-radius:8px`, 600/11px `#57514a`. "4 visits", "0 no-shows".
- **Team note** — `padding:11px 12px`, bg `#f4efe8`, `border-radius:12px`. Label 700/9.5px `letter-spacing:.12em` uppercase `#6b645b`; body 400/12.5px/1.5 `#3a352f`.
- **Visits** — each row: 2px `#ddd5c9` vertical rule + title 600/12.5px `#221f1c` + meta 400/11.5px `#6b645b`.
- **Inference note** — bg `#f4efe8`, `border-radius:10px`, 400/11.5px/1.45 `#57514a`. "Never booked a facial. **4 of 4** were fades." This is the evidence behind the AI's preferred reading and must stay adjacent to the history.
- **Card on file** (`margin-top:auto`) — 11×11 square `border:1.5px solid #6b645b` `border-radius:3px`; "Visa ···· 4242" 600/11.5px `#57514a`; "Charging needs your confirmation." 400/11.5px `#6b645b`.

### Centre — transcript (flex:1)

**Header** — `padding:10px 22px`, 1px bottom border. "Transcript" 700/9.5px `letter-spacing:.12em` uppercase `#6b645b`. A state chip: held → 8px `#d9a53c` square + "1 word needs review" `#6b4a0d`; resolved → 8px `#1f7d6e` square + "corrected by you" `#1a6357`. Right: "Avg confidence **91%**".

**Thread** — `flex:1; overflow:hidden; padding:18px 22px; display:flex; flex-direction:column; gap:13px`.

Four distinct registers, deliberately different weights:

| Register | Treatment |
|---|---|
| AI speech | 26×26 `#1f7d6e` avatar `border-radius:9px`; bubble bg `#fffdfa`, `border:1px solid rgba(34,31,28,.08)`, `border-radius:4px 13px 13px 13px`, 400/13.5px/1.55 `#3a352f` |
| Caller speech | `flex-direction:row-reverse`; 26×26 `#e4ddd2` avatar; bubble bg `#e9e3d9`, no border, `border-radius:13px 4px 13px 13px`, `max-width:86%` |
| Agent steps | No bubble. `margin-left:37px`, bg `#f1ede6`, `border-radius:11px`, `padding:9px 13px`. Deliberately quieter than speech — this was the main fix over the original build, where bordered "Done" rows competed with the conversation |
| Intervention | `margin-left:37px`, bg `#fffdfa`, `border:1.5px solid rgba(176,117,20,.55)`, `border-radius:15px`, `box-shadow:0 10px 26px -14px rgba(176,117,20,.5)` |

Message meta line: name 650/12.5px `#221f1c` + timestamp 400/11px `#6f6860`, `margin-bottom:5px`.

**Auto-resolved row** (severity 1) — `margin-left:37px`, bg `#f1ede6`, `border-radius:10px`, `padding:8px 12px`. 7px `#cfc5b6` dot; "AI resolved 2 on its own" 600/11.5px `#3a352f`; detail 400/11.5px `#6b645b`; "show" 400/11px `#6f6860` right-aligned.

**Live indicator** — `margin-top:auto` (pins to the bottom of the column, which is what keeps it from reading as dead space). AI avatar + `border:1px dashed rgba(34,31,28,.16)` bubble, three 5px `#a49c92` dots animating `rec` at 0/.2/.4s stagger, label 400/12.5px `#6b645b`. Text is `listening` → "checking services, staff and the calendar"; `held` → "stalling the caller · next stall line in 6s".

### Right rail — booking record (w 330)

Header: "Booking record" 650/14.5px `letter-spacing:-.01em`; status 400/11px `#6f6860` — "draft" or "saved".

Field rows: `padding:9px 0`, `border-bottom:1px solid rgba(34,31,28,.06)`. Label 400/11.5px `#6b645b` in a `width:62px; flex:none` column; value 600/13.5px `#221f1c`. Order: Customer, Service, Stylist, Length, Time, Price.

**Withheld state** — every unresolved field renders `——` in 400/13px `#7d756b`, wrapper `opacity:.6`. Below: bg `#f1ede6`, `border-radius:12px`, 400/12px/1.5 `#57514a` — "Withheld, not unknown. A field fills only when the AI is certain of it." plus a state clause. Row count must not change between states; only values and treatment change.

**Slot cards** (offered state only)

- Recommended: bg `oklch(0.972 0.022 170)`, `border:1.5px solid #1f7d6e`, `border-radius:13px`. Time 700/18px `letter-spacing:-.025em` `#221f1c`; stylist 600/12.5px `#57514a`; "Best fit" badge bg `#1f7d6e`, `#fff` 700/9px `letter-spacing:.08em` uppercase; meta 400/11.5px `#1a6357`. Then a 1px `rgba(31,125,110,.2)` divider and the reasoning, 400/11.5px/1.5 `#1a6357` — three specific reasons, never a generic score.
- Lost slot: bg `#f4efe8`, `opacity:.6`, time `text-decoration:line-through` `#6b645b`, "just taken" 600/11px `#57514a`, explanation 400/11.5px. **Struck neutral, never red** — stale data is out of date, not dangerous.
- Alternative: bg `#fffdfa`, `border:1px solid rgba(34,31,28,.13)`, time 700/16px, "alt" 400/11px `#6f6860`.

**Confirm** (`margin-top:auto`) — four states:

| State | Treatment |
|---|---|
| withheld | bg `#f1ede6`, label 650/14px `#6f6860`, chip bg `rgba(34,31,28,.1)` text `#5f594f` 700/9px uppercase "withheld" |
| ready | bg `#1f7d6e`, `border-radius:12px`, `box-shadow:0 6px 16px -9px rgba(31,125,110,.75)`, label `#fff` 650/14.5px "Confirm · take $15", hover `translateY(-2px)`; caption below 400/11px `#6b645b` |
| charging | bg `#f1ede6`, 14px spinner `border:2px solid rgba(34,31,28,.18)` `border-top-color:#1f7d6e` animating `spin` .7s linear, "Taking deposit…" |
| confirmed | bg `oklch(0.972 0.022 170)`, `border:1.5px solid #1f7d6e`, "Booked · $15 taken" 650/14.5px `#164f45` + receipt line `#1a6357` |

### Transport

Two rows, `padding:12px 20px 14px`, bg `#fffdfa`, 1px top border.

**Row 1** — 32px `#221f1c` circle play/pause (CSS triangle 9px left border / two 3×12px bars); clock 700/12.5px `letter-spacing:-.02em` in a `width:34px` box; waveform `flex:1; position:relative; height:38px`; window label 400/11.5px `#6f6860`.

**Row 2** — four 38×38 icon buttons, bg `#f1ede6`, `border:1px solid rgba(34,31,28,.1)`, `border-radius:11px`: mute (M), speaker (S), replay last 5s (R), stall the caller (H). Explanatory text belongs in `title` tooltips, not in the labels — long button copy was a specific problem in the original build.

Right cluster:
- **Take over** — bg `#1f7d6e`, `padding:11px 19px`, `border-radius:12px`, `box-shadow:0 6px 16px -9px rgba(31,125,110,.75), inset 0 0 0 1px rgba(255,255,255,.12)`, hover `translateY(-2px)`. 13px white square, label `#fff` 650/14px, shortcut chip bg **`rgba(0,0,0,.22)`** with `#fff` 700/10px. The chip ground is a *darkening* overlay — a lightening one washes the teal to rgb(71,148,136) and no text colour on it can reach 4.5:1.
- **End call** — bg `#c0392b`, `border-radius:12px`, 11px white circle, label `#fff` 650/13.5px. The only red button in the product.

### Waveform (both platforms)

A live call has no future audio and no known end time. The transport therefore renders a **trailing window that ends at now**, not the whole call:

```
WIN = 24                                  // seconds visible
end   = max(t, 3)
start = max(0, end - WIN)
```

- One inline SVG, `viewBox="0 0 168 100"`, `preserveAspectRatio="none"`, 168 `<rect>`s, `width:0.64`, `rx:0.3`, vertically centred.
- **No scrim.** There is no unplayed region to mask, because the window ends at the playhead.
- Playhead: `position:absolute; right:0; top:-3px; bottom:-3px; width:2px; background:#221f1c`.
- Right label is the window ("last 24s"), never a fixed total.
- Low-confidence marker: pill `top:-18px`, `transform:translateX(-50%)`, bg `#8a5c0f`, `#fff` 700/9.5px, positioned at `(flagSec - start) / (end - start)`, clamped to 96%, hidden once the flagged word scrolls out of the window.
- Resample quantised to 0.25s buckets so a 10 Hz clock doesn't re-reconcile 168 nodes every tick.

Bar colour by speaker, two tones per speaker keyed on amplitude > 52:

| Source | loud | quiet |
|---|---|---|
| AI | `#1f7d6e` | `#8ebcb2` |
| Caller | `#c6bcac` | `#ddd5c9` |
| Low-confidence span | `#d9a53c` | `#e6c98a` |
| Silence | `#ddd5c9` | — |

**Replay clip** — the same envelope resampled over just the flagged window at its own resolution: `sample(11, 13, 40, 0.58)`. Do not reuse main-timeline bars; a 2s slice of an 86s/168-bar timeline yields 4 bars and reads as a progress bar, not audio.

Envelope maths, for visual parity:

```js
p   = (sec - turnStart) / (turnEnd - turnStart)
env = sin(PI * pow(p, 0.75))                       // attack/decay
syl = 0.55 + 0.45 * abs(sin(p * PI * 9 + i))       // syllable ripple
h   = 8 + 84 * env * syl * (0.72 + 0.28 * rand())  // jitter
```

## Layout: mobile (390 × 844)

Same state machine, same tokens. Vertical flex column, `border-radius:38px`.

```
status bar                                    h≈34
header    identity + clock + rec dot + wave   flex:none
tabs      Call · Booking · Customer           h≈49
thread    flex:1  overflow-y:auto
[sheet]   hold sheet, in-flow, when held
transport icons + primary + End call          flex:none
```

Four frames are drawn:

1. **Call** — the default. Header carries a 30px waveform. Thread holds the same four registers as desktop, plus the booking record (see below).
2. **Booking details** — the saved record, reached from the Booking tab or "Details ›" on the in-thread record card. Time 700/26px `letter-spacing:-.03em`; rows Service / Stylist / Length / Chair / Total / Deposit taken; a "How this was decided" provenance trail where the operator's correction gets a `#d9a53c` rule and AI decisions get `#ddd5c9`; confirmation receipts with timestamps; footer "Reschedule" / "Call Jordan".
3. **Customer** — three stat tiles (visits / lifetime / no-shows, figures 700/21px), pinned team note on `oklch(0.965 0.04 82)`, "Preferences the AI applies" table (including "Never booked: Facials, colour"), full visit history with lateness, and the standing rule that no charge happens without an operator.
4. **Taken over** — dark chrome. Status bar and header go `#221f1c`; "You have the line — AI muted" 650/12.5px `#fff` with "since 0:13"; 4-bar mic level meter animating `eqbar`. Operator turns render as **dark** `#221f1c` bubbles with `#fff` text, captioned "spoken by you · 1:06" — so authorship is unmistakable. The AI continues in a `border:1px dashed rgba(31,125,110,.5)` card: still transcribing, slot still held, deposit ready, and an explicit promise it will not speak or charge while the operator holds the line. Two exits: "Use its draft", "See booking". Transport swaps Take over → **Hand back to AI**; mute, speaker and End call persist.

### Mobile-specific rules

- **The booking record lives in the thread.** Mobile has no right rail, so the record renders as a card inside the conversation — withheld version while unresolved, filled version after. Without it the thread is 60% dead space in the pre-hold states.
- **Tab strip is the navigation.** `display:flex; gap:4px; padding:8px 16px`; active tab bg `#221f1c` text `#fff` 600/12.5px; inactive text `#57514a`. This is the answer to "what do I tap to see the booking".
- **The hold sheet is in-flow, not absolutely positioned.** It is the last child before the transport, bg `#fffdfa`, `border-top:1.5px solid rgba(176,117,20,.55)`, `border-radius:22px 22px 0 0`, `box-shadow:0 -14px 40px -14px rgba(34,31,28,.3)`, with a 36×4px grab handle. A positioned sheet paints over the transport regardless of DOM order and makes Take over and End call unreachable on the one screen where they matter most.
- **Every tap target ≥ 44px.** Transport buttons are 44×44; the primary action is a 44px-tall full-width button.
- Live indicators use `margin-top:auto` here too.

## Interventions — the framework

`screens/Intervention framework.dc.html` documents the full model. The essentials:

### Holds propagate

A held field starves everything derived from it. It does not merely disable the submit button.

```
Heard → Understanding → Capability + duration → Slots → Confirm + deposit
         ▲ held here
              everything to the right is WITHHELD, not unknown
```

Each withheld field states *why* ("needs the service", "45 or 60 min", "no slots computed"). Never render a plausible guess in a withheld field.

### Seven parts of every intervention

Where (stage + field) · What (one plain sentence, no model jargon) · Evidence (the 2s clip, the decline code, the stale timestamp — never "low confidence" alone) · Consequence (what is withheld, named) · Choices (2–3, safest first, the AI's pick marked) · **Say next** (the line the caller hears after the operator chooses — it is a phone call, every resolution has a spoken consequence) · Reversibility (undo window, or an explicit warning there is none).

### Four severities, by who must act

| Severity | Who | Treatment |
|---|---|---|
| AI resolved it | nobody | collapsed row in the thread, `#cfc5b6` dot, no rail presence |
| Proceeding unless you object | operator may veto | neutral card + countdown, `#8d867d` dot; silence is consent |
| Held — you decide | operator must choose | amber `#d9a53c`, pipeline stops and says so, keyboard-resolvable |
| Held — you take the line | operator must speak | amber filled `#8a5c0f`; the AI cannot continue and stalls the caller |

### Production taxonomy

The framework file catalogues **47 conditions** across eight layers — line & audio, speech recognition, understanding, identity & policy, availability & staff, payment, aftermath, system & guardrails. Two of them are the brief's examples. All 47 resolve through the same card anatomy: forty-seven bespoke designs is not shippable, one card with forty-seven payloads is.

Notable ones worth designing for early: provider timeout with charge state unknown; retry that would risk a double charge; calendar unreachable; stylist calls in sick mid-call; booking half-written (calendar yes, CRM no); operator ends the call with a hold still open; AI about to state a price it cannot honour.

### Always-on obligations

- **Dead air is shown and accumulates across pauses.** An intervention that takes 20s to resolve is a bad intervention even if it resolves correctly.
- **The AI is given a stall line** so the operator can think without silence on the line.
- **The AI cannot take money.** Every charge requires an explicit operator confirmation, stated in the UI in two places.

## Interactions & behaviour

### State machine

```
listening ──(t ≥ 11s)──▶ held ──(resolve)──▶ resolved ──(1.1s)──▶ offered ──(confirm)──▶ confirming ──(1.5s)──▶ confirmed
                                                                      │
                                                            (6.2s) slotLost = true
```

`takenOver` is an orthogonal boolean — it can be toggled in any stage and mutes the AI without altering the booking pipeline.

### Resolution branches

| Choice | Key | Effect |
|---|---|---|
| Accept "fades" | `Enter` | Service "Haircut + beard trim, fade", Marco Diaz, 45 min, $48, $15 deposit. Transcript strikes "facials" and inserts "fades" with a 1.2s `flash` highlight |
| Use "facials" | `2` | Service "Haircut + facial", Nina Alvarez, 60 min, $75, $20 deposit — a different stylist, room, and price. The whole record re-derives |
| Have the AI ask | `3` | AI reconfirms aloud, ~8s cost, admits the mishear |

Other bindings: `Space` play/pause, `R` replay, `M` mute, `S` speaker, `H` stall, `⌘⇧T` / `Ctrl+Shift+T` take over. Handlers must ignore events originating in inputs and textareas.

### Animations

| Name | Definition | Used on |
|---|---|---|
| `rec` | `0%,100% {opacity:1} 50% {opacity:.2}` — 1.8s ease-in-out infinite | recording dot; typing dots at 1.2s with 0/.2/.4s stagger |
| `riseIn` | `opacity:0, translateY(10px)` → none — .3–.4s ease | new messages, hold card, sheet, state pills |
| `fadeIn` | `opacity:0 → 1` — .5s ease | record fields filling |
| `flash` | `background: oklch(0.95 0.045 170) → transparent` — 1.2s ease | the corrected word |
| `spin` | `rotate(360deg)` — .7s linear infinite | deposit spinner |
| `breathe` | `0%,100% {opacity:.55} 50% {opacity:1}` — 1.4s ease-in-out infinite | amber attention dots |
| `eqbar` | `scaleY(.4) → scaleY(1)` — .9s ease-in-out infinite, staggered | mic level meter |

Hover: interactive cards and primary buttons lift `translateY(-2px)` over `.12s ease`. Play button scales `1.06`.

## State variables

```
t            number   call clock, seconds
playing      bool
stage         "listening" | "held" | "resolved" | "offered" | "confirmed"
resolution    null | "fade" | "facial" | "ask"
slotLost     bool     the 7:15 alternative was taken during the decision
chosen       string   selected slot, "6:30" | "8:00"
takenOver    bool     operator holds the line, AI muted
confirming   bool     deposit in flight
confirmed    bool
deadAcc      number   accumulated dead-air seconds, survives pause
tOffer       number   clock at which slots were offered
tConfirm     number   clock at which the booking was written
```

Timestamps shown in the thread derive from `tOffer` / `tConfirm`, never hardcoded. Dead air accumulates across pauses rather than resetting, so pausing to think does not hide the cost to the caller.

### Data the production version needs

Live: audio stream + level data, streaming ASR with per-token confidence, the agent's tool-call trace with latencies. On call open: customer record, visit history, team notes, card-on-file status. On demand: service catalogue with durations, staff capability matrix, calendar availability with a freshness timestamp, slot hold + release, deposit charge (idempotency-keyed — see "retry would risk a double charge"), SMS dispatch.

## Design tokens

### Colour — three roles only

Warm neutral is everything the system knows. Teal is the AI's own voice and its recommendation. Amber, at two weights, is "a human must act". Red survives as exactly one mark: the recording dot, plus End call. Stale and lost data are struck neutral, not red.

**Neutrals**

| Token | Use |
|---|---|
| `#ece7df` | page ground |
| `#f4efe8` | console ground, quiet insets |
| `#f1ede6` | agent-step strips, icon buttons, withheld confirm |
| `#fffdfa` | panels, AI bubbles |
| `#e9e3d9` | caller bubbles |
| `#e4ddd2` | avatars |
| `#ddd5c9` / `#cfc5b6` / `#c6bcac` | rules, dots, waveform quiet/loud |
| `#221f1c` | primary ink, dark chrome |
| `#3a352f` | body |
| `#57514a` | secondary |
| `#6b645b` | metadata |
| `#6f6860` | labels, uppercase eyebrows |
| `#5f594f` | small state chips |
| `#7d756b` | withheld `——` |

`#8d867d`, `#a49c92` and `#b5ada3` are **non-text tokens** — rules, dots, waveform fills only. At body sizes they fail 4.5:1 on these warm grounds.

**Teal — AI**

`#1f7d6e` primary · `#164f45` on tint · `#1a6357` body on tint · `#8ebcb2` waveform quiet · `oklch(0.972 0.022 170)` card tint · `oklch(0.95 0.04 170)` chip tint

**Amber — human must act**

`#d9a53c` marker · `#e6c98a` waveform quiet · `#8a5c0f` filled/second weight · `#6b4a0d` body on tint · `oklch(0.965 0.04 82)` ground · `oklch(0.93 0.06 82)` inline highlight · borders `rgba(176,117,20,.3–.55)`

**Red — danger only**

`#c0392b` recording dot, End call. Nothing else.

### Type

**Public Sans** throughout (Google Fonts, 300–800 + italic). Single family — mixing a mono into the original build was a legibility cost with no payoff. `font-variant-numeric: tabular-nums` on every console root so clocks, prices and percentages don't jitter.

| Role | Spec |
|---|---|
| Screen title | 650/16–19px, `letter-spacing:-.02em` |
| Slot time | 700/18–26px, `letter-spacing:-.025em` |
| Clock | 700/12.5–14px, `letter-spacing:-.02em` |
| Body / speech | 400/13–14px, line-height 1.5–1.6 |
| Field value | 600/13–13.5px |
| Field label | 400/11.5–12px |
| Metadata | 400/11–11.5px |
| Eyebrow | 700/9.5px, `letter-spacing:.12em`, uppercase |
| Badge | 700/9–10px, `letter-spacing:.08em`, uppercase |

Minimum body size is 10.5px (mobile captions only); nothing meaningful below it.

### Spacing, radii, shadows

Spacing: 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22px.

Radii: 3 (checkbox) · 5–8 (chips, badges) · 9–11 (avatars, icon buttons) · 12–16 (cards) · 18–20 (console shell) · 38 (phone frame) · 50% (dots, play). Bubbles use asymmetric tails: AI `4px 13px 13px 13px`, caller `13px 4px 13px 13px`.

Borders: hairline `1px solid rgba(34,31,28,.06–.13)`; emphasis `1.5px solid` in the role colour.

Shadows:
```
console   0 2px 6px rgba(34,31,28,.06), 0 20px 50px -26px rgba(34,31,28,.34)
hold card 0 10px 26px -14px rgba(176,117,20,.5)
primary   0 6px 16px -9px rgba(31,125,110,.75), inset 0 0 0 1px rgba(255,255,255,.12)
danger    0 6px 16px -9px rgba(192,57,43,.7)
sheet     0 -14px 40px -14px rgba(34,31,28,.3)
```

## Accessibility

Enforced in the design and verified by measurement:

- **4.5:1 minimum for all text**, including 9–11px chips and metadata. 3:1 applies only at headline scale.
- **No alpha-muted type on accent grounds.** `rgba(255,255,255,.75)` on `#1f7d6e` is 3.54:1; solid `#fff` is 4.98:1. Where a chip needs to sit on an accent button, darken the local ground (`rgba(0,0,0,.22)`) rather than lightening it.
- Amber and teal are never the *only* carrier of a state — each pairs with a label ("Held — you decide", "withheld", "corrected by you").
- Every primary action has a keyboard binding, surfaced in the UI.
- Tap targets ≥ 44px on mobile.
- Implementation additions the prototypes don't cover: `aria-live="polite"` on the transcript, `aria-live="assertive"` on holds, `role="timer"` on dead air, `prefers-reduced-motion` to disable `rec` / `breathe` / `eqbar` and shorten `riseIn` to a fade.

## Assets

None. No images, icon fonts, or SVG imports. Every glyph is a CSS primitive (bordered squares, circles, triangles from borders, bar pairs) and the waveforms are generated SVG `<rect>`s. Replace the CSS glyphs with the target codebase's icon set — mute, speaker, replay, pause, play, phone-end, chevron.

Font: Public Sans via Google Fonts.

## Files

| File | Contents |
|---|---|
| `screens/Screen 1 - AI handling.dc.html` | Listening state, t=7.5s. Desktop + mobile call frame. Record empty by design |
| `screens/Screen 2 - Held for the operator.dc.html` | Held state, t=11s. The intervention card, replay clip, three resolutions, withheld rail. Desktop + mobile with hold sheet |
| `screens/Screen 3 - Resolved and confirmed.dc.html` | Confirmed state, t=54s. Agent-step groups, filled record, lost slot. Desktop + **four** mobile frames: call, booking details, customer, taken-over |
| `screens/Interactive console.dc.html` | Live state machine with a "Jump to state" switcher. The behavioural reference — open this to see timing, animation, and transitions |
| `screens/Intervention framework.dc.html` | Dependency chain, seven-part card anatomy, four severities, the 47-condition catalogue, and the diagnosis of the original build |
| `screens/support.js` | Prototype template runtime. **Do not port.** Present only so the HTML opens standalone |

## Known gaps

Not designed yet, in rough priority order: the payment-provider timeout (charge state unknown) which is the nastiest case in the catalogue; two simultaneous holds with a queue; post-call summary and QA review; the supervisor view across several concurrent calls; empty/error states for an unreachable calendar; and the barge-in case where the caller talks over the AI mid-sentence.
