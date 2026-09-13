import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })
  it('merges conflicting tailwind utilities (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-sm text-text', 'text-lg')).toContain('text-lg')
    expect(cn('text-sm text-text', 'text-lg')).not.toContain('text-sm')
  })
})
