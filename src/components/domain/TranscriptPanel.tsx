import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * TranscriptPanel — the chat container. Header (label · review flag ·
 * avg confidence) over a scrolling thread body. Matches design_handoff
 * / Screen 1 centre column.
 * ------------------------------------------------------------------ */

export function TranscriptPanel({
  review = 'none',
  confidence,
  children,
  className,
}: {
  /** Review flag in the header. */
  review?: 'none' | 'held' | 'resolved'
  /** Average confidence, e.g. "91%". */
  confidence?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <main className={cn('flex min-w-0 flex-1 flex-col bg-bg-app', className)}>
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border px-5">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-text-muted">Transcript</span>
        {review === 'held' && (
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-warning-solid" /><span className="text-[11.5px] text-warning">1 word needs review</span></span>
        )}
        {review === 'resolved' && (
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[2px] bg-accent" /><span className="text-[11.5px] text-success">corrected by you</span></span>
        )}
        {confidence && <span className="ml-auto text-[11.5px] text-text-muted">Avg confidence <b className="text-text">{confidence}</b></span>}
      </div>
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-[18px]">
        {children}
      </div>
    </main>
  )
}
