export interface ParsedSeries {
  values: number[]
  /** pt-BR messages for tokens that are not numbers */
  errors: string[]
}

type DecimalMark = '.' | ','

// One separator followed by exactly 3 digits: "1.002" may be 1002 (pt-BR) or 1.002 (en-US).
const AMBIGUOUS = /^-?[1-9]\d{0,2}[.,]\d{3}$/

function clean(raw: string): string {
  return raw.trim().replace(/−/g, '-').replace(/^\+/, '')
}

/** The decimal mark a token implies on its own, 'ambiguous' for "1.002"-like tokens, null if it has no separator. */
function impliedDecimal(s: string): DecimalMark | 'ambiguous' | null {
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastDot >= 0 && lastComma >= 0) return lastDot > lastComma ? '.' : ','
  const sep = lastDot >= 0 ? '.' : lastComma >= 0 ? ',' : null
  if (sep === null) return null
  // a repeated separator can only be the thousands one
  if (s.indexOf(sep) !== s.lastIndexOf(sep)) return sep === '.' ? ',' : '.'
  return AMBIGUOUS.test(s) ? 'ambiguous' : sep
}

/** Parses with a known decimal mark; thousands groups must be well formed ("1.234.567", not "1.2.3"). */
function parseWith(s: string, decimal: DecimalMark): number | null {
  if (!/^-?[\d.,]+$/.test(s) || !/\d/.test(s)) return null
  const thousands = decimal === '.' ? ',' : '.'
  const parts = s.split(decimal)
  if (parts.length > 2) return null
  const [int, frac] = parts
  if (frac?.includes(thousands)) return null
  if (int.includes(thousands) && !new RegExp(`^-?\\d{1,3}(\\${thousands}\\d{3})+$`).test(int)) return null
  const n = Number(int.split(thousands).join('') + (frac === undefined ? '' : '.' + frac))
  return Number.isFinite(n) ? n : null
}

/**
 * Parses one number in pt-BR ("1.234,56", "1,5") or en-US ("1,234.56", "1.5") format.
 * An ambiguous token such as "1.002" needs `decimal` (from the rest of the series); without it, null.
 */
export function parseNumberBR(raw: string, decimal?: DecimalMark): number | null {
  const s = clean(raw)
  const implied = impliedDecimal(s)
  if (implied === 'ambiguous') return decimal ? parseWith(s, decimal) : null
  return parseWith(s, implied ?? '.')
}

/**
 * Splits a pasted series on newlines, semicolons, tabs or spaces.
 * A "%" suffix divides by 100; `percent` does the same for every token (returns typed as %).
 * The decimal mark of ambiguous tokens ("1.002") comes from the unambiguous ones ("998,50");
 * if the series gives no hint, or mixes both formats, those tokens are reported instead of guessed.
 */
export function parseSeries(text: string, percent = false): ParsedSeries {
  const tokens = text
    .split(/[\s;]+/)
    .map((t) => t.replace(/,+$/, ''))
    .filter((t) => t.length > 0)
    .map((token) => {
      const hasPercent = token.endsWith('%')
      const body = clean(hasPercent ? token.slice(0, -1) : token)
      return { token, hasPercent, body, implied: impliedDecimal(body) }
    })

  const marks = new Set<DecimalMark>()
  for (const t of tokens) {
    if ((t.implied === '.' || t.implied === ',') && parseWith(t.body, t.implied) !== null) marks.add(t.implied)
  }
  const seriesDecimal = marks.size === 1 ? [...marks][0] : undefined

  const values: number[] = []
  const errors: string[] = []
  tokens.forEach((t, i) => {
    if (t.implied === 'ambiguous' && !seriesDecimal) {
      errors.push(
        `Valor ambíguo na posição ${i + 1}: "${t.token}" (milhar ou decimal?). ` +
          'Use 1002 ou 1.002,00 para milhar, ou 1,0020 para decimal.',
      )
      return
    }
    const n = parseNumberBR(t.body, seriesDecimal)
    if (n === null) {
      errors.push(`Valor inválido na posição ${i + 1}: "${t.token}"`)
      return
    }
    values.push(t.hasPercent || percent ? n / 100 : n)
  })

  return { values, errors }
}
