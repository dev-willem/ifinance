import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPagination from '@/components/ui/AppPagination.vue'

type Props = { totalItems: number; currentPage: number; pageSize: number; totalPages: number; showPageSizeSelector?: boolean }

function setup(props: Partial<Props> = {}) {
  return mount(AppPagination, {
    props: { totalItems: 45, currentPage: 0, pageSize: 10, totalPages: 5, ...props },
  })
}

function navButtons(w: ReturnType<typeof setup>) {
  const all = w.findAll('nav button')
  return { prev: all[0], next: all[all.length - 1], pages: all.slice(1, -1) }
}

function pageLabels(w: ReturnType<typeof setup>) {
  return navButtons(w).pages.map((b) => b.text())
}

describe('AppPagination', () => {
  it('shows the 1-based item range of the current page', () => {
    expect(setup({ currentPage: 1 }).text()).toContain('Exibindo 11-20 de 45 itens')
  })

  it('clamps the range end on the last page', () => {
    expect(setup({ currentPage: 4 }).text()).toContain('Exibindo 41-45 de 45 itens')
  })

  it('lists every page when there are 7 or fewer', () => {
    expect(pageLabels(setup({ totalPages: 7, totalItems: 70 }))).toEqual(['1', '2', '3', '4', '5', '6', '7'])
  })

  it('collapses distant pages with ellipses around the current page', () => {
    const w = setup({ totalPages: 20, totalItems: 200, currentPage: 10 })
    expect(pageLabels(w)).toEqual(['1', '…', '10', '11', '12', '…', '20'])
  })

  it('highlights the current page', () => {
    const w = setup({ currentPage: 2 })
    const current = navButtons(w).pages.find((b) => b.classes().includes('bg-indigo-500'))
    expect(current?.text()).toBe('3')
  })

  it('emits a 0-based page-change when a page is clicked', async () => {
    const w = setup()
    await navButtons(w).pages[3].trigger('click')
    expect(w.emitted('page-change')).toEqual([[3]])
  })

  it('disables prev on the first page and next on the last page', () => {
    const first = navButtons(setup({ currentPage: 0 }))
    expect(first.prev.attributes('disabled')).toBeDefined()
    expect(first.next.attributes('disabled')).toBeUndefined()

    const last = navButtons(setup({ currentPage: 4 }))
    expect(last.prev.attributes('disabled')).toBeUndefined()
    expect(last.next.attributes('disabled')).toBeDefined()
  })

  it('prev/next emit the adjacent page', async () => {
    const w = setup({ currentPage: 2 })
    await navButtons(w).prev.trigger('click')
    await navButtons(w).next.trigger('click')
    expect(w.emitted('page-change')).toEqual([[1], [3]])
  })

  it('ellipsis buttons are disabled and emit nothing', async () => {
    const w = setup({ totalPages: 20, totalItems: 200, currentPage: 10 })
    const ellipsis = navButtons(w).pages.find((b) => b.text() === '…')!
    expect(ellipsis.attributes('disabled')).toBeDefined()
    await ellipsis.trigger('click')
    expect(w.emitted('page-change')).toBeUndefined()
  })

  it('emits page-size-change as a number', async () => {
    const w = setup()
    await w.find('select').setValue('20')
    expect(w.emitted('page-size-change')).toEqual([[20]])
  })

  it('shows 0-0 when there are no items', () => {
    expect(setup({ totalItems: 0, totalPages: 0, currentPage: 0 }).text()).toContain('Exibindo 0-0 de 0 itens')
  })

  it('can hide the page size selector', () => {
    expect(setup({ showPageSizeSelector: false }).find('select').exists()).toBe(false)
  })

  // A single hidden page must be shown, not replaced by (or silently dropped without) an ellipsis
  it('never skips a page without an ellipsis (current page near the start)', () => {
    // total 10, current index 3: window is 2..4, page index 1 ("2") is dropped silently
    expect(pageLabels(setup({ totalPages: 10, totalItems: 100, currentPage: 3 }))).toEqual(['1', '2', '3', '4', '5', '…', '10'])
  })

  it('never skips a page without an ellipsis (current page near the end)', () => {
    // total 10, current index 6: window is 5..7, page index 8 ("9") is dropped silently
    expect(pageLabels(setup({ totalPages: 10, totalItems: 100, currentPage: 6 }))).toEqual(['1', '…', '6', '7', '8', '9', '10'])
  })
})
