import type { Meta, StoryObj } from '@storybook/react-vite'
import { CallerPanel } from './CallerPanel'
import { CALLER } from '@/stories/fixtures'

const meta = {
  title: 'Organisms/CallerPanel',
  component: CallerPanel,
  tags: ['autodocs'],
  args: { caller: CALLER },
} satisfies Meta<typeof CallerPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Caller chip (click avatar for record)',
  render: () => (
    <div className="relative h-40 w-[420px]">
      <CallerPanel caller={CALLER} className="absolute left-0 top-0" />
    </div>
  ),
}
