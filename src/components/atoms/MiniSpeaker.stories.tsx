import type { Meta, StoryObj } from '@storybook/react-vite'
import { MiniSpeaker } from './MiniSpeaker'

const meta = {
  title: 'Atoms/MiniSpeaker',
  component: MiniSpeaker,
  tags: ['autodocs'],
  args: { role: 'customer', name: 'Jordan', speaking: true, level: 0.6 },
  argTypes: {
    role: { control: 'inline-radio', options: ['customer', 'ai', 'operator'] },
    level: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof MiniSpeaker>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Roles: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <MiniSpeaker role="customer" name="Jordan" speaking level={0.6} />
      <MiniSpeaker role="ai" name="Zoca AI" speaking level={0.4} />
      <MiniSpeaker role="operator" name="You" muted />
    </div>
  ),
}
