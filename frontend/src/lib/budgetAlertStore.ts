import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import type { BudgetStatusRow } from '@/types/database'

export type BudgetAlert = {
  budgetId: string
  month: string
  status: 'warning' | 'exceeded'
  categoryName: string | null
  spent: number
  limit: number
}

let alerts: BudgetAlert[] = []
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return alerts
}

export function useBudgetAlerts() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

function alertTitle(alert: BudgetAlert) {
  return alert.categoryName
    ? `Budget « ${alert.categoryName} »`
    : 'Budget global'
}

export function budgetAlertTitle(alert: BudgetAlert) {
  return alertTitle(alert)
}

export function pushBudgetAlerts(rows: BudgetStatusRow[]) {
  const nextAlerts: BudgetAlert[] = rows
    .filter(
      (row): row is BudgetStatusRow & { status: 'warning' | 'exceeded' } =>
        row.status === 'warning' || row.status === 'exceeded',
    )
    .map((row) => ({
      budgetId: row.budget_id,
      month: row.month,
      status: row.status,
      categoryName: row.category_name,
      spent: row.spent_amount,
      limit: row.amount_limit,
    }))

  if (nextAlerts.length === 0) return

  const nextIds = new Set(nextAlerts.map((alert) => alert.budgetId))
  alerts = [
    ...alerts.filter((alert) => !nextIds.has(alert.budgetId)),
    ...nextAlerts,
  ]
  emit()

  for (const alert of nextAlerts) {
    const title = alertTitle(alert)
    const description = `${formatCurrency(alert.spent)} dépensés sur ${formatCurrency(alert.limit)}.`
    if (alert.status === 'exceeded') {
      toast.error(`${title} dépassé`, { description })
    } else {
      toast.warning(`${title} bientôt atteint`, { description })
    }
  }
}

export function dismissBudgetAlert(budgetId: string) {
  const next = alerts.filter((alert) => alert.budgetId !== budgetId)
  if (next.length === alerts.length) return
  alerts = next
  emit()
}

export function clearBudgetAlerts() {
  if (alerts.length === 0) return
  alerts = []
  emit()
}
