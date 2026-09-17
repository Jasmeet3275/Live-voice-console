import { User, Bot, Headset, MicOff } from 'lucide-react'
import { Tooltip } from '@/components/ui'

export type SpeakerRole = 'customer' | 'ai' | 'operator'

const roleConfig: Record<SpeakerRole, { color: string; Icon: typeof User }> = {
  customer: { color: 'var(--info)', Icon: User },
  ai: { color: 'var(--accent)', Icon: Bot },
  operator: { color: 'var(--waiting)', Icon: Headset },
}

/** Tiny speaker indicator for the control dock — just enough to tell who's who
 *  and who's speaking (glow tracks volume). */
export function MiniSpeaker({
  role,
  name,
  speaking = false,
  level = 0,
  muted = false,
}: {
  role: SpeakerRole
  name: string
  speaking?: boolean
  level?: number
  muted?: boolean
}) {
  const { color, Icon } = roleConfig[role]
  const lvl = speaking ? Math.min(1, Math.max(0, level)) : 0
  const glow = speaking && !muted
    ? { boxShadow: `0 0 0 2px ${color}, 0 0 ${5 + lvl * 14}px color-mix(in srgb, ${color} ${Math.round(30 + lvl * 40)}%, transparent)`, color }
    : { color: 'var(--dock-btn-fg)' }

  return (
    <Tooltip content={`${name}${muted ? ' · muted' : speaking ? ' · speaking' : ''}`}>
      <span
        tabIndex={0}
        aria-label={`${name}${muted ? ', muted' : speaking ? ', speaking' : ''}`}
        style={glow}
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition-shadow"
      >
        <Icon size={18} />
        {muted && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-surface bg-error text-white">
            <MicOff size={9} />
          </span>
        )}
      </span>
    </Tooltip>
  )
}
