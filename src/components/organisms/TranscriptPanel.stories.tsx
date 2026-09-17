import type { Meta, StoryObj } from '@storybook/react-vite'
import { TranscriptPanel } from './TranscriptPanel'
import { TranscriptLine } from '@/components/molecules/TranscriptLine'
import { AgentSteps } from './AgentSteps'
import { AiThinkingBubble, ResolvedInlineRow } from '@/components/molecules/threadParts'
import { GREETING, CALLER_WORDS, CALLER_WORDS_OK, AI_WORDS, AVAIL_STEPS } from '@/stories/fixtures'

const meta = {
  title: 'Organisms/TranscriptPanel',
  component: TranscriptPanel,
  tags: ['autodocs'],
  args: { review: 'held', confidence: '91%', children: null },
  argTypes: { review: { control: 'inline-radio', options: ['none', 'held', 'resolved'] } },
} satisfies Meta<typeof TranscriptPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Held: Story = {
  render: () => (
    <div className="flex h-[440px] w-[640px] overflow-hidden rounded-2xl border border-border shadow-e2">
      <TranscriptPanel review="held" confidence="91%">
        <TranscriptLine speaker="ai" words={GREETING} time="0:00" />
        <TranscriptLine speaker="caller" name="Jordan" words={CALLER_WORDS} time="0:06" readOnly />
        <AgentSteps summary="availability · 3 calls, 1.4s" steps={AVAIL_STEPS} />
        <ResolvedInlineRow count={2} summary={'“tomorrow” → Tue 15 Sep · “evening” → after 5 PM'} />
        <AiThinkingBubble className="mt-auto" label="checking services, staff and the calendar" />
      </TranscriptPanel>
    </div>
  ),
}

export const Resolved: Story = {
  render: () => (
    <div className="flex h-[440px] w-[640px] overflow-hidden rounded-2xl border border-border shadow-e2">
      <TranscriptPanel review="resolved" confidence="97%">
        <TranscriptLine speaker="ai" words={GREETING} time="0:00" />
        <TranscriptLine speaker="caller" name="Jordan" words={CALLER_WORDS_OK} time="0:06" />
        <TranscriptLine speaker="ai" words={AI_WORDS} time="0:41" />
      </TranscriptPanel>
    </div>
  ),
}
