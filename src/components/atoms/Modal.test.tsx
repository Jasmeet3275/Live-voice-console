import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/atoms/Modal'

function Fixture(props: Partial<React.ComponentProps<typeof Modal>> & { open: boolean }) {
  return (
    <Modal {...props}>
      <Modal.Title>Title</Modal.Title>
      <button>plain</button>
      <button data-autofocus>primary</button>
    </Modal>
  )
}

describe('Modal', () => {
  it('renders nothing when closed and content when open', () => {
    const { rerender } = render(<Fixture open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(<Fixture open />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('focuses the [data-autofocus] element on open', () => {
    render(<Fixture open />)
    expect(screen.getByRole('button', { name: 'primary' })).toHaveFocus()
  })

  it('when not dismissable, Escape is intercepted (onEscapeKeyDown fires)', () => {
    const onEscapeKeyDown = vi.fn()
    render(<Fixture open dismissable={false} onEscapeKeyDown={onEscapeKeyDown} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onEscapeKeyDown).toHaveBeenCalled()
    // still open (a required checkpoint can't be dismissed to nothing)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
