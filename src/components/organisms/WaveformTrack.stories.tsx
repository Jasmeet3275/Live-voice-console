import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { WaveformTrack, generateBars } from './WaveformTrack'

const meta = {
  title: 'Organisms/WaveformTrack',
  component: WaveformTrack,
  tags: ['autodocs'],
  args: { progress: 0.6 },
} satisfies Meta<typeof WaveformTrack>

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
  const [progress, setProgress] = useState(0.6)
  return (
    <div className="w-[420px]">
      <WaveformTrack progress={progress} onSeek={setProgress} flags={[{ pos: 0.67, label: '38%' }]} height={40} />
    </div>
  )
}

export const Seekable: Story = { render: () => <Demo /> }

export const WithConfidenceFlag: Story = {
  render: () => (
    <div className="w-[420px]">
      <WaveformTrack bars={generateBars(84, { from: 0.62, to: 0.72 })} progress={1} flags={[{ pos: 0.67, label: '38%' }]} height={40} />
    </div>
  ),
}
