import { createElement } from 'react'
import { ArrowRight, ReceiptText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { DashboardEmpty } from '@/components/dashboard/DashboardEmpty'
import { getCategoryColors, getCategoryIcon } from '@/lib/categoryIcons'
import { formatCurrency, formatExpenseDate } from '@/lib/format'
import type { DashboardRecentExpenseRow } from '@/types/database'

type RecentExpensesProps = {
  expenses: DashboardRecentExpenseRow[]
}

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <ChartCard
      title="Dernières dépenses"
      subtitle="Les cinq dernières opérations du mois"
      action={
        <Link
          to="/expenses"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
        >
          Tout voir
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      }
    >
      {expenses.length === 0 ? (
        <DashboardEmpty
          icon={<ReceiptText className="h-5 w-5" aria-hidden="true" />}
          title="Aucune dépense ce mois"
          description="Enregistrez votre première dépense pour alimenter le tableau de bord."
          className="h-[180px]"
        />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {expenses.map((expense) => {
            const colors = getCategoryColors(expense.category_color)
            return (
              <li
                key={expense.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: colors.background,
                    color: colors.text,
                  }}
                >
                  {createElement(getCategoryIcon(expense.category_icon), {
                    className: 'h-4 w-4',
                    'aria-hidden': true,
                  })}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {expense.merchant}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {formatExpenseDate(expense.expense_date)} ·{' '}
                    {expense.category_name ?? 'Sans catégorie'}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(expense.amount)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </ChartCard>
  )
}
