import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderUI } from '@/test/utils'
import { CallDock, type CallDockProps } from './CallDock'

function props(over: Partial<CallDockProps> = {}): CallDockProps {
  return {
    progress: 0.5,
    currentTime: 30000,
    duration: 60000,
    onSeek: vi.fn(),
    muted: false,
    onMuteChange: vi.fn(),
    speakerOn: true,
    onSpeakerChange: vi.fn(),
    inControl: false,
    onTakeOver: vi.fn(),
    onRelease: vi.fn(),
    onEndCall: vi.fn(),
    onBook: vi.fn(),
    callerName: 'Jordan',
    callerSpeaking: false,
    agentSpeaking: false,
    level: 0,
    ...over,
  }
}

describe('CallDock', () => {
  it('offers Take over when the AI is in control', () => {
    renderUI(<CallDock {...props({ inControl: false })} />)
    expect(screen.getByRole('button', { name: 'Take over' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Book' })).toBeNull()
  })

  it('offers Book / Hand back when the operator is in control', () => {
    renderUI(<CallDock {...props({ inControl: true })} />)
    expect(screen.getByRole('button', { name: 'Book' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hand back' })).toBeInTheDocument()
  })

  it('wires mute and end-call controls', () => {
    const p = props()
    renderUI(<CallDock {...p} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(p.onMuteChange).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'End call' }))
    expect(p.onEndCall).toHaveBeenCalled()
  })

  it('disables every control before the call has started', () => {
    const p = props({ disabled: true })
    renderUI(<CallDock {...p} />)
    expect(screen.getByRole('button', { name: 'Mute' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'End call' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Take over' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))
    expect(p.onMuteChange).not.toHaveBeenCalled()
  })
})
