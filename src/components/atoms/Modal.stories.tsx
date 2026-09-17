import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Modal } from './Modal'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { open: false, children: null },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

function Demo({ dismissable }: { dismissable?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onOpenChange={setOpen} dismissable={dismissable}>
        <Modal.Title className="text-title font-semibold text-text">Confirm booking</Modal.Title>
        <Modal.Description className="mt-1 text-caption text-text-secondary">
          Marco Diaz · Tomorrow 6:30 PM · Haircut + beard trim · $48 with $15 deposit.
        </Modal.Description>
        <div className="mt-5 flex justify-end gap-2">
          <Modal.Close asChild><Button variant="ghost">Cancel</Button></Modal.Close>
          <Modal.Close asChild><Button>Confirm &amp; book</Button></Modal.Close>
        </div>
      </Modal>
    </>
  )
}

export const Default: Story = { render: () => <Demo /> }

export const Blocking: Story = {
  name: 'Non-dismissable (checkpoint)',
  render: () => <Demo dismissable={false} />,
}
