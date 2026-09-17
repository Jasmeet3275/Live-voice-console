import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfidenceMeter } from '@/components/molecules/ConfidenceMeter'

describe('ConfidenceMeter', () => {
  it('renders as a meter with the percentage and label', () => {
    render(<ConfidenceMeter value={0.61} label="“fades”" />)
    const meter = screen.getByRole('meter')
    expect(meter).toHaveAttribute('aria-valuenow', '61')
    expect(screen.getByText('61%')).toBeInTheDocument()
    expect(screen.getByText('“fades”')).toBeInTheDocument()
    expect(meter.getAttribute('aria-label')).toMatch(/Low, 61%/)
  })

  it('clamps out-of-range values', () => {
    render(<ConfidenceMeter value={1.5} />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100')
  })

  it('labels high confidence appropriately', () => {
    render(<ConfidenceMeter value={0.95} />)
    expect(screen.getByRole('meter').getAttribute('aria-label')).toMatch(/High/)
  })
})
