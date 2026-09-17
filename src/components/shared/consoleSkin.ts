import { useLayoutEffect } from 'react'

/* The design tokens now live in src/styles/tokens.css (the handoff system is the
 * app's real theme). The demo pages just pin to the light theme so they render
 * consistently regardless of the viewer's OS/stored preference. */
export function useConsoleSkin(): void {
  useLayoutEffect(() => {
    const root = document.documentElement
    const prev = root.getAttribute('data-theme')
    root.setAttribute('data-theme', 'light')
    return () => {
      if (prev) root.setAttribute('data-theme', prev)
      else root.removeAttribute('data-theme')
    }
  }, [])
}
