import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Waveform } from './Waveform'

const data = [0.2, 0.4, 0.6, 0.8]

describe('Waveform', () => {
  it('is a keyboard-operable slider when seekable', () => {
    const onSeek = vi.fn()
    render(<Waveform data={data} progress={0.5} onSeek={onSeek} valueText="1:00 of 2:00" aria-label="Call position" />)
    const slider = screen.getByRole('slider', { name: 'Call position' })
    expect(slider).toHaveAttribute('aria-valuenow', '50')
    expect(slider).toHaveAttribute('aria-valuetext', '1:00 of 2:00')

    fireEvent.keyDown(slider, { key: 'End' })
    expect(onSeek).toHaveBeenLastCalledWith(1)
    fireEvent.keyDown(slider, { key: 'Home' })
    expect(onSeek).toHaveBeenLastCalledWith(0)
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onSeek).toHaveBeenCalledTimes(3)
  })

  it('renders as a non-interactive image when not seekable', () => {
    render(<Waveform data={data} progress={0.5} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
  })
})
