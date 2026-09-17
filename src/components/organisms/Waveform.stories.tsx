import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Waveform } from './Waveform'

const meta = {
  title: 'Organisms/Waveform',
  component: Waveform,
  tags: ['autodocs'],
  args: { data: [], progress: 0.6 },
} satisfies Meta<typeof Waveform>

export default meta
type Story = StoryObj<typeof meta>

// Deterministic amplitude data so the story renders identically every time.
const data = Array.from({ length: 96 }, (_, i) => 0.25 + 0.6 * Math.abs(Math.sin(i / 5) * Math.cos(i / 11)))

function Demo() {
  const [progress, setProgress] = useState(0.6)
  return (
    <div className="w-[520px]">
      <Waveform data={data} progress={progress} onSeek={setProgress} height={56} valueText="1:23 of 3:00" />
    </div>
  )
}

export const Seekable: Story = { render: () => <Demo /> }

export const Static: Story = {
  render: () => (
    <div className="w-[520px]">
      <Waveform data={data} progress={0.4} height={56} aria-label="Call audio" />
    </div>
  ),
}
