import type { Meta, StoryObj } from '@storybook/react-vite'
import { RecordingIndicator } from './RecordingIndicator'

const meta = {
  title: 'Molecules/RecordingIndicator',
  component: RecordingIndicator,
  tags: ['autodocs'],
  args: { recording: true },
} satisfies Meta<typeof RecordingIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Recording: Story = { args: { recording: true } }
export const Stopped: Story = { args: { recording: false } }
