import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Switch } from './Switch'

const meta = {
  title: 'Atoms/Switch',
  component: Switch,
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

function Controlled() {
  const [on, setOn] = useState(true)
  return (
    <label className="flex items-center gap-2 text-caption text-text">
      <Switch checked={on} onCheckedChange={setOn} aria-label="Require deposit" /> Require deposit
    </label>
  )
}

export const Default: Story = { render: () => <Controlled /> }

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Switch defaultChecked aria-label="On" />
      <Switch aria-label="Off" />
      <Switch disabled defaultChecked aria-label="Disabled on" />
      <Switch disabled aria-label="Disabled off" />
    </div>
  ),
}
