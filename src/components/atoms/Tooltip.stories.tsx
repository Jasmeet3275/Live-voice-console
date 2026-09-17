import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip } from './Tooltip'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { content: 'Shortcut: T', children: 'Trigger' },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip content="Shortcut: T">
      <Button variant="secondary" size="sm">Hover me</Button>
    </Tooltip>
  ),
}

export const Sides: Story = {
  render: () => (
    <div className="flex gap-6">
      {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
        <Tooltip key={side} content={`Side: ${side}`} side={side}>
          <Button variant="secondary" size="sm">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
}
