import type { Meta, StoryObj } from '@storybook/react-vite'
import { CallSummary } from './CallSummary'

const meta = {
  title: 'Organisms/CallSummary',
  component: CallSummary,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[440px]">{Story()}</div>],
  args: {
    customer: 'Jordan Rivera',
    services: ['Haircut', 'Beard trim'],
    stylist: 'Marco Diaz',
    when: 'Tomorrow · 6:30 PM',
    duration: '45 min',
    price: '$48',
    status: 'confirmed',
  },
} satisfies Meta<typeof CallSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Confirmed: Story = {
  args: {
    deposit: { amount: 15, status: 'collected' },
    notes: ['Corrected "facials" → "fades" (heard at 58%)', 'Deposit charged to •••• 4242'],
  },
}

export const Pending: Story = {
  args: { status: 'pending', deposit: { amount: 15, status: 'pending' } },
}

export const Failed: Story = {
  args: { status: 'failed', deposit: { amount: 15, status: 'waived' }, notes: ['Card declined — deposit waived by operator'] },
}
