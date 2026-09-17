import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TranscriptLine } from '@/components/molecules/TranscriptLine'
import type { TranscriptWord } from '@/components/atoms/ConfidenceWord'

const words: TranscriptWord[] = [
  { text: 'I', confidence: 0.99 },
  { text: 'need', confidence: 0.99 },
  { text: 'fades', confidence: 0.5, alternatives: ['fades', 'facial'] },
]

describe('TranscriptLine', () => {
  it('renders the speaker name, time, and each word', () => {
    render(<TranscriptLine speaker="caller" words={words} time="0:06" />)
    expect(screen.getByText('Caller')).toBeInTheDocument()
    expect(screen.getByText('0:06')).toBeInTheDocument()
    expect(screen.getByText('need')).toBeInTheDocument()
    expect(screen.getByText('fades')).toBeInTheDocument()
  })

  it('routes an inline correction to onCorrectWord with the word index', () => {
    const onCorrectWord = vi.fn()
    render(<TranscriptLine speaker="caller" words={words} onCorrectWord={onCorrectWord} />)
    fireEvent.click(screen.getByRole('button', { name: /Low confidence word/ }))
    fireEvent.click(screen.getByText('facial'))
    expect(onCorrectWord).toHaveBeenCalledWith(2, 'facial')
  })

  it('uses the AI label for the ai speaker', () => {
    render(<TranscriptLine speaker="ai" words={[{ text: 'Hello', confidence: 0.99 }]} />)
    expect(screen.getByText('Zoca AI')).toBeInTheDocument()
  })
})
