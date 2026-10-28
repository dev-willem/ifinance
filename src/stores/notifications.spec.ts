import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationsStore } from './notifications'
import { TOAST_DURATION } from '@/core/constants'

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds a toast with a generated id and returns it', () => {
    const store = useNotificationsStore()
    const id = store.add({ type: 'info', title: 'Olá', duration: 1000 })

    expect(id).toBeTruthy()
    expect(store.toasts).toEqual([{ id, type: 'info', title: 'Olá', duration: 1000 }])
  })

  it('auto-removes a toast after its duration', () => {
    const store = useNotificationsStore()
    store.add({ type: 'info', title: 'x', duration: 1000 })

    vi.advanceTimersByTime(999)
    expect(store.toasts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(store.toasts).toHaveLength(0)
  })

  it('keeps persistent toasts until removed explicitly', () => {
    const store = useNotificationsStore()
    const id = store.add({ type: 'warning', title: 'x', duration: 10, persistent: true })

    vi.advanceTimersByTime(60_000)
    expect(store.toasts).toHaveLength(1)

    store.remove(id)
    expect(store.toasts).toHaveLength(0)
  })

  it('removes only the matching toast and ignores unknown ids', () => {
    const store = useNotificationsStore()
    const a = store.add({ type: 'info', title: 'a', duration: 1000 })
    store.add({ type: 'info', title: 'b', duration: 1000 })

    store.remove('does-not-exist')
    expect(store.toasts).toHaveLength(2)

    store.remove(a)
    expect(store.toasts.map((t) => t.title)).toEqual(['b'])
  })

  it('clears all toasts', () => {
    const store = useNotificationsStore()
    store.success('a')
    store.error('b')
    store.clear()
    expect(store.toasts).toEqual([])
  })

  it('shortcut helpers set type, message and duration', () => {
    const store = useNotificationsStore()
    store.success('ok', 'detalhe')
    store.error('falhou')
    store.warning('atenção')
    store.info('info')

    expect(store.toasts.map(({ type, title, message, duration }) => ({ type, title, message, duration }))).toEqual([
      { type: 'success', title: 'ok', message: 'detalhe', duration: TOAST_DURATION },
      { type: 'error', title: 'falhou', message: undefined, duration: TOAST_DURATION + 2000 },
      { type: 'warning', title: 'atenção', message: undefined, duration: TOAST_DURATION },
      { type: 'info', title: 'info', message: undefined, duration: TOAST_DURATION },
    ])
  })

  it('errors stay on screen 2s longer than other toasts', () => {
    const store = useNotificationsStore()
    store.success('ok')
    store.error('falhou')

    vi.advanceTimersByTime(TOAST_DURATION)
    expect(store.toasts.map((t) => t.type)).toEqual(['error'])
    vi.advanceTimersByTime(2000)
    expect(store.toasts).toEqual([])
  })
})
