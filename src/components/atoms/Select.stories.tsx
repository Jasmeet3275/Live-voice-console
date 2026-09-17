import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Select } from './Select'

const meta = {
  title: 'Atoms/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    options: [
      { value: 'marco', label: 'Marco Diaz' },
      { value: 'alex', label: 'Alex Kim' },
      { value: 'sam', label: 'Sam Lee' },
    ],
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

const options = [
  { value: 'marco', label: 'Marco Diaz' },
  { value: 'alex', label: 'Alex Kim' },
  { value: 'sam', label: 'Sam Lee' },
]

function Controlled() {
  const [value, setValue] = useState('marco')
  return (
    <div className="w-56">
      <Select aria-label="Stylist" value={value} onValueChange={setValue} options={options} />
    </div>
  )
}

export const Default: Story = { render: () => <Controlled /> }

export const Placeholder: Story = {
  render: () => (
    <div className="w-56">
      <Select aria-label="Stylist" placeholder="Choose a stylist…" options={options} />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-56">
      <Select aria-label="Stylist" disabled defaultValue="marco" options={options} />
    </div>
  ),
}
