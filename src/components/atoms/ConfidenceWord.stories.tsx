import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConfidenceWord } from './ConfidenceWord'
import type { TranscriptWord } from '@/types/call'

const meta = {
  title: 'Atoms/ConfidenceWord',
  component: ConfidenceWord,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { word: { text: 'fades', confidence: 0.58, alternatives: ['fades', 'facials'] } },
} satisfies Meta<typeof ConfidenceWord>

export default meta
type Story = StoryObj<typeof meta>

const high: TranscriptWord = { text: 'haircut', confidence: 0.98 }
const low: TranscriptWord = { text: 'fades', confidence: 0.58, alternatives: ['fades', 'facials'] }
const corrected: TranscriptWord = { text: 'fades', confidence: 0.99, corrected: true }

export const HighConfidence: Story = {
  render: () => <p className="text-body text-text">someone good with <ConfidenceWord word={high} /></p>,
}

export const LowConfidence: Story = {
  name: 'Low confidence (click to correct)',
  render: () => (
    <p className="text-body text-text">
      someone good with <ConfidenceWord word={low} onCorrect={(c) => console.log('chose', c)} />
    </p>
  ),
}

export const ReadOnlyFlag: Story = {
  render: () => <p className="text-body text-text">someone good with <ConfidenceWord word={low} readOnly /></p>,
}

export const Corrected: Story = {
  render: () => <p className="text-body text-text">someone good with <ConfidenceWord word={corrected} /></p>,
}
