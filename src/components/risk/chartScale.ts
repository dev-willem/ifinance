export interface ChartBox {
  width: number
  height: number
  padding: number
}

/** Y domain over every finite value, always including `include` (e.g. 0 or 1), never zero-height. */
export function yDomain(series: (number | null)[][], include?: number): [number, number] {
  const all = series.flat().filter((v): v is number => v !== null && Number.isFinite(v))
  if (include !== undefined) all.push(include)
  if (all.length === 0) return [0, 1]
  let min = all.reduce((a, b) => Math.min(a, b))
  let max = all.reduce((a, b) => Math.max(a, b))
  if (max - min < 1e-12) {
    min -= 0.5
    max += 0.5
  }
  return [min, max]
}

/** SVG path for a series; null points break the line. */
export function linePath(values: (number | null)[], domain: [number, number], box: ChartBox): string {
  const [min, max] = domain
  const innerW = box.width - 2 * box.padding
  const innerH = box.height - 2 * box.padding
  const stepX = values.length > 1 ? innerW / (values.length - 1) : 0
  let d = ''
  let pen = false
  values.forEach((v, i) => {
    if (v === null || !Number.isFinite(v)) {
      pen = false
      return
    }
    const x = box.padding + i * stepX
    const y = box.padding + ((max - v) / (max - min)) * innerH
    d += `${pen ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`
    pen = true
  })
  return d
}

export function yFor(value: number, domain: [number, number], box: ChartBox): number {
  const [min, max] = domain
  return box.padding + ((max - value) / (max - min)) * (box.height - 2 * box.padding)
}
