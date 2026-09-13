import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children and fires onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled and does not fire when disabled', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Save</Button>)
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('disables while loading', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('renders leading and trailing icons alongside the label', () => {
    render(
      <Button leftIcon={<span data-testid="left" />} rightIcon={<span data-testid="right" />}>
        Go
      </Button>,
    )
    expect(screen.getByTestId('left')).toBeInTheDocument()
    expect(screen.getByTestId('right')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })
})
