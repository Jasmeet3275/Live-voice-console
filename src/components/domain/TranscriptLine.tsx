import { Fragment } from 'react'
import { cn } from '@/lib/cn'
import { ConfidenceWord, type TranscriptWord } from './ConfidenceWord'

export type TranscriptSpeaker = 'caller' | 'ai'

export interface TranscriptLineProps {
  speaker: TranscriptSpeaker
  words: TranscriptWord[]
  name?: string
  time?: string
  /** Highlight the line currently being spoken. */
  active?: boolean
  onCorrectWord?: (index: number, chosen: string) => void
  /** Show low-confidence flags without the inline correction popover. */
  readOnly?: boolean
  className?: string
}

const speakerConfig: Record<TranscriptSpeaker, { name: string }> = {
  caller: { name: 'Caller' },
  ai: { name: 'Zoca AI' },
}

/** One speaker turn in the live transcript, as an asymmetric chat bubble (AI
 *  left with a teal avatar, caller mirrored on the right). Words render via
 *  ConfidenceWord so uncertain tokens (e.g. "fade") are flagged and correctable. */
export function TranscriptLine({
  speaker,
  words,
  name,
  time,
  active = false,
  onCorrectWord,
  readOnly = false,
  className,
}: TranscriptLineProps) {
  const cfg = speakerConfig[speaker]
  const isAi = speaker === 'ai'

  const meta = (
    <div className={cn('mb-1.5 flex items-baseline gap-2', !isAi && 'flex-row-reverse')}>
      <span className="text-[12.5px] font-semibold text-text">{name ?? cfg.name}</span>
      {time && <span className="tabular text-[11px] text-text-muted">{time}</span>}
    </div>
  )

  const bubble = (
    <div
      className={cn(
        'px-3.5 py-2.5 text-[13.5px] leading-[1.55] text-text-secondary',
        isAi
          ? 'rounded-[4px_13px_13px_13px] border border-border bg-surface'
          : 'max-w-[86%] rounded-[13px_4px_13px_13px] bg-bubble-caller',
        active && 'ring-2 ring-accent-border',
      )}
    >
      {words.map((w, i) => (
        <Fragment key={i}>
          <ConfidenceWord
            word={w}
            readOnly={readOnly}
            onCorrect={(chosen) => onCorrectWord?.(i, chosen)}
          />
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </div>
  )

  return (
    <div className={cn('flex gap-2.5', !isAi && 'flex-row-reverse', className)}>
      <span
        aria-hidden
        className={cn('mt-0.5 h-[26px] w-[26px] shrink-0 rounded-[9px]', isAi ? 'bg-accent' : 'bg-surface-2')}
      />
      <div className={cn('flex min-w-0 flex-1 flex-col', !isAi && 'items-end')}>
        {meta}
        {bubble}
      </div>
    </div>
  )
}
