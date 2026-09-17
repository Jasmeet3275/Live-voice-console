import type { Meta, StoryObj } from '@storybook/react-vite'
import { Divider } from './Divider'

const meta = {
  title: 'Atoms/Divider',
  component: Divider,
  tags: ['autodocs'],
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="w-72 text-caption text-text-secondary">
      <p className="pb-3">Transcript</p>
      <Divider />
      <p className="pt-3">Slots</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3 text-caption text-text-secondary">
      <span>Recording</span>
      <Divider orientation="vertical" />
      <span>0:38</span>
      <Divider orientation="vertical" />
      <span>Jasmeet</span>
    </div>
  ),
}
