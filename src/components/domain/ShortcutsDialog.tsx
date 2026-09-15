import { X } from 'lucide-react'
import { Modal, IconButton } from '@/components/ui'
import { SHORTCUT_GROUPS, type Shortcut } from '@/hooks/useKeyboardShortcuts'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * ShortcutsDialog — the operator keyboard reference, grouped by what
 * each key acts on. Two columns (the call · screen) over a banded group
 * for the three keys that change who's talking (ink keycaps on sand).
 * Matches design_handoff "Keyboard shortcuts dialog · 1A".
 * ------------------------------------------------------------------ */

/** One key rendered as a keycap: Space/Esc as a pill, everything else a square;
 *  ink (filled) for the risky band, sand otherwise. */
function Keycap({ label, ink }: { label: string; ink?: boolean }) {
  const wide = label.length > 1 // "Space" / "Esc"
  return (
    <span
      className={cn(
        'flex h-6 items-center justify-center rounded-[7px] text-[11.5px] font-semibold',
        wide ? 'px-2' : 'w-6',
        ink ? 'bg-text text-text-inverse' : 'border border-border-strong bg-surface-2 text-text-secondary',
      )}
    >
      {label}
    </span>
  )
}

function Row({ row, ink, last }: { row: Shortcut; ink?: boolean; last?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 py-[9px]', !ink && !last && 'border-b border-border')}>
      <span className={cn('min-w-0 flex-1 text-[13px] text-text', ink ? 'font-semibold' : 'font-medium')}>
        {row.label}
        {row.when && <span className="ml-1 text-[11.5px] font-normal text-text-muted">· {row.when}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {row.keys.map((k, i) => (
          <span key={k} className="flex items-center gap-1.5">
            {i > 0 && row.alt && <span className="text-[11px] text-text-muted">or</span>}
            <Keycap label={k} ink={ink} />
          </span>
        ))}
      </span>
    </div>
  )
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-text-muted">{children}</div>
}

/** Reference sheet for the operator keyboard shortcuts (opened from the header). */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const columns = SHORTCUT_GROUPS.filter((g) => !g.band)
  const band = SHORTCUT_GROUPS.find((g) => g.band)

  return (
    <Modal open={open} onOpenChange={onOpenChange} label="Keyboard shortcuts" className="max-w-[640px] overflow-hidden">
      {/* header */}
      <div className="flex items-start gap-4 border-b border-border px-6 py-5">
        <div className="min-w-0 flex-1">
          <Modal.Title className="text-[17px] font-semibold tracking-[-0.02em] text-text">Keyboard shortcuts</Modal.Title>
          <p className="mt-0.5 text-[12.5px] text-text-muted">Work the call without leaving the keyboard.</p>
        </div>
        <Modal.Close asChild>
          <IconButton aria-label="Close dialog" size="sm" variant="ghost" icon={<X size={18} />} />
        </Modal.Close>
      </div>

      {/* two columns — the call · screen */}
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {columns.map((g, i) => (
          <div key={g.title} className={cn('px-6 py-4', i === 0 && 'border-b border-border sm:border-b-0 sm:border-r')}>
            <GroupTitle>{g.title}</GroupTitle>
            <div className="flex flex-col">
              {g.rows.map((row, ri) => (
                <Row key={row.label} row={row} last={ri === g.rows.length - 1} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* band — the keys that change who is talking */}
      {band && (
        <div className="border-t border-border bg-surface-2 px-6 py-4">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-[7px] w-[7px] rounded-full bg-error" />
            <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-waiting">{band.title}</span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {band.rows.map((row) => (
              <Row key={row.label} row={row} ink />
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
