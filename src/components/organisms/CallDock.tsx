import { forwardRef, useMemo, type ReactNode } from 'react'
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Headset, Bot, CalendarPlus } from 'lucide-react'
import { Button, Tooltip, Pressable } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { generateWaveform, formatTime } from '@/lib/audio'
import { Waveform } from '@/components/organisms/Waveform'
import { MiniSpeaker } from '@/components/atoms/MiniSpeaker'

export interface CallDockProps {
  progress: number // 0–1 from the shared clock
  currentTime: number // ms
  duration: number // ms
  onSeek: (fraction: number) => void
  muted: boolean
  onMuteChange: (muted: boolean) => void
  speakerOn: boolean
  onSpeakerChange: (on: boolean) => void
  inControl: boolean
  onTakeOver: () => void
  onRelease: () => void
  onEndCall: () => void
  onBook?: () => void
  // Speaker indicators (who's talking)
  callerName: string
  callerSpeaking: boolean
  agentSpeaking: boolean
  level: number
  /** Before the call has started, every control is inert. */
  disabled?: boolean
  className?: string
}

type DockTone = 'default' | 'engaged' | 'danger'

const DockButton = forwardRef<
  HTMLButtonElement,
  { tone?: DockTone; icon: ReactNode; 'aria-label': string; 'aria-pressed'?: boolean; onClick?: () => void; disabled?: boolean }
>(({ tone = 'default', icon, onClick, ...props }, ref) => {
  const styleByTone: Record<DockTone, React.CSSProperties> = {
    default: { background: 'var(--dock-btn)', color: 'var(--dock-btn-fg)' },
    engaged: { background: 'var(--dock-btn-active-bg)', color: 'var(--dock-btn-active-fg)', boxShadow: '0 1px 3px rgba(15,23,42,0.16)' },
    danger: { background: 'var(--error)', color: '#fff', boxShadow: '0 1px 3px rgba(15,23,42,0.16)' },
  }
  return (
    <Pressable
      ref={ref}
      onClick={onClick}
      style={styleByTone[tone]}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full duration-150 active:scale-[0.94] hover:brightness-[1.05]"
      {...props}
    >
      {icon}
    </Pressable>
  )
})
DockButton.displayName = 'DockButton'

/** Presentational call control panel (frosted glass). Transport lives in the
 *  header (single clock); the dock shows the seekable waveform + phone controls. */
export function CallDock({
  progress,
  currentTime,
  duration,
  onSeek,
  muted,
  onMuteChange,
  speakerOn,
  onSpeakerChange,
  inControl,
  onTakeOver,
  onRelease,
  onEndCall,
  onBook,
  callerName,
  callerSpeaking,
  agentSpeaking,
  level,
  disabled = false,
  className,
}: CallDockProps) {
  const data = useMemo(() => generateWaveform(64, 7), [])

  return (
    <div
      style={{
        background: 'var(--dock-bg)',
        borderColor: inControl
          ? 'color-mix(in srgb, var(--waiting) 40%, var(--dock-border))'
          : 'var(--dock-border)',
      }}
      className={cn('flex flex-wrap items-center justify-between gap-x-2 gap-y-3 transition-colors', className)}
    >
      {/* Group 1 — who's on the call */}
      <div className="flex shrink-0 items-center gap-1.5">
        <MiniSpeaker role="customer" name={callerName} speaking={callerSpeaking} level={level} />
        <MiniSpeaker
          role={inControl ? 'operator' : 'ai'}
          name={inControl ? 'You (Operator)' : 'Zoca AI'}
          speaking={agentSpeaking}
          level={level}
          muted={inControl && muted}
        />
      </div>

      {/* Group 2 — waveform + timer */}
      <div className="flex items-center gap-2 w-max">
        <Waveform
          data={data}
          progress={progress}
          onSeek={disabled ? undefined : onSeek}
          height={38}
          playedColor="var(--dock-btn-fg)"
          upcomingColor="var(--dock-wave-upcoming)"
          className={cn('w-40 overflow-hidden sm:w-56', disabled && 'opacity-50')}
          aria-label="Call position"
          valueText={`${formatTime(currentTime / 1000)} of ${formatTime(duration / 1000)}`}
        />
        <span className="tabular shrink-0 text-micro text-text-muted">
          {formatTime(currentTime / 1000)} / {formatTime(duration / 1000)}
        </span>
      </div>

      {/* Group 3 — controls (wraps to its own line on mobile) */}
      <div className="flex basis-full items-center justify-between gap-2 sm:basis-auto">
        <div className="flex gap-2">
        <Tooltip content={muted ? 'Unmute' : 'Mute'}>
          <DockButton
            tone={muted ? 'danger' : 'default'}
            aria-label={muted ? 'Unmute' : 'Mute'}
            aria-pressed={muted}
            icon={muted ? <MicOff size={20} /> : <Mic size={20} />}
            onClick={() => onMuteChange(!muted)}
            disabled={disabled}
          />
        </Tooltip>
        <Tooltip content={speakerOn ? 'Speaker on' : 'Speaker off'}>
          <DockButton
            tone={speakerOn ? 'engaged' : 'default'}
            aria-label={speakerOn ? 'Turn speaker off' : 'Turn speaker on'}
            aria-pressed={speakerOn}
            icon={speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
            onClick={() => onSpeakerChange(!speakerOn)}
            disabled={disabled}
          />
        </Tooltip>
        </div>

        <Tooltip content="End call">
          <DockButton tone="danger" aria-label="End call" icon={<PhoneOff size={20} />} onClick={onEndCall} disabled={disabled} />
        </Tooltip>

        {inControl ? (
          <>
            <Button variant="primary" size="md" className="rounded-full" leftIcon={<CalendarPlus size={16} />} onClick={onBook} disabled={disabled}>
              Book
            </Button>
            <Button variant="secondary" size="md" className="rounded-full" leftIcon={<Bot size={16} />} onClick={onRelease} disabled={disabled}>
              Hand back
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="md" className="rounded-full" leftIcon={<Headset size={16} />} onClick={onTakeOver} disabled={disabled}>
            Take over
          </Button>
        )}
      </div>
    </div>
  )
}
