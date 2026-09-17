import type { Meta, StoryObj } from '@storybook/react-vite'
import { InlineCheckpoint } from './InlineCheckpoint'
import { CallStoreContext } from '@/store/callContext'
import type { CallStore } from '@/store/callStore'
import { initialCall, type Call, type PendingInput, type ClientCommand } from '@/types/call'
import { SLOTS, CALLER_WORDS } from '@/stories/fixtures'

/* InlineCheckpoint is store-connected: it renders whatever checkpoint the live
   Call is blocked on. Here we feed it a stub store with a hand-built `pending`
   so every checkpoint kind can be viewed in isolation. */
function stubStore(call: Call): CallStore {
  return {
    subscribe: () => () => {},
    getSnapshot: () => call,
    send: (cmd: ClientCommand) => console.log('send', cmd),
  } as unknown as CallStore
}

function withPending(pending: PendingInput, extra: Partial<Call> = {}): Call {
  return { ...initialCall, connected: true, pending, ...extra }
}

const meta = {
  title: 'Organisms/InlineCheckpoint',
  component: InlineCheckpoint,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-2xl">{Story()}</div>],
} satisfies Meta<typeof InlineCheckpoint>

export default meta
type Story = StoryObj<typeof meta>

const provide = (call: Call): StoryObj<typeof meta>['decorators'] => [
  (Story) => <CallStoreContext.Provider value={stubStore(call)}>{Story()}</CallStoreContext.Provider>,
]

export const CorrectWord: Story = {
  decorators: provide(
    withPending(
      { await: 'correctWord', request: { kind: 'correctWord', title: 'Low-confidence word', lineId: 'l1', wordIndex: 11, alternatives: ['fades', 'facials'] } },
      { feed: [{ kind: 'utterance', id: 'l1', speaker: 'caller', words: CALLER_WORDS, time: '0:06', final: true }] },
    ),
  ),
}

export const SelectSlot: Story = {
  decorators: provide(
    withPending({ await: 'selectSlot', request: { kind: 'selectSlot', title: 'Pick a slot' } }, { slots: SLOTS }),
  ),
}

export const ConfirmBooking: Story = {
  decorators: provide(
    withPending(
      { await: 'confirmBooking', request: { kind: 'confirmBooking', title: 'Confirm booking', deposit: '$15' } },
      { slots: SLOTS, selectedSlotId: 'r' },
    ),
  ),
}

export const PaymentDeclined: Story = {
  decorators: provide(
    withPending({ await: 'chargeDeposit', request: { kind: 'payment', title: 'Deposit declined', card: 'Visa ···· 4242' } }),
  ),
}

export const Handoff: Story = {
  decorators: provide(
    withPending({
      await: 'takeOver',
      request: {
        kind: 'handoff',
        title: 'No evening fade specialist free',
        reason: 'Every fade-certified stylist is booked past closing, and the caller will only take an evening slot.',
        detail: 'Availability · 3 retries failed',
      },
    }),
  ),
}

export const CallerDropped: Story = {
  decorators: provide(
    withPending({
      await: 'callBack',
      request: { kind: 'callerDropped', title: 'Caller dropped', service: 'Fade + beard trim', stylist: 'Marco Diaz', time: 'the 6:30 slot' },
    }),
  ),
}
