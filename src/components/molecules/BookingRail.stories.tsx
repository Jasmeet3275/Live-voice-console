import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookingRail } from './BookingRail'
import { Frame } from '@/stories/fixtures'

const meta = {
  title: 'Molecules/BookingRail',
  component: BookingRail,
  tags: ['autodocs'],
  args: { fields: { customer: 'Jordan Rivera' }, confirm: 'withheld' },
  argTypes: { confirm: { control: 'inline-radio', options: ['withheld', 'ready', 'charging', 'confirmed'] } },
} satisfies Meta<typeof BookingRail>

export default meta
type Story = StoryObj<typeof meta>

export const Withheld: Story = {
  name: 'Withheld (dependency rule)',
  render: () => (
    <Frame w={330} h={440}>
      <BookingRail
        className="h-full border-l-0"
        fields={{ customer: 'Jordan Rivera' }}
        confirm="withheld"
        withheldNote="Resolve the flagged word and all five fields fill at once."
      />
    </Frame>
  ),
}

export const Ready: Story = {
  render: () => (
    <Frame w={330} h={440}>
      <BookingRail
        className="h-full border-l-0"
        confirm="ready"
        fields={{
          customer: 'Jordan Rivera',
          service: 'Haircut + beard, fade',
          stylist: 'Marco Diaz',
          length: '45 min',
          time: 'Tue · 6:30 PM',
          price: '$48 · $15 deposit',
        }}
      />
    </Frame>
  ),
}

export const Confirmed: Story = {
  render: () => (
    <Frame w={330} h={440}>
      <BookingRail
        className="h-full border-l-0"
        confirm="confirmed"
        fields={{
          customer: 'Jordan Rivera',
          service: 'Haircut + beard, fade',
          stylist: 'Marco Diaz',
          length: '45 min',
          time: 'Tue · 6:30 PM',
          price: '$48 · $15 deposit',
        }}
      />
    </Frame>
  ),
}
