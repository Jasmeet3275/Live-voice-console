import type { Meta, StoryObj } from '@storybook/react-vite'

/* Design tokens — the handoff colour roles + type scale, read live from the CSS
   custom properties in tokens.css. Toggle the theme (toolbar) to see the dark
   ramp; nothing here is hard-coded. */
const meta = {
  title: 'Design/Tokens',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const SURFACES = ['--bg-app', '--surface', '--surface-2', '--surface-hover', '--bubble-caller']
const INK = ['--text', '--text-2', '--text-secondary', '--text-muted']
const ACCENTS = [
  ['--accent', 'teal — AI voice + recommendation'],
  ['--warning-solid', 'amber — a human must act'],
  ['--error', 'red — recording + End call only'],
]

function Swatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-14 w-full rounded-lg border border-border"
        style={{ background: `var(${token})` }}
      />
      <code className="text-[11px] text-text-secondary">{token}</code>
      {label && <span className="text-[11px] text-text-muted">{label}</span>}
    </div>
  )
}

export const Color: Story = {
  render: () => (
    <div className="flex flex-col gap-8 text-text">
      <section>
        <h3 className="mb-3 text-caption font-bold uppercase tracking-[0.12em] text-text-muted">Surfaces</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {SURFACES.map((t) => <Swatch key={t} token={t} />)}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-caption font-bold uppercase tracking-[0.12em] text-text-muted">Ink ramp</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {INK.map((t) => <Swatch key={t} token={t} />)}
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-caption font-bold uppercase tracking-[0.12em] text-text-muted">Accents (semantic — never decorative)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ACCENTS.map(([t, label]) => <Swatch key={t} token={t} label={label} />)}
        </div>
      </section>
    </div>
  ),
}

export const Type: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-text">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Section label · 9.5/700/.12em</p>
      <p className="text-[11.5px] text-text-secondary">Meta / chips — 11.5px</p>
      <p className="text-[13px]">Body / bubbles — 13px</p>
      <p className="text-[15px] font-semibold">Title — 15px / 600</p>
      <p className="text-[18px] font-bold tabular-nums">6:30 PM · best-fit slot — 18px tabular</p>
    </div>
  ),
}
