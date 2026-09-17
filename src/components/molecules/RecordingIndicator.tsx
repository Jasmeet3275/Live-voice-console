import { Lock } from 'lucide-react'
import { Tooltip } from '@/components/atoms'
import { cn } from '@/lib/cn'

/** Persistent recording + privacy indicator. Meant to be absolutely
 *  positioned at the top-right of the call (right) panel. */
export function RecordingIndicator({
  recording = true,
  className,
}: {
  recording?: boolean
  className?: string
}) {
  if (!recording) return null
  return (
    <Tooltip content="Call is being recorded · Encrypted">
      <span
        tabIndex={0}
        aria-label="Call is being recorded and encrypted"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-error-border bg-error-subtle px-2.5 py-1 text-caption font-medium text-error',
          className,
        )}
      >
        <span className="h-2 w-2 rounded-full bg-error animate-[pulse-dot_1.6s_ease-in-out_infinite]" />
        REC
        <Lock size={11} className="ml-0.5 text-error/70" />
      </span>
    </Tooltip>
  )
}
