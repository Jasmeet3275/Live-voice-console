import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CallProvider } from './CallProvider'
import { useCall } from '@/hooks/useCall'
import { useClock } from '@/hooks/useClock'
import { MockTransport } from '@/mock/mockTransport'

function Probe() {
  const call = useCall()
  const clock = useClock()
  return (
    <>
      <span data-testid="connected">{String(call.connected)}</span>
      <span data-testid="playing">{String(clock.playing)}</span>
      <span data-testid="hasDuration">{String(clock.duration > 0)}</span>
      <span data-testid="feed">{call.feed.length}</span>
    </>
  )
}

describe('CallProvider + useCall/useClock', () => {
  it('provides the store and clock to consumers with initial state', () => {
    render(
      <CallProvider transport={new MockTransport('happy')}>
        <Probe />
      </CallProvider>,
    )
    expect(screen.getByTestId('connected')).toHaveTextContent('false')
    expect(screen.getByTestId('playing')).toHaveTextContent('false')
    expect(screen.getByTestId('hasDuration')).toHaveTextContent('true')
    expect(screen.getByTestId('feed')).toHaveTextContent('0')
  })

  it('throws if useCall is used outside a provider', () => {
    const Bad = () => {
      useCall()
      return null
    }
    // Silence the expected React error boundary noise.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Bad />)).toThrow(/useCall must be used within/)
    spy.mockRestore()
  })
})
