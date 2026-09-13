import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TakeOverWizard } from './TakeOverWizard'

describe('TakeOverWizard', () => {
  it('renders nothing while closed', () => {
    render(<TakeOverWizard open={false} onClose={() => {}} onBook={() => {}} />)
    expect(screen.queryByText('Book appointment')).toBeNull()
  })

  it('walks the stepper and books the appointment', () => {
    const onBook = vi.fn()
    const onClose = vi.fn()
    render(<TakeOverWizard open onClose={onClose} onBook={onBook} />)

    // Step 1 — Services (preselected) → advance.
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 2 — Stylist: Next disabled until one is chosen.
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    fireEvent.click(screen.getByText('Marco Diaz'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 3 — Time.
    fireEvent.click(screen.getByText('6:30'))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // Step 4 — Review → confirm.
    fireEvent.click(screen.getByRole('button', { name: /Confirm/ }))

    expect(onBook).toHaveBeenCalledWith(
      expect.objectContaining({
        services: ['Haircut', 'Beard trim'],
        stylist: 'Marco Diaz',
        time: '6:30 PM',
        deposit: '$15',
      }),
    )
    expect(onClose).toHaveBeenCalled()
  })
})
