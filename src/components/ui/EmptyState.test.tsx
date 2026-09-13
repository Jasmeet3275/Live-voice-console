import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { Kbd } from './Kbd'

describe('EmptyState', () => {
  it('renders title, description and an action slot', () => {
    render(
      <EmptyState
        title="Press Start to begin the call"
        description="The conversation appears here."
        action={<span>Press <Kbd>Space</Kbd></span>}
      />,
    )
    expect(screen.getByText('Press Start to begin the call')).toBeInTheDocument()
    expect(screen.getByText('The conversation appears here.')).toBeInTheDocument()
    expect(screen.getByText('Space')).toBeInTheDocument()
  })
})

describe('Kbd', () => {
  it('renders a keycap element', () => {
    render(<Kbd>?</Kbd>)
    const el = screen.getByText('?')
    expect(el.tagName).toBe('KBD')
  })
})
