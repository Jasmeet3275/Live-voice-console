import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

// --- jsdom polyfills the app / Radix / Waveform rely on ---
// Plain functions (not vi.fn) so `restoreMocks` doesn't reset them between tests.

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    },
  })) as typeof window.matchMedia
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

// jsdom doesn't implement layout / pointer capture that Radix + the waveform touch.
Element.prototype.scrollIntoView = function scrollIntoView() {}
Element.prototype.hasPointerCapture = function hasPointerCapture() {
  return false
}
Element.prototype.setPointerCapture = function setPointerCapture() {}
Element.prototype.releasePointerCapture = function releasePointerCapture() {}
// Deterministic rect so waveform seek math is stable.
Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return { x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 40, width: 200, height: 40, toJSON: () => ({}) } as DOMRect
}
