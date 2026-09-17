import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus, Search, Bell, Trash2, Mic, MicOff } from 'lucide-react'
import { IconButton } from './IconButton'

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: { 'aria-label': 'Add', icon: <Plus size={18} />, variant: 'secondary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof IconButton>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="Add" variant="primary" icon={<Plus size={18} />} />
      <IconButton aria-label="Search" variant="secondary" icon={<Search size={18} />} />
      <IconButton aria-label="Alerts" variant="ghost" icon={<Bell size={18} />} />
      <IconButton aria-label="Delete" variant="danger" icon={<Trash2 size={18} />} />
    </div>
  ),
}

export const TransportControls: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton aria-label="Mute" variant="secondary" icon={<Mic size={18} />} />
      <IconButton aria-label="Unmute" variant="ghost" icon={<MicOff size={18} />} />
    </div>
  ),
}
