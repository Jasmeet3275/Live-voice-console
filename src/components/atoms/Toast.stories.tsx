import type { Meta, StoryObj } from '@storybook/react-vite'
import { useToast } from './Toast'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Toast',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { description: { component: 'Fire toasts via the `useToast()` hook. `ToastProvider` is supplied globally in preview.' } },
  },
} satisfies Meta

export default meta
type Story = StoryObj

function Demo() {
  const { toast } = useToast()
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => toast('Corrected → “fades”')}>Info</Button>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'success', title: 'Booked', description: 'Marco · tomorrow 6:30 PM' })}>Success</Button>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'warning', title: 'Deposit skipped' })}>Warning</Button>
      <Button variant="secondary" size="sm" onClick={() => toast({ tone: 'error', title: 'Call ended' })}>Error</Button>
    </div>
  )
}

export const Default: Story = { render: () => <Demo /> }
