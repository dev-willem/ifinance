export function useFormatBR() {
  const currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const percentFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })

  const numberFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const intFormatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return 'R$ -'
    return currencyFormatter.format(value)
  }

  function formatPercent(value: number | null | undefined, isDecimal = false): string {
    if (value == null) return '-'
    const v = isDecimal ? value : value / 100
    return percentFormatter.format(v)
  }

  function formatNumber(
    value: number | null | undefined,
    decimals = 0,
  ): string {
    if (value == null) return '-'

    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  function formatInt(value: number | null | undefined): string {
    if (value == null) return '-'
    return intFormatter.format(value)
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  function formatDatetime(dateStr: string | null | undefined): string {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  function formatLargeNumber(value: number | null | undefined): string {
    if (value == null) return '-'
    const abs = Math.abs(value)
    const sign = value < 0 ? '-' : ''
    if (abs >= 1_000_000_000) {
      return `${sign}R$ ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} Bi`
    }
    if (abs >= 1_000_000) {
      return `${sign}R$ ${(abs / 1_000_000).toFixed(1).replace('.', ',')} Mi`
    }
    if (abs >= 1_000) {
      return `${sign}R$ ${(abs / 1_000).toFixed(1).replace('.', ',')} Mil`
    }
    return formatCurrency(value)
  }

  function formatTerm(term: number, periodicity = 'MONTHLY'): string {
    if (periodicity === 'MONTHLY') {
      if (term >= 12) {
        const years = Math.floor(term / 12)
        const months = term % 12
        if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`
        return `${years}a ${months}m`
      }
      return `${term} ${term === 1 ? 'mês' : 'meses'}`
    }
    return `${term} períodos`
  }

  return {
    formatCurrency,
    formatPercent,
    formatNumber,
    formatInt,
    formatDate,
    formatDatetime,
    formatLargeNumber,
    formatTerm,
  }
}
