import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderUI } from '@/test/utils'
import { MiniSpeaker } from './MiniSpeaker'

describe('MiniSpeaker', () => {
  it('labels the speaker and its speaking state', () => {
    renderUI(<MiniSpeaker role="ai" name="Zoca AI" speaking />)
    expect(screen.getByLabelText('Zoca AI, speaking')).toBeInTheDocument()
  })

  it('shows the muted state in its label', () => {
    renderUI(<MiniSpeaker role="operator" name="You (Operator)" muted />)
    expect(screen.getByLabelText('You (Operator), muted')).toBeInTheDocument()
  })
})
