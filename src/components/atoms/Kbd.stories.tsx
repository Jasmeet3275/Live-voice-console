import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kbd } from './Kbd'

const meta = {
  title: 'Atoms/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  args: { children: 'Enter' },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Keys: Story = {
  render: () => (
    <span className="flex items-center gap-1.5 text-caption text-text-muted">
      <Kbd>Space</Kbd> play · <Kbd>T</Kbd> take over · <Kbd>2</Kbd>/<Kbd>3</Kbd> pick · <Kbd>⌘</Kbd><Kbd>K</Kbd> shortcuts
    </span>
  ),
}
