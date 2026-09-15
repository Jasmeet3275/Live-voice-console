import { useState } from 'react'
import { TooltipProvider, ToastProvider } from '@/components/ui'
import { ConsolePage } from '@/pages/ConsolePage'
import { Showcase } from '@/components/domain/Showcase'
import { scenarios } from '@/mock/scenarios'

export default function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const [runId, setRunId] = useState(0)

  const search = typeof window !== 'undefined' ? window.location.search : ''

  // Component library showcase (primitives + domain), handoff skin. Visit /?demo.
  if (search.includes('demo')) {
    return (
      <ToastProvider>
        <TooltipProvider>
          <Showcase />
        </TooltipProvider>
      </ToastProvider>
    )
  }

  const selectScenario = (id: string) => {
    setScenarioId(id)
    setRunId((n) => n + 1)
  }

  return (
    <ToastProvider>
      <TooltipProvider>
        <div className="h-dvh min-h-0 bg-bg-app">
          <ConsolePage
            scenarioId={scenarioId}
            runId={runId}
            onScenario={selectScenario}
            onRestart={() => setRunId((n) => n + 1)}
          />
        </div>
      </TooltipProvider>
    </ToastProvider>
  )
}
