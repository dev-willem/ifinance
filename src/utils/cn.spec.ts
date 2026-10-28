import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values and supports object/array syntax', () => {
    expect(cn('a', false, null, undefined, 0, '', ['b', { c: true, d: false }])).toBe('a b c')
  })

  it('lets later tailwind utilities win over conflicting earlier ones', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('bg-indigo-500', 'bg-rose-500')).toBe('bg-rose-500')
    expect(cn('h-11 sm:h-9', 'h-12')).toBe('sm:h-9 h-12')
  })

  it('keeps non-conflicting utilities and arbitrary values', () => {
    expect(cn('text-sm', 'text-[var(--text-primary)]')).toBe('text-sm text-[var(--text-primary)]')
  })

  it('returns empty string for no input', () => {
    expect(cn()).toBe('')
  })
})
