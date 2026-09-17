import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CallSummary } from './CallSummary'

describe('CallSummary', () => {
  it('renders the booking recap with status, details and notes', () => {
    render(
      <CallSummary
        customer="Jordan Rivera"
        services={['Haircut', 'Beard trim']}
        stylist="Marco"
        when="Tomorrow · 6:30 PM"
        duration="45 min"
        price="$48"
        deposit={{ amount: 15, status: 'collected' }}
        status="confirmed"
        notes={['Confirmed "fades"']}
      />,
    )
    expect(screen.getByText('Call summary')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()
    expect(screen.getByText('Haircut + Beard trim')).toBeInTheDocument()
    expect(screen.getByText('Marco')).toBeInTheDocument()
    expect(screen.getByText('Tomorrow · 6:30 PM')).toBeInTheDocument()
    expect(screen.getByText('Confirmed "fades"')).toBeInTheDocument()
    expect(screen.getByText(/\$15 collected/)).toBeInTheDocument()
  })

  it('shows a "Not booked" status for a failed call', () => {
    render(
      <CallSummary customer="X" services={['Haircut']} stylist="—" when="—" duration="45 min" price="—" status="failed" />,
    )
    expect(screen.getByText('Not booked')).toBeInTheDocument()
  })
})
