import type { Meta, StoryObj } from '@storybook/react-vite'
import { AgentSteps } from './AgentSteps'
import { AVAIL_STEPS } from '@/stories/fixtures'

const meta = {
  title: 'Organisms/AgentSteps',
  component: AgentSteps,
  tags: ['autodocs'],
  args: { summary: 'availability · 3 calls, 1.4s', steps: AVAIL_STEPS },
  decorators: [(Story) => <div className="w-[560px]">{Story()}</div>],
} satisfies Meta<typeof AgentSteps>

export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = { args: { defaultOpen: true } }
export const Collapsed: Story = { args: { defaultOpen: false } }
export const Indented: Story = {
  name: 'Indented (under a bubble)',
  args: { indent: true },
}
