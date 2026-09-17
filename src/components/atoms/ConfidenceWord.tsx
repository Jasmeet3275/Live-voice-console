import { useState } from 'react'
import { Popover } from 'radix-ui'
import { Check, TriangleAlert } from 'lucide-react'
import { Pressable } from '@/components/atoms'
import { cn } from '@/lib/cn'

export interface TranscriptWord {
  text: string
  /** 0–1 recognition confidence. */
  confidence: number
  /** Candidate words the recognizer considered (for low-confidence tokens). */
  alternatives?: string[]
  /** Set once the operator has resolved this word. */
  corrected?: boolean
}

const HIGH = 0.85
const LOW = 0.65

type Level = 'high' | 'medium' | 'low'
function levelOf(c: number): Level {
  if (c >= HIGH) return 'high'
  if (c >= LOW) return 'medium'
  return 'low'
}

/** A single transcript token whose styling reflects recognition confidence.
 *  Low-confidence words are interactive: click to see alternatives and correct
 *  them (this is where the operator resolves e.g. "fade" vs "facial"). */
export function ConfidenceWord({
  word,
  onCorrect,
  readOnly = false,
}: {
  word: TranscriptWord
  onCorrect?: (chosen: string) => void
  /** When true, low-confidence words show the flag but aren't clickable
   *  (correction happens elsewhere, e.g. the centered input form). */
  readOnly?: boolean
}) {
  const [open, setOpen] = useState(false)
  const level = levelOf(word.confidence)
  const pct = Math.round(word.confidence * 100)

  // Resolved words read as normal text with a subtle "reviewed" underline.
  if (word.corrected) {
    return (
      <span
        className="underline decoration-accent decoration-1 underline-offset-2"
        title={`Corrected · was low confidence`}
      >
        {word.text}
      </span>
    )
  }

  if (level === 'high') {
    return <span>{word.text}</span>
  }

  if (level === 'medium') {
    return (
      <span
        className="cursor-help underline decoration-dotted decoration-text-muted underline-offset-2"
        title={`Medium confidence · ${pct}%`}
      >
        {word.text}
      </span>
    )
  }

  // low confidence, read-only → show the flag without the inline popover
  if (readOnly) {
    return (
      <span
        title={`Low confidence · ${pct}%`}
        className="font-medium text-warning underline decoration-wavy decoration-warning-solid underline-offset-2"
      >
        {word.text}
      </span>
    )
  }

  // low confidence → interactive correction
  const options = word.alternatives?.length
    ? word.alternatives
    : [word.text]

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Pressable
          aria-label={`Low confidence word "${word.text}", ${pct}% — review`}
          className={cn(
            'inline items-baseline rounded-sm px-0.5 font-medium text-warning',
            'underline decoration-wavy decoration-warning-solid underline-offset-2',
            'hover:bg-warning-subtle',
          )}
        >
          {word.text}
        </Pressable>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className="z-50 w-60 rounded-lg border border-border bg-surface p-3 shadow-e3 animate-pop"
        >
          <div className="mb-2 flex items-center gap-1.5 text-caption font-medium text-warning">
            <TriangleAlert size={13} />
            Low confidence · {pct}%
          </div>
          <p className="mb-2 text-caption text-text-muted">
            Did the caller say…?
          </p>
          <div className="flex flex-col gap-1">
            {options.map((opt) => {
              const isCurrent = opt === word.text
              return (
                <Pressable
                  key={opt}
                  onClick={() => {
                    onCorrect?.(opt)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm',
                    'hover:bg-surface-2',
                    isCurrent && 'bg-surface-2 font-medium',
                  )}
                >
                  {opt}
                  {isCurrent && <Check size={14} className="text-accent" />}
                </Pressable>
              )
            })}
          </div>
          <Popover.Arrow className="fill-surface" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
