---
name: component-quality
description: Use whenever building, modifying, or reviewing a UI component in this repo (anything under src/components/ or a page/footer/bar/card/checkpoint/notice/dock). Enforces the non-negotiables — works on all screen sizes (mobile → desktop), is accessible, and is fully operable by keyboard with visible shortcuts. Consult the design handoff screens (incl. their mobile frames) before writing markup.
---

# Component quality — all screens, accessible, keyboard-first

Every component in this project must satisfy all three of the following before it's
considered done. Do not ship a component that only works at desktop width, only
works with a mouse, or lacks a keyboard path. Verify at ≤390px **and** desktop, in
**light and dark**, before saying it's done.

## 1. All screens (responsive by default)

- Design for **mobile-first**, then enhance for wider screens with `sm:`/`md:`/`lg:`.
  Base (no prefix) = the narrow layout.
- **Never let the page scroll horizontally.** The body must not overflow at 320–390px.
  Wide content (button rows, waveforms, tables, code, chips) either wraps
  (`flex-wrap`) or scrolls inside its own `overflow-x-auto` container.
- A crowded single row on desktop usually needs to **stack or wrap on mobile**
  (`flex-col sm:flex-row`), or drop non-essential secondary labels on mobile
  (`hidden sm:inline`) — never shrink tap targets below ~40px.
- Use relative units, `min-w-0` on flex children that hold text/waveforms (so they
  can shrink), `max-w-full` on media. Give each control a sensible `shrink-0`.
- **Reference the design's mobile frame**, not just the desktop screen:
  `design_handoff_live_call_console/screens/*.dc.html` contain a 390×844 phone
  frame beside each desktop screen — match that layout for the small breakpoint
  (e.g. Screen 3's mobile action bar: a 44px round play, a 44px mute, a flex-1
  "Take over", and a 44px end — not the desktop's 6-control row).
- Both **light and dark** must be correct — reference tokens by role
  (`bg-surface`, `text-text`, `border-border`, `bg-accent` …); never hardcode hex.

## 2. Accessible

- Icon-only buttons get an `aria-label`; toggle buttons get `aria-pressed`;
  a slider-like control gets `role="slider"` + `aria-valuenow/min/max`.
- Inert states use the real `disabled` attribute (not just `pointer-events-none`)
  so screen readers and tests see it; dim visually **and** disable.
- Keep a **visible focus ring** on every interactive element (the global
  `:focus-visible` handles most — don't remove outlines).
- Meaning is never carried by color alone (pair status color with an icon/label).
- Respect `prefers-reduced-motion` (already global) and keep contrast ≥ 4.5:1.

## 3. Keyboard-first & easy to use

- Everything actionable by mouse is reachable and operable by keyboard.
- Where a component is a decision (checkpoint, dialog, dock), **show the shortcut
  hint** on the control (e.g. `Enter`, `2`, `3`, `M`, `⌘⇧T`) and wire the key.
- Global operator shortcuts live in `src/hooks/useKeyboardShortcuts.ts` +
  `SHORTCUTS` (rendered in the shortcuts dialog) — add new bindings there and keep
  the two in sync. Don't collide with an existing key (Space/K, M, S, T, H, B, E, ?).
- `Enter` fires the primary action; `Esc` is the safe exit (close / take over).

## Before finishing
Run `npx tsc -p tsconfig.app.json --noEmit`, `npx vitest run`, and eyeball the
component at a narrow width (resize or the `?demo` showcase) in both themes.
