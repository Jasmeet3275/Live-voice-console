import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShortcutsDialog } from './ShortcutsDialog'

describe('ShortcutsDialog', () => {
  it('lists the operator shortcuts when open', () => {
    render(<ShortcutsDialog open onOpenChange={() => {}} />)
    expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Play / pause the call')).toBeInTheDocument()
    expect(screen.getByText('Take over the call')).toBeInTheDocument()
    expect(screen.getByText('End the call')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    render(<ShortcutsDialog open={false} onOpenChange={() => {}} />)
    expect(screen.queryByText('Play / pause the call')).toBeNull()
  })
})
