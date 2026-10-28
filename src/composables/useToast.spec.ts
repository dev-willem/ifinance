import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToast } from './useToast'
import { useNotificationsStore } from '@/stores/notifications'

describe('useToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('pushes typed toasts into the notifications store', () => {
    const toast = useToast()
    const store = useNotificationsStore()

    toast.success('Salvo', 'Simulação salva')
    toast.error('Erro')
    toast.warning('Cuidado')
    toast.info('Info')

    expect(store.toasts.map((t) => [t.type, t.title, t.message])).toEqual([
      ['success', 'Salvo', 'Simulação salva'],
      ['error', 'Erro', undefined],
      ['warning', 'Cuidado', undefined],
      ['info', 'Info', undefined],
    ])
  })

  it('works when methods are destructured', () => {
    const { success, remove, clear, add } = useToast()
    const store = useNotificationsStore()

    const id = success('a')
    add({ type: 'info', title: 'b', duration: 1000 })
    expect(store.toasts).toHaveLength(2)

    remove(id)
    expect(store.toasts.map((t) => t.title)).toEqual(['b'])

    clear()
    expect(store.toasts).toHaveLength(0)
  })
})
