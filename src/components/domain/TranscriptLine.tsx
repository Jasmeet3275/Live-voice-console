import { Fragment } from 'react'
import { Bot, User } from 'lucide-react'
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

const speakerConfig: Record<
  TranscriptSpeaker,
  { name: string; Icon: typeof Bot; badge: string }
> = {
  caller: { name: 'Caller', Icon: User, badge: 'bg-info-subtle text-info' },
  ai: { name: 'Zoca AI', Icon: Bot, badge: 'bg-accent-subtle text-accent' },
}

/** One speaker turn in the live transcript. Words render via ConfidenceWord so
 *  uncertain tokens (e.g. "fade") are visibly flagged and correctable inline. */
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
  const { Icon } = cfg

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg p-2 transition-colors',
        active && 'bg-surface-2',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          cfg.badge,
        )}
      >
        <Icon size={15} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-caption font-semibold text-text">
            {name ?? cfg.name}
          </span>
          {time && (
            <span className="tabular text-micro text-text-muted">{time}</span>
          )}
        </div>
        <p className="text-body leading-relaxed text-text">
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
        </p>
      </div>
    </div>
  )
}
