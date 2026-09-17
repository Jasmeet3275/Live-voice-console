import type { Meta, StoryObj } from '@storybook/react-vite'
import { CallEndedReceipt, CallDroppedCheckpoint } from './callEnd'

const meta = {
  title: 'Shared/CallEnd',
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
} satisfies Meta

export default meta
type Story = StoryObj

export const EndedReceipt: Story = {
  name: 'Call ended (receipt)',
  render: () => <CallEndedReceipt onOpenBooking={() => {}} />,
}

export const Dropped: Story = {
  name: 'Call dropped (checkpoint)',
  render: () => <CallDroppedCheckpoint onSelect={(k) => console.log('chose', k)} />,
}
