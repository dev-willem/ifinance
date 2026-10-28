import { describe, expect, it } from 'vitest'
import { isSafeRedirect } from './redirect'

describe('isSafeRedirect', () => {
  it.each([
    '/',
    '/dashboard',
    '/simulations/123',
    '/simulations?page=2&size=10',
    '/investments#top',
    '/search?q=a%20b',
    '/dashboard?next=%2F%2Fevil.com',
    '/%2F%2Fevil.com',
  ])('accepts internal path %j', (path) => {
    expect(isSafeRedirect(path)).toBe(true)
  })

  it.each([
    ['protocol-relative', '//evil.com'],
    ['protocol-relative with path', '//evil.com/dashboard'],
    ['triple slash', '///evil.com'],
    ['absolute https', 'https://evil.com'],
    ['absolute http', 'http://evil.com/dashboard'],
    ['scheme hidden after slash', '/https://evil.com'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['data scheme', 'data:text/html,<script>alert(1)</script>'],
    ['backslash host', '/\\evil.com'],
    ['double backslash', '\\\\evil.com'],
    ['slash-backslash mix', '/\\/evil.com'],
    ['tab between slashes', '/\t/evil.com'],
    ['newline between slashes', '/\n/evil.com'],
    ['carriage return between slashes', '/\r/evil.com'],
    ['relative path', 'dashboard'],
    ['dot relative path', './dashboard'],
    ['bare host', 'evil.com'],
    ['empty string', ''],
  ])('rejects %s (%j)', (_label, path) => {
    expect(isSafeRedirect(path)).toBe(false)
  })

  it.each([undefined, null, 42, {}, ['/dashboard']])('rejects non-string %j', (value) => {
    expect(isSafeRedirect(value)).toBe(false)
  })

  it('never accepts a value that a browser resolves to another origin', () => {
    const base = 'https://app.ifinance.test'
    const candidates = ['//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', '\\\\evil.com', '/dashboard']
    for (const c of candidates) {
      if (isSafeRedirect(c)) {
        expect(new URL(c, base).origin).toBe(base)
      }
    }
  })
})
