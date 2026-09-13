import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderUI } from '@/test/utils'
import { ConsolePage } from './ConsolePage'

describe('ConsolePage (smoke)', () => {
  it('renders the console shell with the pre-call empty state and disabled dock', () => {
    renderUI(
      <ConsolePage scenarioId="happy" runId={0} onScenario={vi.fn()} onRestart={vi.fn()} />,
    )

    expect(screen.getByText('Zoca Front Desk')).toBeInTheDocument()
    expect(screen.getByText('Press Start to begin the call')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start demo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeInTheDocument()

    // Dock controls are inert until the call starts.
    expect(screen.getByRole('button', { name: 'Take over' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Mute' })).toBeDisabled()

    // Conversation landmark + skip link are present.
    expect(screen.getByRole('main', { name: 'Call conversation' })).toBeInTheDocument()
    expect(screen.getByText('Skip to conversation')).toBeInTheDocument()
  })
})
