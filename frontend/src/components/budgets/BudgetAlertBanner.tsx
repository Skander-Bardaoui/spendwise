import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, X } from 'lucide-react'
import {
  budgetAlertTitle,
  dismissBudgetAlert,
  useBudgetAlerts,
} from '@/lib/budgetAlertStore'
import { formatCurrency } from '@/lib/format'

export function BudgetAlertBanner() {
  const alerts = useBudgetAlerts()

  if (alerts.length === 0) return null

  return (
    <div className="mb-5 space-y-2">
      {alerts.map((alert) => {
        const exceeded = alert.status === 'exceeded'
        const percentage = Math.round((alert.spent / alert.limit) * 100)
        return (
          <div
            key={alert.budgetId}
            role="alert"
            className={`flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 shadow-sm ${
              exceeded
                ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                exceeded
                  ? 'bg-red-100 dark:bg-red-500/20'
                  : 'bg-amber-100 dark:bg-amber-500/20'
              }`}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {budgetAlertTitle(alert)}{' '}
                {exceeded ? 'dépassé' : 'bientôt atteint'}
              </p>
              <p className="mt-0.5 text-xs opacity-80">
                {formatCurrency(alert.spent)} dépensés sur{' '}
                {formatCurrency(alert.limit)} ({percentage} %).
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/budgets"
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-white/70 px-2.5 text-xs font-semibold transition-colors hover:bg-white dark:bg-white/10 dark:hover:bg-white/20"
              >
                Voir
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => dismissBudgetAlert(alert.budgetId)}
                aria-label={`Masquer l'alerte ${budgetAlertTitle(alert)}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg opacity-60 transition-opacity hover:bg-white/70 hover:opacity-100 dark:hover:bg-white/20"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
