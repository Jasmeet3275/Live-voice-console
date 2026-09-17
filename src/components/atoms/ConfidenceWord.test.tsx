import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfidenceWord } from './ConfidenceWord'

describe('ConfidenceWord', () => {
  it('renders a high-confidence word as plain text (no button)', () => {
    render(<ConfidenceWord word={{ text: 'haircut', confidence: 0.99 }} />)
    expect(screen.getByText('haircut')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders a corrected word as reviewed text', () => {
    render(<ConfidenceWord word={{ text: 'fades', confidence: 0.61, corrected: true }} />)
    const el = screen.getByText('fades')
    expect(el).toHaveAttribute('title', expect.stringMatching(/Corrected/))
  })

  it('flags a low-confidence word read-only without a popover trigger', () => {
    render(<ConfidenceWord readOnly word={{ text: 'fades', confidence: 0.5, alternatives: ['fades', 'facial'] }} />)
    expect(screen.getByText('fades')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('low-confidence interactive: opens alternatives and corrects on select', () => {
    const onCorrect = vi.fn()
    render(<ConfidenceWord word={{ text: 'fades', confidence: 0.5, alternatives: ['fades', 'facial'] }} onCorrect={onCorrect} />)
    fireEvent.click(screen.getByRole('button', { name: /Low confidence word/ }))
    fireEvent.click(screen.getByText('facial'))
    expect(onCorrect).toHaveBeenCalledWith('facial')
  })
})
