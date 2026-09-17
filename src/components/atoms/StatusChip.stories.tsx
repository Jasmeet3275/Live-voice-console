import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusChip } from './StatusChip'
import { STATUSES } from '@/stories/fixtures'

const meta = {
  title: 'Atoms/StatusChip',
  component: StatusChip,
  tags: ['autodocs'],
  args: { status: 'running' },
  argTypes: {
    status: { control: 'inline-radio', options: STATUSES },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof StatusChip>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {STATUSES.map((s) => (
        <StatusChip key={s} status={s} />
      ))}
    </div>
  ),
}

export const CustomLabel: Story = {
  args: { status: 'running', label: 'Searching…' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <StatusChip status="success" size="sm" />
      <StatusChip status="success" size="md" />
    </div>
  ),
}
