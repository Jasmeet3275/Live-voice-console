import { describe, it, expect, vi } from 'vitest'
import { screen, within, fireEvent } from '@testing-library/react'
import { renderUI } from '@/test/utils'
import { BookingRecordPanel } from './BookingRecordPanel'

describe('BookingRecordPanel', () => {
  it('renders withheld display rows without an editable form', () => {
    renderUI(<BookingRecordPanel fields={{ customer: 'Jordan Rivera' }} confirm="withheld" withheldNote="A field fills only when the AI is certain of it." />)
    expect(screen.getByText('Booking record')).toBeInTheDocument()
    expect(screen.getAllByText('——').length).toBeGreaterThan(0)
    expect(screen.getByText('A field fills only when the AI is certain of it.')).toBeInTheDocument()
    // No edit affordances in display mode.
    expect(screen.queryByRole('button', { name: /Save booking/ })).toBeNull()
  })

  it('confirms an AI-ready draft', () => {
    const onConfirm = vi.fn()
    renderUI(
      <BookingRecordPanel
        confirm="ready"
        deposit="$15"
        onConfirm={onConfirm}
        fields={{ customer: 'Jordan Rivera', service: 'Haircut + Beard trim', stylist: 'Marco Diaz', length: '45 min', time: 'Tue · 6:30 PM', price: '$48 · $15 deposit' }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Confirm · take \$15/ }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('lets the operator edit the record and saves under their name', () => {
    const onSave = vi.fn()
    renderUI(
      <BookingRecordPanel
        editing
        deposit="$15"
        services={['Haircut', 'Beard trim']}
        stylist="Marco Diaz"
        time="Tomorrow · 6:30 PM"
        fields={{ customer: 'Jordan Rivera' }}
        operator="Dana K."
        onSave={onSave}
      />,
    )

    // Seeded from what the AI heard → the AI provenance marker shows.
    expect(screen.getAllByText('AI heard this').length).toBeGreaterThan(0)
    expect(screen.getByText('Yours')).toBeInTheDocument()

    // Length + price are derived from the picked services (Haircut 30 + Beard 15).
    expect(screen.getByText('45 min')).toBeInTheDocument()

    // Save books under the operator, carrying the seeded pickers + deposit.
    fireEvent.click(screen.getByRole('button', { name: /Save booking · take \$15/ }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ services: ['Haircut', 'Beard trim'], stylist: 'Marco Diaz', time: '6:30 PM', deposit: '$15' }),
    )
  })

  it('drops the deposit when the operator picks Skip', () => {
    const onSave = vi.fn()
    renderUI(
      <BookingRecordPanel
        editing
        deposit="$15"
        services={['Haircut']}
        stylist="Marco Diaz"
        time="Tomorrow · 6:30 PM"
        fields={{ customer: 'Jordan Rivera' }}
        onSave={onSave}
      />,
    )
    const deposit = screen.getByText('Deposit').closest('div')!.parentElement!
    fireEvent.click(within(deposit).getByRole('button', { name: 'Skip' }))
    fireEvent.click(screen.getByRole('button', { name: /Save booking/ }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ deposit: undefined }))
  })
})
