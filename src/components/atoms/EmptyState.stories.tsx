import type { Meta, StoryObj } from '@storybook/react-vite'
import { Inbox, CalendarPlus } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { Button } from './Button'

const meta = {
  title: 'Atoms/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: { title: 'No calls in the queue' },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-[420px]">
      <EmptyState
        icon={<Inbox size={20} />}
        title="No calls in the queue"
        description="When a customer calls the front desk, the live console appears here."
        action={<Button size="sm" leftIcon={<CalendarPlus size={16} />}>Start a demo call</Button>}
      />
    </div>
  ),
}

export const TitleOnly: Story = {
  render: () => (
    <div className="w-[420px]">
      <EmptyState icon={<Inbox size={20} />} title="Nothing here yet" />
    </div>
  ),
}
