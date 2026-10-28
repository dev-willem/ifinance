import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/components/ui/AppButton.vue'

describe('AppButton', () => {
  it('renders the default slot as a type="button" by default', () => {
    const w = mount(AppButton, { slots: { default: 'Salvar' } })
    expect(w.text()).toBe('Salvar')
    expect(w.attributes('type')).toBe('button')
    expect(w.attributes('disabled')).toBeUndefined()
  })

  it('honours the type prop', () => {
    const w = mount(AppButton, { props: { type: 'submit' } })
    expect(w.attributes('type')).toBe('submit')
  })

  it('emits click with the event', async () => {
    const w = mount(AppButton, { slots: { default: 'Ok' } })
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
    expect(w.emitted('click')![0][0]).toBeInstanceOf(MouseEvent)
  })

  it('does not emit click when disabled', async () => {
    const w = mount(AppButton, { props: { disabled: true } })
    expect(w.attributes('disabled')).toBeDefined()
    await w.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('is disabled while loading, shows a spinner and hides the icon slots', async () => {
    const w = mount(AppButton, {
      props: { loading: true },
      slots: {
        default: 'Calcular',
        'icon-left': '<i data-test="left" />',
        'icon-right': '<i data-test="right" />',
      },
    })

    expect(w.attributes('disabled')).toBeDefined()
    expect(w.find('.animate-spin').exists()).toBe(true)
    expect(w.find('[data-test="left"]').exists()).toBe(false)
    expect(w.find('[data-test="right"]').exists()).toBe(false)
    expect(w.text()).toContain('Calcular')

    await w.trigger('click')
    expect(w.emitted('click')).toBeUndefined()
  })

  it('shows icon slots and no spinner when idle', () => {
    const w = mount(AppButton, {
      slots: { 'icon-left': '<i data-test="left" />', 'icon-right': '<i data-test="right" />' },
    })
    expect(w.find('.animate-spin').exists()).toBe(false)
    expect(w.find('[data-test="left"]').exists()).toBe(true)
    expect(w.find('[data-test="right"]').exists()).toBe(true)
  })

  it('applies variant/size classes and merges a custom class over them', () => {
    const w = mount(AppButton, { props: { variant: 'destructive', fullWidth: true, class: 'h-20' } })
    const cls = w.classes()
    expect(cls).toContain('bg-rose-500')
    expect(cls).toContain('w-full')
    expect(cls).toContain('h-20')
    expect(cls).not.toContain('h-11')
  })
})
