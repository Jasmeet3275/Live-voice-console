import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui'

function Providers({ children }: { children: ReactNode }) {
  // Radix Tooltip triggers require a provider; many domain components use it.
  return <TooltipProvider>{children}</TooltipProvider>
}

/** render() wrapped in the app-level providers components expect. */
export function renderUI(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options })
}

export * from '@testing-library/react'
