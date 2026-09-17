import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Dialog, DialogClose } from './Dialog'
import { Button } from './Button'

const meta = {
  title: 'Atoms/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { title: 'Dialog' },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="secondary">Open dialog</Button>}
      title="End this call?"
      description="The caller is still on the line. Ending now stops recording and closes the booking draft."
      footer={
        <>
          <DialogClose asChild><Button variant="ghost">Keep call</Button></DialogClose>
          <DialogClose asChild><Button variant="danger">End call</Button></DialogClose>
        </>
      }
    >
      <p className="text-caption text-text-secondary">Nothing is saved unless you confirm the booking first.</p>
    </Dialog>
  )
}

export const Default: Story = { render: () => <Demo /> }
