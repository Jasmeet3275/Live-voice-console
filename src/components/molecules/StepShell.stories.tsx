import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarSearch } from 'lucide-react'
import { StepShell } from './StepShell'
import { Button } from '@/components/atoms'

const meta = {
  title: 'Molecules/StepShell',
  component: StepShell,
  tags: ['autodocs'],
  args: {
    label: 'Checking availability',
    icon: <CalendarSearch size={15} />,
    state: 'running',
    time: '0.9s',
  },
  argTypes: {
    state: { control: 'inline-radio', options: ['running', 'success', 'warning', 'error', 'waiting'] },
  },
  decorators: [(Story) => <div className="w-[540px]"><Story /></div>],
} satisfies Meta<typeof StepShell>

export default meta
type Story = StoryObj<typeof meta>

export const Running: Story = { args: { state: 'running', statusLabel: 'Searching…' } }

export const Success: Story = {
  args: {
    state: 'success',
    children: <p className="text-caption text-text-secondary">3 open, 2 offerable after 5 PM.</p>,
  },
}

export const Waiting: Story = {
  args: {
    state: 'waiting',
    label: 'Held — needs the operator',
    children: <p className="text-caption text-text-secondary">One word came through at 58%.</p>,
    actions: (
      <>
        <Button size="sm">Accept</Button>
        <Button size="sm" variant="secondary">Ask caller</Button>
      </>
    ),
  },
}

export const Error: Story = {
  args: { state: 'error', label: 'Deposit declined', statusLabel: 'Declined' },
}
