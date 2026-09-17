import type { Meta, StoryObj } from '@storybook/react-vite'
import { WordCheckpoint, ConfirmCheckpoint, PaymentCheckpoint, HandoffCheckpoint } from './checkpoints'

/* The four presentational checkpoint variants (the store-connected version is
   Organisms/InlineCheckpoint). */
const meta = {
  title: 'Shared/Checkpoints',
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
} satisfies Meta

export default meta
type Story = StoryObj

const log = (k: string) => console.log('chose', k)

export const CorrectWord: Story = { render: () => <WordCheckpoint onSelect={log} /> }
export const ConfirmBooking: Story = { render: () => <ConfirmCheckpoint onSelect={log} /> }
export const PaymentDeclined: Story = { render: () => <PaymentCheckpoint onSelect={log} /> }
export const Handoff: Story = { render: () => <HandoffCheckpoint onSelect={log} /> }
