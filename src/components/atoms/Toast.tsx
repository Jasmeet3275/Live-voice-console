import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Toast as RadixToast } from 'radix-ui'
import { Check, Info, TriangleAlert, OctagonX, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastTone = 'info' | 'success' | 'warning' | 'error'
interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

const toneConfig: Record<ToastTone, { cls: string; Icon: typeof Check }> = {
  info: { cls: 'text-info', Icon: Info },
  success: { cls: 'text-success', Icon: Check },
  warning: { cls: 'text-warning', Icon: TriangleAlert },
  error: { cls: 'text-error', Icon: OctagonX },
}

interface ToastContextValue {
  toast: (t: Omit<ToastItem, 'id'> | string) => void
}
const ToastContext = createContext<ToastContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((t: Omit<ToastItem, 'id'> | string) => {
    const item: ToastItem =
      typeof t === 'string'
        ? { id: Date.now() + Math.random(), title: t, tone: 'info' }
        : { id: Date.now() + Math.random(), ...t }
    setItems((prev) => [...prev, item])
  }, [])

  const remove = useCallback(
    (id: number) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider swipeDirection="right" duration={4000}>
        {children}
        {items.map(({ id, title, description, tone }) => {
          const { cls, Icon } = toneConfig[tone]
          return (
            <RadixToast.Root
              key={id}
              onOpenChange={(open) => !open && remove(id)}
              className="animate-toast rounded-lg border border-border bg-surface p-3 shadow-e3"
            >
              <div className="flex items-start gap-3">
                <Icon size={18} className={cn('mt-0.5 shrink-0', cls)} />
                <div className="min-w-0 flex-1">
                  <RadixToast.Title className="text-body-strong font-medium text-text">
                    {title}
                  </RadixToast.Title>
                  {description && (
                    <RadixToast.Description className="mt-0.5 text-caption text-text-muted">
                      {description}
                    </RadixToast.Description>
                  )}
                </div>
                <RadixToast.Close
                  aria-label="Dismiss"
                  className="rounded p-0.5 text-text-muted hover:text-text"
                >
                  <X size={15} />
                </RadixToast.Close>
              </div>
            </RadixToast.Root>
          )
        })}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
