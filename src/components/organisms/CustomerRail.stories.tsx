import type { Meta, StoryObj } from '@storybook/react-vite'
import { CustomerRail } from './CustomerRail'
import { CALLER, INFERENCE, Frame } from '@/stories/fixtures'

const meta = {
  title: 'Organisms/CustomerRail',
  component: CustomerRail,
  tags: ['autodocs'],
  args: { caller: CALLER, inference: INFERENCE },
} satisfies Meta<typeof CustomerRail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Frame w={264} h={560}>
      <CustomerRail className="h-full border-r-0" caller={CALLER} inference={INFERENCE} />
    </Frame>
  ),
}

export const Docked: Story = {
  name: 'Docked (collapsible)',
  render: () => (
    <Frame w={264} h={560}>
      <CustomerRail className="h-full border-r-0" caller={CALLER} inference={INFERENCE} onCollapse={() => {}} />
    </Frame>
  ),
}
