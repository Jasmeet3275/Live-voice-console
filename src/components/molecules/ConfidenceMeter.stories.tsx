import type { Meta, StoryObj } from '@storybook/react-vite'
import { ConfidenceMeter } from './ConfidenceMeter'

const meta = {
  title: 'Molecules/ConfidenceMeter',
  component: ConfidenceMeter,
  tags: ['autodocs'],
  args: { value: 0.91, label: 'avg' },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } } },
} satisfies Meta<typeof ConfidenceMeter>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Levels: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <ConfidenceMeter label="high" value={0.97} />
      <ConfidenceMeter label="med" value={0.72} />
      <ConfidenceMeter label="low" value={0.58} />
    </div>
  ),
}
