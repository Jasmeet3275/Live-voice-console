import { Play, Pause, Mic, MicOff, Volume2, VolumeX, RotateCcw, Hand, PhoneOff, Bot } from 'lucide-react'
import { Tooltip } from '@/components/ui'
import { WaveformTrack } from '@/components/domain/WaveformTrack'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ *
 * Transport — the bottom call bar. Row 1: play · clock · trailing
 * waveform (per-speaker colour) · window label. Row 2: mute · speaker ·
 * replay · stall, then Take over (with its shortcut chip) · End call.
 * Matches design_handoff / Screen 1 transport.
 * ------------------------------------------------------------------ */

function DockButton({ label, onClick, active, tone = 'default', disabled, children }: {
  label: string; onClick?: () => void; active?: boolean; tone?: 'default' | 'danger'; disabled?: boolean; children: React.ReactNode
}) {
  return (
    <Tooltip content={label}>
      <button
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'flex h-[38px] w-[38px] items-center justify-center rounded-[11px] border transition-colors active:translate-y-px',
          tone === 'danger'
            ? 'border-error bg-error text-white'
            : active
              ? 'border-text bg-text text-text-inverse'
              : 'border-border bg-surface-2 text-text-2 hover:bg-surface-hover',
        )}
      >
        {children}
      </button>
    </Tooltip>
  )
}

export function Transport({
  playing = false,
  onTogglePlay,
  progress = 1,
  onSeek,
  clock = '0:38',
  windowLabel = 'last 24s',
  muted = false,
  onMute,
  speakerOn = true,
  onSpeaker,
  onReplay,
  onStall,
  inControl = false,
  onTakeOver,
  onRelease,
  onEnd,
  flagPct,
  disabled = false,
  className,
}: {
  playing?: boolean
  onTogglePlay?: () => void
  progress?: number
  onSeek?: (fraction: number) => void
  clock?: string
  windowLabel?: string
  muted?: boolean
  onMute?: () => void
  speakerOn?: boolean
  onSpeaker?: () => void
  onReplay?: () => void
  onStall?: () => void
  inControl?: boolean
  onTakeOver?: () => void
  onRelease?: () => void
  onEnd?: () => void
  /** Optional low-confidence marker over the flagged span, e.g. "38%". */
  flagPct?: string
  /** Before the call has started, the whole bar is inert. */
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      aria-disabled={disabled || undefined}
      className={cn('border-t border-border bg-surface px-5 py-3', disabled && 'pointer-events-none opacity-60', className)}
    >
      {/* single row — left controls · waveform · right actions */}
      <div className="flex items-center gap-3">
        <button
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={onTogglePlay}
          disabled={disabled}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-text text-text-inverse"
        >
          {playing ? <Pause size={13} className="fill-current" /> : <Play size={13} className="ml-0.5 fill-current" />}
        </button>
        {/* clock hides on mobile — the header already shows the elapsed time there */}
        <span className="tabular hidden w-[34px] shrink-0 text-[12.5px] font-bold tracking-[-0.02em] text-text sm:inline-block">{clock}</span>

        <div className="flex shrink-0 items-center gap-2">
          <DockButton label={muted ? 'Unmute · M' : 'Mute · M'} active={muted} onClick={onMute} disabled={disabled}>
            {muted ? <MicOff size={17} /> : <Mic size={17} />}
          </DockButton>
          {/* secondary controls fold away on mobile (Screen 3 mobile action bar) */}
          <div className="hidden items-center gap-2 sm:flex">
            <DockButton label={speakerOn ? 'Speaker off · S' : 'Speaker on · S'} active={speakerOn} onClick={onSpeaker} disabled={disabled}>
              {speakerOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </DockButton>
            <DockButton label="Replay last 5s · R" onClick={onReplay} disabled={disabled}><RotateCcw size={16} /></DockButton>
            <DockButton label="Stall the caller" onClick={onStall} disabled={disabled}><Hand size={16} /></DockButton>
          </div>
        </div>

        {/* waveform sits between the control groups on desktop; hidden on mobile */}
        <WaveformTrack
          className="hidden min-w-0 flex-1 sm:flex"
          progress={progress}
          onSeek={onSeek}
          flags={flagPct ? [{ pos: 0.67, label: flagPct }] : []}
        />
        <span className="hidden shrink-0 text-[11.5px] text-text-muted sm:inline">{windowLabel}</span>

        {/* on mobile this group grows to fill (Take over spans), fixed on desktop */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 sm:flex-none">
          {inControl ? (
            <button
              onClick={onRelease}
              disabled={disabled}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-text px-[17px] py-[11px] text-[14px] font-semibold text-text-inverse transition-transform duration-150 hover:-translate-y-0.5 sm:flex-none"
            >
              <Bot size={15} /> Hand back to AI
            </button>
          ) : (
            <Tooltip content="Mutes the AI. It keeps transcribing and drafting; nothing is sent or charged without you.">
              <button
                onClick={onTakeOver}
                disabled={disabled}
                aria-label="Take over"
                className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-accent px-[19px] py-[11px] text-accent-fg shadow-[0_6px_16px_-9px_rgba(31,125,110,0.75),inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-transform duration-150 hover:-translate-y-0.5 sm:flex-none"
              >
                <span className="h-[13px] w-[13px] rounded-[4px] bg-white/90" />
                <span className="text-[14px] font-semibold tracking-[-0.01em]">Take over</span>
                <span className="hidden rounded-[5px] bg-black/25 px-1.5 py-0.5 text-[10px] font-bold sm:inline-block">⌘⇧T</span>
              </button>
            </Tooltip>
          )}
          <button
            onClick={onEnd}
            disabled={disabled}
            aria-label="End call"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-error px-[17px] py-[11px] text-[13.5px] font-semibold text-white shadow-[0_6px_16px_-9px_rgba(192,57,43,0.7)] transition-transform duration-150 hover:-translate-y-0.5"
          >
            <PhoneOff size={14} /> <span className="hidden sm:inline">End call</span>
          </button>
        </div>
      </div>
    </div>
  )
}
