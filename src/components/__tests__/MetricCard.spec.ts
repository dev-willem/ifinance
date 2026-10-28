import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MetricCard from '@/components/data/MetricCard.vue'

describe('MetricCard', () => {
  it('renders label and value', () => {
    const w = mount(MetricCard, { props: { label: 'Patrimônio', value: 'R$ 1.000,00' } })
    expect(w.text()).toContain('Patrimônio')
    expect(w.text()).toContain('R$ 1.000,00')
  })

  it('renders a dash when value is missing', () => {
    const w = mount(MetricCard, { props: { label: 'Total', value: null } })
    expect(w.find('p.font-bold').text()).toBe('-')
  })

  it('renders zero as a value, not as missing', () => {
    const w = mount(MetricCard, { props: { label: 'Total', value: 0 } })
    expect(w.find('p.font-bold').text()).toBe('0')
  })

  it('shows a skeleton instead of value and change while loading', () => {
    const w = mount(MetricCard, { props: { label: 'Total', value: 'R$ 10,00', change: 5, loading: true } })
    expect(w.text()).not.toContain('R$ 10,00')
    expect(w.text()).not.toContain('%')
    expect(w.find('p.font-bold').exists()).toBe(false)
  })

  it('shows a positive change in green with a plus sign', () => {
    const w = mount(MetricCard, { props: { label: 'x', change: 2.46, changeLabel: 'vs mês anterior' } })
    expect(w.text()).toContain('+2,5%')
    expect(w.text()).toContain('vs mês anterior')
    expect(w.find('.text-emerald-400').exists()).toBe(true)
  })

  it('shows a negative change in red', () => {
    const w = mount(MetricCard, { props: { label: 'x', change: -1.2 } })
    expect(w.text()).toContain('-1,2%')
    expect(w.find('.text-rose-400').exists()).toBe(true)
  })

  it('shows a zero change as neutral', () => {
    const w = mount(MetricCard, { props: { label: 'x', change: 0 } })
    expect(w.text()).toContain('0,0%')
    expect(w.find('.text-emerald-400').exists()).toBe(false)
    expect(w.find('.text-rose-400').exists()).toBe(false)
  })

  it('hides the change row when change is undefined', () => {
    const w = mount(MetricCard, { props: { label: 'x', value: 1 } })
    expect(w.text()).not.toContain('%')
  })

  it('renders the icon slot with the color tone', () => {
    const w = mount(MetricCard, {
      props: { label: 'x', color: 'success' },
      slots: { icon: '<svg data-test="icon" />' },
    })
    expect(w.find('[data-test="icon"]').exists()).toBe(true)
    expect(w.find('.bg-emerald-500\\/15').exists()).toBe(true)
  })

  it('updates the change tone when the change prop flips sign', async () => {
    const w = mount(MetricCard, { props: { label: 'x', change: 3 } })
    await w.setProps({ change: -3 })
    expect(w.text()).toContain('-3,0%')
    expect(w.find('.text-rose-400').exists()).toBe(true)
  })
})
