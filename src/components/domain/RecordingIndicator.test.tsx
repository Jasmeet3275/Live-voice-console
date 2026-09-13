import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderUI } from '@/test/utils'
import { RecordingIndicator } from './RecordingIndicator'

describe('RecordingIndicator', () => {
  it('shows a recording + encrypted badge when recording', () => {
    renderUI(<RecordingIndicator recording />)
    expect(screen.getByText('REC')).toBeInTheDocument()
    expect(screen.getByLabelText(/recorded and encrypted/i)).toBeInTheDocument()
  })

  it('renders nothing when not recording', () => {
    renderUI(<RecordingIndicator recording={false} />)
    expect(screen.queryByText('REC')).toBeNull()
  })
})
