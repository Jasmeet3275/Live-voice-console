import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookingRecordPanel } from './BookingRecordPanel'
import { Frame } from '@/stories/fixtures'

const meta = {
  title: 'Organisms/BookingRecordPanel',
  component: BookingRecordPanel,
  tags: ['autodocs'],
  args: { fields: { customer: 'Jordan Rivera' }, confirm: 'withheld' },
  argTypes: { confirm: { control: 'inline-radio', options: ['withheld', 'ready', 'charging', 'confirmed'] } },
} satisfies Meta<typeof BookingRecordPanel>

export default meta
type Story = StoryObj<typeof meta>

const filled = {
  customer: 'Jordan Rivera',
  service: 'Haircut + beard, fade',
  stylist: 'Marco Diaz',
  length: '45 min',
  time: 'Tue · 6:30 PM',
  price: '$48 · $15 deposit',
}

export const Withheld: Story = {
  render: () => (
    <Frame w={330} h={560}>
      <BookingRecordPanel
        className="h-full"
        fields={{ customer: 'Jordan Rivera' }}
        confirm="withheld"
        withheldNote="Resolve the flagged word and all five fields fill at once."
      />
    </Frame>
  ),
}

export const ReadyToConfirm: Story = {
  render: () => (
    <Frame w={330} h={560}>
      <BookingRecordPanel className="h-full" fields={filled} confirm="ready" deposit="$15" onConfirm={() => {}} />
    </Frame>
  ),
}

export const Confirmed: Story = {
  render: () => (
    <Frame w={330} h={560}>
      <BookingRecordPanel className="h-full" fields={filled} confirm="confirmed" />
    </Frame>
  ),
}

export const OperatorEditing: Story = {
  name: 'Operator editing (take-over)',
  render: () => (
    <Frame w={330} h={560}>
      <BookingRecordPanel
        className="h-full"
        editing
        deposit="$15"
        services={['Haircut', 'Beard trim']}
        stylist="Marco Diaz"
        time="Tomorrow · 6:30 PM"
        fields={{ customer: 'Jordan Rivera' }}
        operator="Dana K."
        onSave={() => {}}
        onHandBack={() => {}}
      />
    </Frame>
  ),
}
