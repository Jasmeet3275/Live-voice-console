import type { LucideIcon } from 'lucide-react'
import {
  Mic,
  Gauge,
  Sparkles,
  MessageSquare,
  Ear,
  UserSearch,
  Users,
  CalendarSearch,
  Lock,
  Wallet,
  CreditCard,
  CircleCheck,
  BookmarkCheck,
  PhoneOutgoing,
  Headset,
} from 'lucide-react'
import type { StepType } from '@/types/call'

/** One place mapping each agent step to a human label + icon (the registry the
 *  right-panel trace renders from). */
export const STEP_META: Record<StepType, { label: string; Icon: LucideIcon }> = {
  transcribe: { label: 'Transcribing', Icon: Mic },
  assess_confidence: { label: 'Assessing confidence', Icon: Gauge },
  classify_intent: { label: 'Understanding request', Icon: Sparkles },
  compose_reply: { label: 'Composing reply', Icon: MessageSquare },
  clarify: { label: 'Clarifying', Icon: Ear },
  update_context: { label: 'Loading caller', Icon: UserSearch },
  capability: { label: 'Matching stylists', Icon: Users },
  availability: { label: 'Checking availability', Icon: CalendarSearch },
  recommend: { label: 'Recommending slots', Icon: Sparkles },
  hold: { label: 'Holding slot', Icon: Lock },
  conflict_check: { label: 'Checking conflicts', Icon: Users },
  deposit: { label: 'Deposit', Icon: Wallet },
  payment: { label: 'Taking payment', Icon: CreditCard },
  confirm: { label: 'Confirming booking', Icon: CircleCheck },
  notify: { label: 'Notifying customer', Icon: MessageSquare },
  hold_booking: { label: 'Holding booking', Icon: BookmarkCheck },
  schedule_callback: { label: 'Scheduling callback', Icon: PhoneOutgoing },
  handoff: { label: 'Handing off to operator', Icon: Headset },
}
