import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CallDock } from './CallDock'

const meta = {
  title: 'Organisms/CallDock',
  component: CallDock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    progress: 0.55, currentTime: 38_000, duration: 69_000, onSeek: () => {},
    muted: false, onMuteChange: () => {}, speakerOn: true, onSpeakerChange: () => {},
    inControl: false, onTakeOver: () => {}, onRelease: () => {}, onEndCall: () => {},
    callerName: 'Jordan', callerSpeaking: true, agentSpeaking: false, level: 0.4,
  },
} satisfies Meta<typeof CallDock>

export default meta
type Story = StoryObj<typeof meta>

function Demo({ inControl = false, disabled = false }: { inControl?: boolean; disabled?: boolean }) {
  const [progress, setProgress] = useState(0.55)
  const [muted, setMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [control, setControl] = useState(inControl)
  return (
    <div className="p-6">
      <CallDock
        progress={progress}
        currentTime={38_000}
        duration={69_000}
        onSeek={setProgress}
        muted={muted}
        onMuteChange={setMuted}
        speakerOn={speakerOn}
        onSpeakerChange={setSpeakerOn}
        inControl={control}
        onTakeOver={() => setControl(true)}
        onRelease={() => setControl(false)}
        onEndCall={() => {}}
        onBook={() => {}}
        callerName="Jordan"
        callerSpeaking={!control}
        agentSpeaking={false}
        level={0.4}
        disabled={disabled}
      />
    </div>
  )
}

export const AiHandling: Story = { render: () => <Demo /> }
export const OperatorInControl: Story = { render: () => <Demo inControl /> }
export const BeforeCall: Story = { name: 'Disabled (pre-call)', render: () => <Demo disabled /> }
