import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { MobileConsole, PhoneFrame, MobileTabStrip } from './MobileConsole'
import { CALLER, INFERENCE } from '@/stories/fixtures'

const meta = {
  title: 'Organisms/MobileConsole',
  component: MobileConsole,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile' },
  },
  globals: { viewport: { value: 'mobile', isRotated: false } },
  args: { caller: CALLER, inference: INFERENCE, confirm: 'withheld' },
  argTypes: { confirm: { control: 'inline-radio', options: ['withheld', 'ready', 'charging', 'confirmed'] } },
} satisfies Meta<typeof MobileConsole>

export default meta
type Story = StoryObj<typeof meta>

export const Withheld: Story = { args: { confirm: 'withheld' } }
export const Confirmed: Story = { args: { confirm: 'confirmed' } }

export const SideBySide: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
  globals: { viewport: { value: 'desktop', isRotated: false } },
  render: () => (
    <div className="flex flex-wrap gap-8">
      <MobileConsole caller={CALLER} inference={INFERENCE} confirm="withheld" />
      <MobileConsole caller={CALLER} inference={INFERENCE} confirm="confirmed" />
    </div>
  ),
}

function TabStripDemo() {
  const [active, setActive] = useState<'Call' | 'Booking' | 'Customer'>('Call')
  return <MobileTabStrip active={active} onChange={setActive} />
}

export const Parts: Story = {
  name: 'PhoneFrame + MobileTabStrip',
  parameters: { viewport: { defaultViewport: 'desktop' } },
  globals: { viewport: { value: 'desktop', isRotated: false } },
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <PhoneFrame>
        <div className="flex h-full items-center justify-center text-caption text-text-muted">Light frame</div>
      </PhoneFrame>
      <PhoneFrame dark>
        <div className="flex h-full items-center justify-center text-caption text-text-muted">Taken-over (dark) frame</div>
      </PhoneFrame>
      <div className="w-[360px]"><TabStripDemo /></div>
    </div>
  ),
}
