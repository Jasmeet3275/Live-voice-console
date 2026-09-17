import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusChip } from '@/components/atoms/StatusChip'

describe('StatusChip', () => {
  it('shows the default label per status', () => {
    render(<StatusChip status="success" />)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('shows the "needs you" waiting state', () => {
    render(<StatusChip status="waiting" />)
    expect(screen.getByText('Needs you')).toBeInTheDocument()
  })

  it('accepts a custom label', () => {
    render(<StatusChip status="warning" label="Review" />)
    expect(screen.getByText('Review')).toBeInTheDocument()
  })

  it('conveys status with a text label (not colour alone)', () => {
    // Every status renders human-readable text, so it is not colour-only.
    const { rerender } = render(<StatusChip status="error" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    rerender(<StatusChip status="running" />)
    expect(screen.getByText('Running')).toBeInTheDocument()
  })
})
