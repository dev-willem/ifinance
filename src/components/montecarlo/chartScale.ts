/** Maps [d0, d1] onto [r0, r1]; a degenerate domain maps everything to r0. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number) {
  return (v: number) => (d1 === d0 ? r0 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0))
}

/** Rounds a raw step up to 1, 2, 5 or 10 × 10^k. */
export function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag
}

/** Ticks from 0 up to the first nice value ≥ max (the last tick doubles as the axis top). */
export function niceTicks(max: number, count = 5): number[] {
  if (!(max > 0) || !Number.isFinite(max)) return [0, 1]
  const step = niceStep(max / count)
  const n = Math.ceil(max / step - 1e-9)
  return Array.from({ length: n + 1 }, (_, i) => i * step)
}

/** Year labels at a regular step, always including the last year. */
export function yearTicks(years: number, maxTicks = 10): number[] {
  const step = Math.max(1, Math.ceil(years / maxTicks))
  const ticks: number[] = []
  for (let y = 0; y < years; y += step) ticks.push(y)
  if (years - ticks[ticks.length - 1]! < step / 2 && ticks.length > 1) ticks.pop()
  ticks.push(years)
  return ticks
}

/** Closed SVG path between an upper and a lower polyline sharing the same x positions. */
export function bandPath(xs: number[], upper: number[], lower: number[]): string {
  if (xs.length === 0) return ''
  const top = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${upper[i]!.toFixed(1)}`)
  const bottom = xs.map((_, i) => xs.length - 1 - i).map((i) => `L${xs[i]!.toFixed(1)},${lower[i]!.toFixed(1)}`)
  return `${top.join(' ')} ${bottom.join(' ')} Z`
}

export function linePath(xs: number[], ys: number[]): string {
  return xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i]!.toFixed(1)}`).join(' ')
}
