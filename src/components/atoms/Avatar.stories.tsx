import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { name: 'Jordan Rivera', size: 'md' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="Jordan Rivera" size="sm" />
      <Avatar name="Jordan Rivera" size="md" />
      <Avatar name="Marco Diaz" size="lg" />
    </div>
  ),
}
