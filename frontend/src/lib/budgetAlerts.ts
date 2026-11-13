import { pushBudgetAlerts } from '@/lib/budgetAlertStore'
import { listBudgetStatus } from '@/services/budgets'
import type { BudgetStatusRow, BudgetStatusValue } from '@/types/database'

const STATUS_RANK: Record<BudgetStatusValue, number> = {
  ok: 0,
  warning: 1,
  exceeded: 2,
}

export function expenseMonth(expenseDate: string) {
  return `${expenseDate.slice(0, 7)}-01`
}

export async function captureBudgetStatuses(
  months: string[],
): Promise<Map<string, BudgetStatusRow[] | null>> {
  const uniqueMonths = [...new Set(months)]
  const entries = await Promise.all(
    uniqueMonths.map(async (month) => {
      try {
        const rows = await listBudgetStatus(month)
        return [month, rows] as const
      } catch {
        return [month, null] as const
      }
    }),
  )

  return new Map(entries)
}

export function findBudgetCrossings(
  previous: BudgetStatusRow[],
  next: BudgetStatusRow[],
): BudgetStatusRow[] {
  const previousStatuses = new Map(
    previous.map((row) => [row.budget_id, row.status]),
  )

  return next.filter((row) => {
    const previousStatus = previousStatuses.get(row.budget_id) ?? 'ok'
    return STATUS_RANK[row.status] > STATUS_RANK[previousStatus]
  })
}

export async function evaluateBudgetAlerts(
  previousByMonth: Map<string, BudgetStatusRow[] | null>,
) {
  for (const [month, previous] of previousByMonth) {
    if (!previous) continue

    try {
      const next = await listBudgetStatus(month)
      pushBudgetAlerts(findBudgetCrossings(previous, next))
    } catch {
      // Une alerte manquée ne doit pas bloquer l'enregistrement de la dépense.
    }
  }
}
