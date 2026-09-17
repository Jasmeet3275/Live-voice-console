import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Keyboard } from 'lucide-react'
import { ShortcutsDialog } from './ShortcutsDialog'
import { Button } from '@/components/atoms'

const meta = {
  title: 'Organisms/ShortcutsDialog',
  component: ShortcutsDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { open: false, onOpenChange: () => {} },
} satisfies Meta<typeof ShortcutsDialog>

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" size="sm" leftIcon={<Keyboard size={15} />} onClick={() => setOpen(true)}>
        Open shortcuts
      </Button>
      <ShortcutsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export const Default: Story = { render: () => <Demo /> }
