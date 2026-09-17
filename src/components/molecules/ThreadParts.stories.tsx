import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ThreadDivider, StruckWord, HighlightWord, TakeOverBar,
  ThreadNotice, OperatorNotice, AiThinkingBubble, ResolvedInlineRow,
} from './threadParts'

/* The small pieces that thread through the single-column feed. */
const meta = {
  title: 'Molecules/ThreadParts',
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
} satisfies Meta

export default meta
type Story = StoryObj

export const Words: Story = {
  render: () => (
    <p className="flex items-center gap-1.5 text-caption text-text-muted">
      Misheard, then corrected: <StruckWord>facials</StruckWord> → <HighlightWord>fades</HighlightWord>
    </p>
  ),
}

export const Dividers: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <ThreadDivider label="Call started · 0:00" />
      <ThreadDivider label="Held · 0:12" tone="amber" />
    </div>
  ),
}

export const AiThinking: Story = {
  render: () => <AiThinkingBubble label="checking services, staff and the calendar" />,
}

export const Resolved: Story = {
  render: () => <ResolvedInlineRow count={2} summary={'“tomorrow” → Tue 15 Sep · “evening” → after 5 PM'} />,
}

export const OperatorHolding: Story = {
  name: 'OperatorNotice (live)',
  render: () => <OperatorNotice speaking="0:18" onHandBack={() => {}} />,
}

export const TakeOver: Story = {
  name: 'TakeOverBar (compact)',
  render: () => <TakeOverBar onHandBack={() => {}} />,
}

export const NoticeCallerDropped: Story = {
  render: () => (
    <ThreadNotice
      tone="ink" dividerLabel="Caller hung up · 0:47"
      title="Jordan dropped mid-booking" who="during the 6:30 readback" meta="slot held 3:12"
      description="Service and stylist are captured; time and deposit were never confirmed. The chair stays reserved for three more minutes."
      action={{ label: 'Call back' }}
    />
  ),
}

export const NoticeBooked: Story = {
  render: () => (
    <ThreadNotice
      tone="teal" dividerLabel="Call ended · 2:14"
      title="Booked · Marco, tomorrow 6:30 PM" meta="caller hung up first"
      description="Haircut + beard trim · 45 min · $48 with the $15 deposit taken. Confirmation text sent to ··· 4821."
      action={{ label: 'Open booking' }}
    />
  ),
}
