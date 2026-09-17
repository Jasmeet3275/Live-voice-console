import { ChevronsLeft } from 'lucide-react'
import type { Caller } from '@/components/organisms/CallerPanel'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * CustomerRail — the left "customer" bar. Identity, tags, team note,
 * visit history, the inference behind the AI's reading, and the card on
 * file. Matches design_handoff / Screen 1 left rail exactly.
 * ------------------------------------------------------------------ */

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export function CustomerRail({
  caller,
  inference,
  cardOnFile = { label: 'Visa ···· 4242', note: 'Charging needs your confirmation.' },
  onCollapse,
  className,
}: {
  caller: Caller
  /** The evidence behind the AI's preferred reading (kept adjacent to history). */
  inference?: React.ReactNode
  cardOnFile?: { label: string; note: string }
  /** When set, a "Caller" eyebrow + collapse chevron shows at the top (docked rail). */
  onCollapse?: () => void
  className?: string
}) {
  return (
    <aside
      className={cn(
        'flex w-[264px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-surface p-[18px]',
        className,
      )}
    >
      {onCollapse && (
        <div className="-mb-1 flex items-center gap-2">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Caller</span>
          <button
            onClick={onCollapse}
            aria-label="Collapse caller panel"
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ChevronsLeft size={15} />
          </button>
        </div>
      )}

      {/* identity */}
      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[14px] bg-surface-hover text-[15px] font-semibold tracking-[-0.02em] text-text-secondary">
            {initials(caller.name)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold leading-[1.2] tracking-[-0.02em] text-text">{caller.name}</div>
            <div className="mt-0.5 text-[12px] text-text-muted">{caller.phoneMasked}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {typeof caller.visitsCount === 'number' && (
            <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-secondary">{caller.visitsCount} visits</span>
          )}
          <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-text-secondary">0 no-shows</span>
        </div>
      </div>

      {/* team note */}
      {caller.note && (
        <div className="rounded-xl bg-bg-app px-3 py-[11px]">
          <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Team note</div>
          <p className="text-[12.5px] leading-[1.5] text-text-2">{caller.note}</p>
        </div>
      )}

      {/* visits + inference */}
      {caller.visits && caller.visits.length > 0 && (
        <div>
          <div className="mb-2.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Visits</div>
          <div className="flex flex-col gap-2.5">
            {caller.visits.map((v, i) => (
              <div key={i} className="flex gap-2.5">
                <span className="w-0.5 shrink-0 rounded-full bg-border-strong" />
                <div>
                  <div className="text-[12.5px] font-semibold text-text">{v.service}</div>
                  <div className="mt-0.5 text-[11.5px] text-text-muted">{v.date} · {v.stylist}</div>
                </div>
              </div>
            ))}
          </div>
          {inference && (
            <div className="mt-2.5 rounded-[10px] bg-bg-app px-[11px] py-2.5 text-[11.5px] leading-[1.45] text-text-secondary">
              {inference}
            </div>
          )}
        </div>
      )}

      {/* card on file */}
      <div className="mt-auto rounded-xl bg-bg-app px-3 py-2.5">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="h-[11px] w-[11px] rounded-[3px] border-[1.5px] border-text-muted" />
          <span className="text-[11.5px] font-semibold text-text-secondary">{cardOnFile.label}</span>
        </div>
        <p className="text-[11.5px] leading-[1.45] text-text-muted">{cardOnFile.note}</p>
      </div>
    </aside>
  )
}
