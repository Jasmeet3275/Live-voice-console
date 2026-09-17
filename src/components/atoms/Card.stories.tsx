import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus } from 'lucide-react'
import { Card, CardHeader } from './Card'
import { IconButton } from './IconButton'

const meta = {
  title: 'Atoms/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = {
  render: () => (
    <div className="w-80">
      <Card>
        <CardHeader title="Plain card" subtitle="Border defines the edge" />
        <p className="mt-2 text-caption text-text-secondary">No shadow — the warm border carries containment.</p>
      </Card>
    </div>
  ),
}

export const Raised: Story = {
  render: () => (
    <div className="w-80">
      <Card raised>
        <CardHeader
          title="Raised card"
          subtitle="Faint warm shadow"
          action={<IconButton aria-label="Add" size="sm" variant="ghost" icon={<Plus size={16} />} />}
        />
        <p className="mt-2 text-caption text-text-secondary">Elevation for things that truly float.</p>
      </Card>
    </div>
  ),
}
