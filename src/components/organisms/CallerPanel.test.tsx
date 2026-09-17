import { describe, it, expect } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderUI } from '@/test/utils'
import { CallerPanel, type Caller } from '@/components/organisms/CallerPanel'

const caller: Caller = {
  name: 'Jordan Rivera',
  phoneMasked: '+1 (415) •••-4821',
  status: 'returning',
  visitsCount: 4,
  lastVisit: '3 weeks ago',
  preferredStylist: 'Marco',
  usualService: 'Skin fade + beard',
  visits: [{ date: 'Aug 22', service: 'Skin fade', stylist: 'Marco' }],
  note: 'Prefers not to be upsold.',
}

describe('CallerPanel', () => {
  it('is collapsed by default and expands the caller details on click', () => {
    renderUI(<CallerPanel caller={caller} />)
    // Collapsed: name is only in the toggle's accessible label, not shown as text.
    expect(screen.queryByText('Jordan Rivera')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Show caller details/ }))

    expect(screen.getByText('Jordan Rivera')).toBeInTheDocument()
    expect(screen.getByText('+1 (415) •••-4821')).toBeInTheDocument()
    expect(screen.getByText('Marco')).toBeInTheDocument()
    expect(screen.getByText('Prefers not to be upsold.')).toBeInTheDocument()
  })
})
