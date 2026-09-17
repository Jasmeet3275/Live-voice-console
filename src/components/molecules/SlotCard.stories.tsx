import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { SlotCard } from './SlotCard'
import { SLOTS } from '@/stories/fixtures'

const meta = {
  title: 'Molecules/SlotCard',
  component: SlotCard,
  tags: ['autodocs'],
  args: { slot: SLOTS[0] },
} satisfies Meta<typeof SlotCard>

export default meta
type Story = StoryObj<typeof meta>

export const BestFit: Story = { args: { slot: SLOTS[0], selected: true } }
export const Alternative: Story = { args: { slot: SLOTS[1] } }
export const Unavailable: Story = { args: { slot: SLOTS[2] } }

function Group() {
  const [selected, setSelected] = useState('r')
  return (
    <div role="radiogroup" aria-label="Slots" className="grid max-w-3xl gap-3 sm:grid-cols-3">
      {SLOTS.map((s) => (
        <SlotCard key={s.id} slot={s} selected={selected === s.id} onSelect={setSelected} />
      ))}
    </div>
  )
}

export const PickOne: Story = {
  name: 'Slot list (selection clears others)',
  render: () => <Group />,
}
