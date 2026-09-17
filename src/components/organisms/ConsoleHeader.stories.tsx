import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ConsoleHeader, BrandLock, RecordingPill, StatusPill, ElapsedClock, OperatorChip,
} from './ConsoleHeader'

const meta = {
  title: 'Organisms/ConsoleHeader',
  component: ConsoleHeader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { state: 'listening', clock: '0:38', operator: 'Jasmeet' },
  argTypes: { state: { control: 'inline-radio', options: ['listening', 'held', 'takenOver', 'resolved'] } },
  decorators: [(Story) => <div className="overflow-hidden border-b border-border">{Story()}</div>],
} satisfies Meta<typeof ConsoleHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Listening: Story = { args: { state: 'listening', clock: '0:12' } }
export const Held: Story = { args: { state: 'held', clock: '0:38', deadAir: '0:12' } }
export const TakenOver: Story = { args: { state: 'takenOver', clock: '1:06' } }
export const Resolved: Story = { args: { state: 'resolved', clock: '2:14' } }

export const Parts: Story = {
  name: 'Sub-components',
  render: () => (
    <div className="flex flex-wrap items-center gap-4 bg-surface p-4">
      <BrandLock />
      <RecordingPill />
      <StatusPill state="held" timer="0:12" />
      <StatusPill state="takenOver" />
      <StatusPill state="resolved" />
      <ElapsedClock clock="0:38" />
      <OperatorChip name="Jasmeet" />
    </div>
  ),
}
