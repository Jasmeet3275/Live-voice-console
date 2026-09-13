# Design Language — Calm Operational Console

Trustworthy control-room feel. State is legible everywhere without being alarming.
Light-first, dark supported. Tokens are the single source of truth — components never
hardcode hex values.

**Direction:** cool slate/neutral base · one confident **teal** accent · muted-but-clear
semantic colors · comfortable-compact density · 8–10px radius · hairline borders · soft
elevation · Inter + tabular numerals · purposeful motion (glow, gentle reveal).

---

## 1. Color tokens

Defined as CSS custom properties on `:root` (light) and `[data-theme="dark"]`. Tailwind
maps these via `theme.extend.colors` referencing `var(--…)`. Never use raw Tailwind
palette classes (`bg-slate-800`) in components — use semantic tokens (`bg-surface`).

### Light (default)
```css
:root {
  /* base surfaces */
  --bg-app:        #F6F8FB;   /* page background */
  --surface:       #FFFFFF;   /* cards, panels */
  --surface-2:     #F1F5F9;   /* nested / recessed */
  --surface-hover: #F8FAFC;

  /* borders */
  --border:        #E2E8F0;   /* hairline default */
  --border-strong: #CBD5E1;   /* dividers that need weight */

  /* text */
  --text:          #0F172A;   /* primary */
  --text-secondary:#475569;
  --text-muted:    #94A3B8;
  --text-inverse:  #FFFFFF;

  /* accent (teal) */
  --accent:        #0D9488;
  --accent-hover:  #0F766E;
  --accent-fg:     #FFFFFF;   /* text/icon on accent fill */
  --accent-subtle: #F0FDFA;   /* tinted background */
  --accent-border: #99F6E4;

  /* semantic — running/info (blue) */
  --info:          #2563EB;
  --info-subtle:   #EFF6FF;
  --info-border:   #BFDBFE;

  /* success (green) */
  --success:       #16A34A;
  --success-subtle:#F0FDF4;
  --success-border:#BBF7D0;

  /* warning (amber) */
  --warning:       #B45309;   /* text/icon (AA on light) */
  --warning-solid: #F59E0B;   /* dot/fill */
  --warning-subtle:#FFFBEB;
  --warning-border:#FDE68A;

  /* error (red) */
  --error:         #DC2626;
  --error-subtle:  #FEF2F2;
  --error-border:  #FECACA;

  /* waiting — human-in-the-loop (violet) */
  --waiting:       #7C3AED;
  --waiting-subtle:#F5F3FF;
  --waiting-border:#DDD6FE;

  /* focus */
  --focus-ring:    #0D9488;   /* = accent */
}
```

### Dark
```css
[data-theme="dark"] {
  --bg-app:        #0B1220;
  --surface:       #0F172A;
  --surface-2:     #1E293B;
  --surface-hover: #172033;

  --border:        #1E293B;
  --border-strong: #334155;

  --text:          #F1F5F9;
  --text-secondary:#94A3B8;
  --text-muted:    #64748B;
  --text-inverse:  #0B1220;

  --accent:        #2DD4BF;   /* brighter for dark */
  --accent-hover:  #5EEAD4;
  --accent-fg:     #042F2E;
  --accent-subtle: #0C2C2A;
  --accent-border: #115E59;

  --info:          #60A5FA;
  --info-subtle:   #0E1E3A;
  --info-border:   #1E3A8A;

  --success:       #4ADE80;
  --success-subtle:#0C2818;
  --success-border:#166534;

  --warning:       #FBBF24;
  --warning-solid: #F59E0B;
  --warning-subtle:#2A1E05;
  --warning-border:#854D0E;

  --error:         #F87171;
  --error-subtle:  #2A0F10;
  --error-border:  #991B1B;

  --waiting:       #A78BFA;
  --waiting-subtle:#1E1533;
  --waiting-border:#5B21B6;

  --focus-ring:    #2DD4BF;
}
```

**Theme switching:** default = light. `[data-theme="dark"]` on `<html>` flips it; also
honor `@media (prefers-color-scheme: dark)` for first paint. A visible toggle lives in the
app header.

---

## 2. Typography

- **Family:** `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Tabular numerals** (`font-variant-numeric: tabular-nums`) on all numbers that change:
  call timer, durations, prices, confidence %, timestamps — prevents jitter.

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `text-display` | 22 / 28 | 600 | call header, big totals |
| `text-title`   | 16 / 24 | 600 | panel / card titles |
| `text-body`    | 14 / 20 | 400 | default body |
| `text-body-strong` | 14 / 20 | 500 | emphasized body |
| `text-label`   | 13 / 18 | 500 | field labels, step labels |
| `text-caption` | 12 / 16 | 500 | chips, metadata |
| `text-micro`   | 11 / 14 | 500 | timestamps, fine print (uppercase optional, `letter-spacing: .04em`) |

---

## 3. Spacing, radius, elevation

**Spacing** (4px base): `1=4 · 2=8 · 3=12 · 4=16 · 5=20 · 6=24 · 8=32 · 10=40 · 12=48`.
Default card padding = `16`; compact list rows = `8–12`.

**Radius:** `sm=6 · md=8 · lg=10 · xl=14 · full=9999`. Buttons/inputs `md(8)`, cards/panels
`lg(10)`, chips/pills `full`, modals/sheets `xl(14)`.

**Elevation** (light; dark leans on borders + faint shadow):
```css
--elev-1: 0 1px 2px rgba(15,23,42,.06), 0 1px 1px rgba(15,23,42,.04); /* cards */
--elev-2: 0 2px 8px rgba(15,23,42,.08);                               /* raised / hover */
--elev-3: 0 8px 24px rgba(15,23,42,.12);                              /* popovers, modals */
```
Borders are the primary separation device (hairline `--border`); elevation is secondary.

---

## 4. Motion

```css
--dur-fast: 120ms;  --dur-base: 200ms;  --dur-slow: 320ms;
--ease-out: cubic-bezier(0.2, 0, 0, 1);       /* enters */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);  /* moves */
```
- **Step/transcript reveal:** fade + 4px rise, `--dur-base --ease-out`.
- **Running state:** 1.6s pulsing dot (opacity/scale).
- **Speaker-tile glow:** `box-shadow: 0 0 calc(8px + var(--level)*24px) rgba(accent, calc(.3 + var(--level)*.7))`; `--level` (0–1) from waveform amplitude at `currentTime`.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` → disable pulse/reveal/glow
  animation; use instant opacity and a **static** active ring on tiles.

---

## 5. State treatment (the core of this product)

Every stateful element uses the same vocabulary and colors.

| State | Token | Dot / icon | Meaning |
|---|---|---|---|
| running | `--info` | pulsing dot | step in progress |
| success | `--success` | ✓ | step resolved OK |
| warning | `--warning` | ▲ | needs a look; flow can continue with review |
| error | `--error` | ⛌ / alert | step failed; recovery required |
| waiting | `--waiting` | pause | needs the operator (human-in-the-loop) |

- **StatusChip:** pill = colored dot + label, on the matching `*-subtle` background with
  `*-border`. Color is never the *only* signal — always dot/icon + text (a11y).
- **Step card:** 2px left accent stripe in the state color; body neutral.
- **Recovery row:** appears on warning/error/waiting; renders one of the 4 archetypes
  (Retry · Degrade/continue · Alternative · Escalate/hold) as buttons.

**Confidence thresholds** (transcript words):
- `≥ 0.85` high → render normal.
- `0.65–0.85` medium → subtle dotted underline, no interruption.
- `< 0.65` low → **amber wavy underline** + `⚠ nn%` affordance; routes to `clarify`;
  **gates** the Confirm action until resolved. ("fade" @ 61% = low.)

---

## 6. Focus & accessibility baseline

- **Focus ring:** `:focus-visible` → `outline: 2px solid var(--focus-ring); outline-offset: 2px;`
  on every interactive element. Never remove focus outlines.
- Hit target ≥ 40×40px for primary controls (Take Over, mute, speaker, end, confirm).
- Semantic HTML + ARIA: `role`/`aria-label` on icon-only buttons; `aria-live="polite"`
  for speaker changes and step-state changes (throttled); `aria-pressed` on toggles.
- Color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI/graphics, verified in both themes.

---

## 7. Component inventory (Storybook)

**Foundations (docs stories):** Colors · Typography · Spacing/Radius · Elevation · Motion ·
Icons · Theme toggle.

**Primitives:** Button (primary / secondary / ghost / danger; sizes sm/md) · IconButton ·
StatusChip · Badge/Tag · Card/Panel · Divider · Tabs · Tooltip · Switch/Toggle · Select ·
TextInput · Avatar · Skeleton · Spinner · EmptyState · Modal/Sheet · Toast.

**Domain:** SpeakerTile (glow + speaking states) · Waveform · AudioPlayer · CallControls ·
TranscriptLine + ConfidenceWord · CallerContextCard · StepShell · StatusChip (shared) ·
TurnGroup · ConfidenceMeter · SlotCard · DraftBookingEditor · DepositForm · CallSummary ·
CustomerConfirmationCard · RecoveryActions.

Each story shows: default, all states (running/success/warning/error/waiting where
relevant), loading/empty/error, and both themes via the toolbar.

---

## 8. Tokens → Tailwind (implementation note)

- Put the `:root` / `[data-theme="dark"]` blocks in `src/styles/tokens.css`.
- In `tailwind.config.ts`, extend `colors` to reference the vars:
  `surface: "var(--surface)", accent: "var(--accent)", warning: "var(--warning)", …`
  and `boxShadow`/`borderRadius`/`fontSize` likewise.
- Components use semantic classes only (`bg-surface text-text border-border`), so theming
  is free and there is one place to tune the language.
