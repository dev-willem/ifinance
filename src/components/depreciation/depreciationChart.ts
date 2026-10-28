import type { DepreciationResponse } from '@/types/depreciation'

export interface ChartPoint {
  x: number
  y: number
}

/** Book value over time, x in years from acquisition (fiscal years may be partial). */
export function bookValueSeries(schedule: DepreciationResponse): ChartPoint[] {
  const first = schedule.rows[0]
  if (!first) return []
  let months = 0
  const points: ChartPoint[] = [{ x: 0, y: first.openingBookValue }]
  for (const row of schedule.rows) {
    months += row.months
    points.push({ x: months / 12, y: row.closingBookValue })
  }
  return points
}

/** Maps a value from [d0, d1] to [r0, r1]; a degenerate domain maps to r0. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number) {
  const span = d1 - d0
  return (v: number) => (span === 0 ? r0 : r0 + ((v - d0) / span) * (r1 - r0))
}

export function toPath(points: ChartPoint[], sx: (v: number) => number, sy: (v: number) => number): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
    .join(' ')
}

/** Integer year ticks, at most ~maxTicks of them. */
export function yearTicks(maxYears: number, maxTicks = 10): number[] {
  const end = Math.ceil(maxYears)
  if (end <= 0) return [0]
  const step = Math.max(1, Math.ceil(end / maxTicks))
  const ticks: number[] = []
  for (let t = 0; t <= end; t += step) ticks.push(t)
  return ticks
}

/** Parses "30000; 25.000 20000,5" (pt-BR numbers separated by spaces/semicolons/new lines). */
export function parseUnitsList(text: string): number[] | null {
  const tokens = text.split(/[;\s]+/).filter(Boolean)
  if (tokens.length === 0) return null
  const values = tokens.map((t) => Number(t.replace(/\./g, '').replace(',', '.')))
  return values.every((v) => Number.isFinite(v) && v >= 0) ? values : null
}

// RIR/2018 (Decreto nº 9.580/2018), art. 323: shift coefficients apply only to bens móveis
const IMMOVABLE_CLASSES = new Set(['BUILDINGS', 'INSTALLATIONS'])

export function allowsShiftAcceleration(assetClass: string | null): boolean {
  return !assetClass || !IMMOVABLE_CLASSES.has(assetClass)
}
