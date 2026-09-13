import { useState } from 'react'
import { TooltipProvider, ToastProvider } from '@/components/ui'
import { ConsolePage } from '@/pages/ConsolePage'
import { scenarios } from '@/mock/scenarios'

export default function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const [runId, setRunId] = useState(0)

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
