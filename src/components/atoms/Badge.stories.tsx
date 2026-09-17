import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { BADGE_TONES } from '@/stories/fixtures'

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: '4 visits', tone: 'neutral' },
  argTypes: { tone: { control: 'inline-radio', options: BADGE_TONES } },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {BADGE_TONES.map((t) => (
        <Badge key={t} tone={t}>{t}</Badge>
      ))}
    </div>
  ),
}

export const InContext: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">4 visits</Badge>
      <Badge tone="success">0 no-shows</Badge>
      <Badge tone="accent">AI&apos;s pick</Badge>
      <Badge tone="warning">Needs review</Badge>
    </div>
  ),
}
