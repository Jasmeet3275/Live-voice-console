import { describe, it, expect } from 'vitest'
import { generateWaveform, sampleLevel, formatTime } from './audio'

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(6)).toBe('0:06')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(600)).toBe('10:00')
  })
  it('clamps negatives to 0:00', () => {
    expect(formatTime(-5)).toBe('0:00')
  })
})

describe('generateWaveform', () => {
  it('returns the requested number of bars, all within [0.06, 1]', () => {
    const bars = generateWaveform(50, 7)
    expect(bars).toHaveLength(50)
    for (const v of bars) {
      expect(v).toBeGreaterThanOrEqual(0.06)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
  it('is deterministic for a given seed', () => {
    expect(generateWaveform(20, 3)).toEqual(generateWaveform(20, 3))
    expect(generateWaveform(20, 3)).not.toEqual(generateWaveform(20, 4))
  })
})

describe('sampleLevel', () => {
  const data = [0.1, 0.5, 0.9]
  it('samples by normalized position', () => {
    expect(sampleLevel(data, 0)).toBe(0.1)
    expect(sampleLevel(data, 0.99)).toBe(0.9)
  })
  it('clamps out-of-range positions and handles empty input', () => {
    expect(sampleLevel(data, 5)).toBe(0.9)
    expect(sampleLevel(data, -1)).toBe(0.1)
    expect(sampleLevel([], 0.5)).toBe(0)
  })
})
