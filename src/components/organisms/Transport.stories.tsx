import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Transport } from './Transport'

const meta = {
  title: 'Organisms/Transport',
  component: Transport,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="overflow-hidden rounded-2xl border border-border">{Story()}</div>],
} satisfies Meta<typeof Transport>

export default meta
type Story = StoryObj<typeof meta>

function Demo({ inControl = false }: { inControl?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0.55)
  const [muted, setMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  return (
    <Transport
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      progress={progress}
      onSeek={setProgress}
      clock="0:38"
      windowLabel="last 24s"
      muted={muted}
      onMute={() => setMuted((m) => !m)}
      speakerOn={speakerOn}
      onSpeaker={() => setSpeakerOn((s) => !s)}
      onReplay={() => {}}
      onStall={() => {}}
      inControl={inControl}
      onTakeOver={() => {}}
      onRelease={() => {}}
      onEnd={() => {}}
      flagPct="38%"
    />
  )
}

export const AiHandling: Story = { render: () => <Demo /> }
export const OperatorInControl: Story = { render: () => <Demo inControl /> }
export const Disabled: Story = {
  render: () => (
    <Transport progress={0} clock="0:00" windowLabel="not started" disabled />
  ),
}
