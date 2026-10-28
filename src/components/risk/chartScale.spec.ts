import { describe, expect, it } from 'vitest'
import { linePath, yDomain, yFor } from './chartScale'

const box = { width: 120, height: 70, padding: 10 }

describe('yDomain', () => {
  it('spans all finite values and the included baseline', () => {
    expect(yDomain([[1.1, 0.9], [1.3, null]], 1)).toEqual([0.9, 1.3])
    expect(yDomain([[-0.2, -0.1]], 0)).toEqual([-0.2, 0])
  })

  it('never returns a zero-height domain', () => {
    expect(yDomain([[0, 0]], 0)).toEqual([-0.5, 0.5])
    expect(yDomain([])).toEqual([0, 1])
  })
})

describe('linePath', () => {
  it('maps first/last points to the box edges and inverts y', () => {
    // inner 100x50: x = 10, 60, 110; y(max=2)=10, y(min=0)=60, y(1)=35
    expect(linePath([0, 1, 2], [0, 2], box)).toBe('M10.00,60.00L60.00,35.00L110.00,10.00')
  })

  it('breaks the line on null', () => {
    expect(linePath([0, null, 2], [0, 2], box)).toBe('M10.00,60.00M110.00,10.00')
  })

  it('yFor matches the path scale', () => {
    expect(yFor(1, [0, 2], box)).toBe(35)
  })
})
