import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
})

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function getTodayISO() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export const TODAY_ISO = getTodayISO()

export function getMonthBounds(monthOffset = 0) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0)
  return {
    from: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`,
    to: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
  }
}

export function formatCurrency(amount: number) {
  return `${amountFormatter.format(amount)} TND`
}

export function formatExpenseDate(isoDate: string) {
  const label = format(parseISO(`${isoDate}T00:00:00`), 'd MMM yyyy', {
    locale: fr,
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatShortDate(isoDate: string) {
  return format(parseISO(`${isoDate}T00:00:00`), 'd MMM', { locale: fr })
}

export function formatTime(timestamp: string) {
  return format(new Date(timestamp), 'HH:mm')
}

export function formatPeriodLabel(from: string | null, to: string | null) {
  if (!from && !to) return 'Toutes les périodes'
  if (from && to) {
    return `${formatShortDate(from)} → ${formatShortDate(to)}`
  }
  return from ? `Depuis le ${formatShortDate(from)}` : `Jusqu'au ${formatShortDate(to!)}`
}
