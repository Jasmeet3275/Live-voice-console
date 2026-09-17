import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pressable } from '@/components/atoms/Pressable'

describe('Pressable', () => {
  it('renders a real button defaulting to type="button"', () => {
    render(<Pressable>Row</Pressable>)
    const el = screen.getByRole('button', { name: 'Row' })
    expect(el.tagName).toBe('BUTTON')
    expect(el).toHaveAttribute('type', 'button')
  })

  it('fires onClick and respects disabled', () => {
    const onClick = vi.fn()
    const { rerender } = render(<Pressable onClick={onClick}>Row</Pressable>)
    fireEvent.click(screen.getByText('Row'))
    expect(onClick).toHaveBeenCalledOnce()

    rerender(<Pressable disabled onClick={onClick}>Row</Pressable>)
    fireEvent.click(screen.getByText('Row'))
    expect(onClick).toHaveBeenCalledOnce() // unchanged
  })

  it('renders as the child element with asChild (no type injected)', () => {
    render(
      <Pressable asChild>
        <a href="/x">Link</a>
      </Pressable>,
    )
    const link = screen.getByRole('link', { name: 'Link' })
    expect(link).not.toHaveAttribute('type')
  })
})
