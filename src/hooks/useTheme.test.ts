import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme, getInitialTheme, applyTheme } from './useTheme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

describe('useTheme', () => {
  it('toggles the theme and applies it to <html> + localStorage', () => {
    const { result } = renderHook(() => useTheme())
    const initial = result.current.theme

    act(() => result.current.toggle())
    const next = result.current.theme
    expect(next).not.toBe(initial)
    expect(document.documentElement.getAttribute('data-theme')).toBe(next)
    expect(localStorage.getItem('zoca-theme')).toBe(next)
  })

  it('set() applies a specific theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.set('dark'))
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('getInitialTheme reads a stored preference', () => {
    localStorage.setItem('zoca-theme', 'dark')
    expect(getInitialTheme()).toBe('dark')
  })

  it('applyTheme sets the attribute', () => {
    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
