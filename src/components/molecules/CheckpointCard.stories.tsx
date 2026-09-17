import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckpointCard } from './CheckpointCard'

const meta = {
  title: 'Molecules/CheckpointCard',
  component: CheckpointCard,
  tags: ['autodocs'],
  args: {
    label: 'Held — you decide',
    cost: 'dead air 0:12',
    tone: 'hold',
    children: <p className="text-caption text-text-secondary">One word decides the booking, and it came through at 58%.</p>,
  },
  argTypes: { tone: { control: 'inline-radio', options: ['hold', 'ink', 'danger'] } },
} satisfies Meta<typeof CheckpointCard>

export default meta
type Story = StoryObj<typeof meta>

export const Hold: Story = { args: { tone: 'hold', label: 'Held — you decide' } }
export const Ink: Story = { args: { tone: 'ink', label: 'Agent needs a human', cost: undefined } }
export const Danger: Story = { args: { tone: 'danger', label: 'Payment — you decide', cost: undefined } }
