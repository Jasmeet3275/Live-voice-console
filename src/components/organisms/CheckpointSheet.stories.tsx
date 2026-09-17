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
  { key: 'Accept · Enter', title: '“fades”', pick: true, rationale: 'Take it as transcribed — the AI moves straight on to availability.' },
  { key: 'Use this · 2', title: '“facials”', rationale: 'Swap in this reading before the AI acts on it.' },
  { key: 'Ask · 3', title: 'Ask Jordan', dashed: true, rationale: 'The AI reconfirms aloud — a few seconds, and it admits the mishear.' },
]

export const CorrectWord: Story = {
  render: () => (
    <CheckpointSheet
      label="Held — you decide"
      category="Understanding · service"
      cost="dead air 0:12"
      tone="hold"
      claim={<>One word decides the booking, and it came through at <b className="text-warning">58%</b>.</>}
      subline="No capability check, no duration, no slots yet — the AI is holding the line with “Let me check that for you.”"
      evidence={<ClipPlayerRow label="0:06 · 2.0s" />}
      options={wordOptions}
      readback="Got it — fades. Let me find you an evening slot."
    />
  ),
}

export const Handoff: Story = {
  render: () => (
    <CheckpointSheet
      label="Agent needs a human"
      category="Availability · unavailable"
      tone="ink"
      claim={<>There&apos;s nothing safe for the AI to offer without you — <b className="text-warning">3 retries failed</b>.</>}
      options={[
        { key: 'Take over · Enter', title: 'Take over the call', pick: true, rationale: 'Step in and book manually. The AI goes silent but keeps transcribing.' },
        { key: 'Queue · 2', title: 'Promise a callback', rationale: 'The AI ends politely and queues the caller at the top of the desk list.' },
        { key: 'Text link · 3', title: 'Send a booking link', dashed: true, rationale: 'Texts the self-serve page so the caller can finish online.' },
      ]}
    />
  ),
}

export const Pieces: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ClipPlayerRow label="0:06 · 2.0s" />
      <PreviewLine quote="Got it — fades. Let me find you an evening slot." />
    </div>
  ),
}
