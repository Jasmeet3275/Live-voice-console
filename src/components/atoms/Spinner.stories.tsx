import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spinner } from './Spinner'

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  args: { size: 16 },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size={14} />
      <Spinner size={16} />
      <Spinner size={20} />
      <Spinner size={28} />
    </div>
  ),
}

export const InlineWithLabel: Story = {
  render: () => (
    <span className="inline-flex items-center gap-2 text-caption text-text-secondary">
      <Spinner size={14} /> Taking deposit…
    </span>
  ),
}
