import { Dialog, Kbd } from '@/components/ui'
import { SHORTCUTS } from '@/hooks/useKeyboardShortcuts'

/** Reference sheet for the operator keyboard shortcuts (opened from the header). */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Keyboard shortcuts"
      description="Work the call without leaving the keyboard."
      className="max-w-lg"
    >
      <ul className="flex flex-col divide-y divide-border">
        {SHORTCUTS.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-4 py-2">
            <span className="text-caption text-text-secondary">
              {s.label}
              {s.when && <span className="ml-1.5 text-micro text-text-muted">· {s.when}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {s.keys.map((k, i) => (
                <span key={k} className="flex items-center gap-1">
                  {i > 0 && <span className="text-micro text-text-muted">or</span>}
                  <Kbd>{k}</Kbd>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
