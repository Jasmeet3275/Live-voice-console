import type { Meta, StoryObj } from '@storybook/react-vite'
import { TranscriptLine } from './TranscriptLine'
import { AI_WORDS, CALLER_WORDS, CALLER_WORDS_OK, GREETING } from '@/stories/fixtures'

const meta = {
  title: 'Molecules/TranscriptLine',
  component: TranscriptLine,
  tags: ['autodocs'],
  args: { speaker: 'ai', words: AI_WORDS, time: '0:41' },
  argTypes: { speaker: { control: 'inline-radio', options: ['ai', 'caller'] } },
} satisfies Meta<typeof TranscriptLine>

export default meta
type Story = StoryObj<typeof meta>

export const AiBubble: Story = { args: { speaker: 'ai', words: GREETING, time: '0:00' } }

export const CallerBubble: Story = {
  args: { speaker: 'caller', name: 'Jordan', words: AI_WORDS, time: '0:06' },
}

export const WithLowConfidenceWord: Story = {
  name: 'Caller · flagged word (click to correct)',
  render: () => (
    <div className="max-w-xl">
      <TranscriptLine speaker="caller" name="Jordan" time="0:06" words={CALLER_WORDS} onCorrectWord={(_, c) => console.log('chose', c)} />
    </div>
  ),
}

export const Corrected: Story = {
  render: () => (
    <div className="max-w-xl">
      <TranscriptLine speaker="caller" name="Jordan" time="0:06" words={CALLER_WORDS_OK} />
    </div>
  ),
}

export const Active: Story = {
  args: { speaker: 'ai', words: AI_WORDS, time: '0:41', active: true },
}

export const Conversation: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <TranscriptLine speaker="ai" words={GREETING} time="0:00" />
      <TranscriptLine speaker="caller" name="Jordan" words={CALLER_WORDS} time="0:06" readOnly />
      <TranscriptLine speaker="ai" words={AI_WORDS} time="0:41" />
    </div>
  ),
}
