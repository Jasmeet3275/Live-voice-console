import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StepShell } from './StepShell'

describe('StepShell', () => {
  it('renders the label, a status chip, and body content', () => {
    render(
      <StepShell label="Checking availability" state="success">
        <span>3 open slots</span>
      </StepShell>,
    )
    expect(screen.getByText('Checking availability')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('3 open slots')).toBeInTheDocument()
  })

  it('uses a custom status label when provided', () => {
    render(<StepShell label="Availability" state="error" statusLabel="Timed out" />)
    expect(screen.getByText('Timed out')).toBeInTheDocument()
  })

  it('collapses and expands its body when collapsible', () => {
    render(
      <StepShell label="Steps" state="success" collapsible defaultOpen={false}>
        <span>hidden detail</span>
      </StepShell>,
    )
    expect(screen.queryByText('hidden detail')).toBeNull()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('hidden detail')).toBeInTheDocument()
  })
})
