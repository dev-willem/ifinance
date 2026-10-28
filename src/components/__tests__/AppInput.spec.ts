import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/components/ui/AppInput.vue'

describe('AppInput', () => {
  it('links the label to the input', () => {
    const w = mount(AppInput, { props: { label: 'Valor', id: 'valor', required: true } })
    expect(w.find('label').attributes('for')).toBe('valor')
    expect(w.find('input').attributes('id')).toBe('valor')
    expect(w.find('label').text()).toContain('*')
  })

  it('generates an id so the label still targets the input', () => {
    const w = mount(AppInput, { props: { label: 'Valor' } })
    const id = w.find('input').attributes('id')
    expect(id).toBeTruthy()
    expect(w.find('label').attributes('for')).toBe(id)
  })

  it('renders the model value and emits strings for text inputs', async () => {
    const w = mount(AppInput, { props: { modelValue: 'abc' } })
    expect(w.find('input').element.value).toBe('abc')

    await w.find('input').setValue('Minha simulação')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual(['Minha simulação'])
  })

  it('renders null as empty', () => {
    const w = mount(AppInput, { props: { modelValue: null } })
    expect(w.find('input').element.value).toBe('')
  })

  it.each(['number', 'currency', 'percent'] as const)('variant %s renders a number input and emits numbers', async (variant) => {
    const w = mount(AppInput, { props: { variant, modelValue: 1 } })
    const input = w.find('input')
    expect(input.attributes('type')).toBe('number')

    await input.setValue('12.5')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([12.5])
  })

  it('emits null when a numeric input is cleared', async () => {
    const w = mount(AppInput, { props: { variant: 'currency', modelValue: 10 } })
    await w.find('input').setValue('')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([null])
  })

  it('type="number" is also treated as numeric', async () => {
    const w = mount(AppInput, { props: { type: 'number' } })
    await w.find('input').setValue('3')
    expect(w.emitted('update:modelValue')!.at(-1)).toEqual([3])
  })

  it('uses cent steps for currency and percent and unit steps otherwise', () => {
    expect(mount(AppInput, { props: { variant: 'currency' } }).find('input').attributes('step')).toBe('0.01')
    expect(mount(AppInput, { props: { variant: 'percent' } }).find('input').attributes('step')).toBe('0.01')
    expect(mount(AppInput, { props: { variant: 'number' } }).find('input').attributes('step')).toBe('1')
    expect(mount(AppInput, { props: { variant: 'number', step: 0.5 } }).find('input').attributes('step')).toBe('0.5')
  })

  it('shows the error instead of the hint and marks the border', () => {
    const w = mount(AppInput, { props: { hint: 'Dica', error: 'Campo obrigatório' } })
    expect(w.text()).toContain('Campo obrigatório')
    expect(w.text()).not.toContain('Dica')
    expect(w.find('input').classes()).toContain('border-rose-500')
  })

  it('shows the hint when there is no error', () => {
    const w = mount(AppInput, { props: { hint: 'Dica' } })
    expect(w.text()).toContain('Dica')
  })

  it('forwards blur and focus events', async () => {
    const w = mount(AppInput)
    await w.find('input').trigger('focus')
    await w.find('input').trigger('blur')
    expect(w.emitted('focus')).toHaveLength(1)
    expect(w.emitted('blur')).toHaveLength(1)
  })

  it('passes disabled through to the input', () => {
    const w = mount(AppInput, { props: { disabled: true } })
    expect(w.find('input').attributes('disabled')).toBeDefined()
  })
})
