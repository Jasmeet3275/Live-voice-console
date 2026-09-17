import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckpointSheet, PreviewLine, ClipPlayerRow } from './CheckpointSheet'
import type { CheckpointOption } from './CheckpointSheet'

const meta = {
  title: 'Organisms/CheckpointSheet',
  component: CheckpointSheet,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
  args: { label: 'Held — you decide', claim: 'One word decides the booking.', options: [] },
} satisfies Meta<typeof CheckpointSheet>

export default meta
type Story = StoryObj<typeof meta>

const wordOptions: CheckpointOption[] = [
  { key: 'Accept · Enter', title: '“fades”', note: 'as transcribed', pick: true },
  { key: 'Use this · 2', title: '“facials”', note: 'swap this in' },
  { key: 'Ask · 3', title: 'Ask Jordan', note: 'reconfirms aloud · ~8s', dashed: true },
]

export const CorrectWord: Story = {
  render: () => (
    <CheckpointSheet
      label="Held — you decide"
      cost="dead air 0:12"
      tone="hold"
      claim={<>One word decides the booking, and it came through at <b className="text-warning">58%</b>. Which is it?</>}
      subline="The AI is holding the line with “Let me check that for you.”"
      options={wordOptions}
    />
  ),
}

export const Handoff: Story = {
  render: () => (
    <CheckpointSheet
      label="Agent needs a human"
      cost="dead air 0:09"
      tone="ink"
      claim={<>Scheduling service error — <b className="text-warning">HTTP 503</b></>}
      subline="Calendar unreachable, 3 retries failed. No availability to offer."
      options={[
        { key: 'Take over · ⌘⇧T', title: 'Take over the call', note: 'AI goes silent, keeps transcribing', pick: true },
        { key: 'Queue · 2', title: 'Promise a callback', note: 'tops the desk queue' },
        { key: 'Text link · 3', title: 'Send a booking link', note: 'needs the calendar back', dashed: true },
      ]}
    />
  ),
}

/** The evidence / readback pieces, kept as standalone building blocks — the
 *  focused checkpoint no longer inlines them, but they're still exported. */
export const Pieces: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ClipPlayerRow label="0:06 · 2.0s" />
      <PreviewLine quote="Got it — fades. Let me find you an evening slot." />
    </div>
  ),
}
