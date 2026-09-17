import { Bot } from 'lucide-react'
import { cn } from '@/lib/cn'

/* Small transcript-thread molecules that go between bubbles. */

/** A labelled rule between thread items — "Call ended …" (neutral) or
 *  "Line lost …" (amber, for a dropped call). */
export function ThreadDivider({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'amber' }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('h-px flex-1', tone === 'amber' ? 'bg-warning-border' : 'bg-border')} />
      <span className={cn('text-[11px] font-semibold tracking-[0.06em]', tone === 'amber' ? 'text-warning' : 'text-text-muted')}>{label}</span>
      <span className={cn('h-px flex-1', tone === 'amber' ? 'bg-warning-border' : 'bg-border')} />
    </div>
  )
}

/** Misheard word — struck in ink/4 (never amber; amber belongs to the action). */
export function StruckWord({ children }: { children: React.ReactNode }) {
  return <span className="text-text-muted line-through">{children}</span>
}

/** A corrected word — teal, with a one-shot flash highlight. */
export function HighlightWord({ children }: { children: React.ReactNode }) {
  return (
    <span className="animate-[fade-in_1.2s_ease] rounded-[4px] px-1 font-semibold text-success" style={{ background: 'var(--accent-subtle)' }}>
      {children}
    </span>
  )
}

/** Shown in the thread while the operator holds the line — the AI is muted. */
export function TakeOverBar({ onHandBack, className }: { onHandBack?: () => void; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 rounded-[13px] border-[1.5px] border-text bg-surface px-3 py-2.5', className)}>
      <span className="flex-1 text-[13.5px] text-text-muted">Speak to Jordan — the AI is listening but silent</span>
      <button
        onClick={onHandBack}
        className="flex items-center gap-1.5 rounded-[9px] bg-text px-3 py-2 text-[12.5px] font-semibold text-text-inverse transition-transform duration-150 active:translate-y-px"
      >
        <Bot size={14} /> Hand back to AI
      </button>
    </div>
  )
}

/** The one-row thread notice shared by every "the line changed hands / stopped"
 *  state: rail · dot · title with who and when · one sentence of consequence · one
 *  action. Ink for a call that stopped with work unfinished, teal for one that
 *  finished. Never amber — amber is only for a decision still waiting.
 *  Matches design_handoff "Notice · …" family. */
export function ThreadNotice({
  tone = 'ink',
  dividerLabel,
  title,
  who,
  meta,
  description,
  pulse = false,
  action,
  className,
}: {
  tone?: 'ink' | 'teal'
  dividerLabel: string
  title: string
  /** Secondary identity/context beside the title, e.g. "Dana K. · desk 2". */
  who?: string
  /** Right-aligned status, e.g. "slot released" / "slot held 3:12". */
  meta?: string
  description: string
  /** Pulse the dot — only the live "operator holding the line" state. */
  pulse?: boolean
  action?: { label: string; onClick?: () => void }
  className?: string
}) {
  const teal = tone === 'teal'
  return (
    <div className={className}>
      {/* divider — teal hairlines for a finished call, neutral for a stopped one */}
      <div className="mb-3 flex items-center gap-3">
        <span className={cn('h-px flex-1', teal ? 'bg-accent-border' : 'bg-border')} />
        <span className={cn('shrink-0 text-[11px] font-semibold tracking-[0.06em]', teal ? 'text-success' : 'text-text-secondary')}>{dividerLabel}</span>
        <span className={cn('h-px flex-1', teal ? 'bg-accent-border' : 'bg-border')} />
      </div>
      <div className={cn(
        'flex items-start gap-3 rounded-[12px] border border-l-[3px] px-[15px] py-3 animate-rise',
        teal ? 'border-accent-border border-l-accent bg-accent-subtle' : 'border-border border-l-text bg-surface-2',
      )}>
        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', teal ? 'bg-accent' : 'bg-text', pulse && 'animate-breathe')} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-baseline gap-2.5">
            <span className={cn('text-[13.5px] font-semibold', teal ? 'text-success' : 'text-text')}>{title}</span>
            {who && <span className={cn('text-[11.5px]', teal ? 'text-success' : 'text-text-muted')}>{who}</span>}
            {meta && <span className={cn('ml-0 sm:ml-auto text-[11.5px]', teal ? 'text-success' : 'text-text-muted')}>{meta}</span>}
          </div>
          <p className={cn('text-[12.5px] leading-[1.5]', teal ? 'text-success' : 'text-text-secondary')}>{description}</p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'shrink-0 rounded-[9px] border bg-surface px-3 py-1.5 text-[12px] font-semibold transition-colors',
              teal ? 'border-accent-border text-success hover:border-accent' : 'border-border-strong text-text hover:bg-surface-2',
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

/** Inline notice shown for the whole time the operator holds the line — the live
 *  variant of ThreadNotice (pulsing dot + "speaking" timer). */
export function OperatorNotice({
  operator = 'Dana K. · desk 2',
  speaking,
  onHandBack,
}: {
  operator?: string
  /** e.g. "0:18" — how long the operator has held the line. */
  speaking?: string
  onHandBack?: () => void
}) {
  return (
    <ThreadNotice
      tone="ink"
      pulse
      dividerLabel="Operator on the line"
      title="You took over the call"
      who={operator}
      meta={speaking ? `speaking ${speaking}` : undefined}
      description="The AI is muted to the caller and still transcribing. Nothing will be offered, saved or charged until you hand back."
      action={{ label: 'Hand back to AI', onClick: onHandBack }}
    />
  )
}

/** The AI's "thinking / stalling" line — pinned to the bottom of the thread. */
export function AiThinkingBubble({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="h-[26px] w-[26px] shrink-0 rounded-[9px] bg-accent" />
      <div className="flex items-center gap-2.5 rounded-[4px_13px_13px_13px] border border-dashed border-border-strong bg-surface px-3.5 py-2.5">
        <span className="flex gap-1">
          {[0, 0.2, 0.4].map((d) => (
            <span key={d} className="h-[5px] w-[5px] animate-breathe rounded-full bg-text-muted/70" style={{ animationDelay: `${d}s` }} />
          ))}
        </span>
        <span className="text-[12.5px] text-text-muted">{label}</span>
      </div>
    </div>
  )
}

/** A collapsed "AI resolved N on its own" row — severity-1, no rail presence. */
export function ResolvedInlineRow({
  count,
  summary,
  onShow,
  className,
}: {
  count: number
  summary: string
  onShow?: () => void
  className?: string
}) {
  return (
    <div className={cn('ml-[37px] flex items-center gap-2.5 rounded-[10px] bg-surface-2 px-3 py-2', className)}>
      <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-border-strong" />
      <span className="shrink-0 text-[11.5px] font-semibold text-text-secondary">AI resolved {count} on its own</span>
      <span className="min-w-0 flex-1 truncate text-[11.5px] text-text-muted">{summary}</span>
      <button onClick={onShow} className="shrink-0 text-[11px] text-text-muted hover:text-text">show</button>
    </div>
  )
}
