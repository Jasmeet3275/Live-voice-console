import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineSlotPick, SlotOpenings } from './inlineInputs'
import { SLOTS } from '@/stories/fixtures'

const meta = {
  title: 'Molecules/InlineInputs',
  component: InlineSlotPick,
  tags: ['autodocs'],
  args: { slots: SLOTS, onOffer: () => {} },
} satisfies Meta<typeof InlineSlotPick>

export default meta
type Story = StoryObj<typeof meta>

export const SlotPick: Story = {
  name: 'InlineSlotPick (offer one / both / ask)',
  render: () => (
    <div className="max-w-2xl">
      <InlineSlotPick slots={SLOTS} onOffer={(id, mode) => console.log('offer', mode, id)} />
    </div>
  ),
}

export const Openings: Story = {
  name: 'SlotOpenings (compact list)',
  render: () => (
    <div className="max-w-md">
      <SlotOpenings slots={SLOTS} />
    </div>
  ),
}
