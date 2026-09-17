import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SlotCard, type Slot } from './SlotCard'

const slot: Slot = {
  id: 's1',
  time: 'Tomorrow · 6:30 PM',
  stylist: 'Marco Diaz',
  stylistRating: 4.9,
  duration: '45 min',
  price: '$48',
  services: ['Haircut', 'Beard trim'],
  reasons: ['Top fade specialist', 'Fits both services'],
  recommended: true,
}

describe('SlotCard', () => {
  it('shows time, stylist, price and the "why this fits" reasons', () => {
    render(<SlotCard slot={slot} />)
    expect(screen.getByText('Tomorrow · 6:30 PM')).toBeInTheDocument()
    expect(screen.getByText('Marco Diaz')).toBeInTheDocument()
    expect(screen.getByText('$48')).toBeInTheDocument()
    expect(screen.getByText('Top fade specialist')).toBeInTheDocument()
    expect(screen.getByText('Best fit')).toBeInTheDocument()
  })

  it('calls onSelect when interactive', () => {
    const onSelect = vi.fn()
    render(<SlotCard slot={slot} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('radio'))
    expect(onSelect).toHaveBeenCalledWith('s1')
  })

  it('reflects the selected state via aria-checked', () => {
    const { rerender } = render(<SlotCard slot={slot} selected={false} onSelect={() => {}} />)
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'false')
    rerender(<SlotCard slot={slot} selected onSelect={() => {}} />)
    expect(screen.getByRole('radio')).toHaveAttribute('aria-checked', 'true')
  })

  it('is disabled and marked "just taken" when unavailable', () => {
    const onSelect = vi.fn()
    render(<SlotCard slot={{ ...slot, unavailable: true }} onSelect={onSelect} />)
    expect(screen.getByText('just taken')).toBeInTheDocument()
    const el = screen.getByRole('radio')
    expect(el).toBeDisabled()
    fireEvent.click(el)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
