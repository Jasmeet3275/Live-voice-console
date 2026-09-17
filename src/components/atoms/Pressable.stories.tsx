import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pressable } from './Pressable'

const meta = {
  title: 'Atoms/Pressable',
  component: Pressable,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { description: { component: 'Unstyled, accessible press target (the base for tappable rows/cards). `pressFeedback` adds a subtle press-scale.' } },
  },
} satisfies Meta<typeof Pressable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex gap-4">
      <Pressable className="rounded-md border border-border bg-surface px-4 py-2 text-caption text-text">
        Plain pressable
      </Pressable>
      <Pressable pressFeedback className="rounded-md border border-border bg-surface px-4 py-2 text-caption text-text">
        With press feedback
      </Pressable>
    </div>
  ),
}
