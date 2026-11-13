import type { ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatCurrency, formatMonthLabel } from '@/lib/format'
import type { DashboardSnapshot } from '@/services/dashboard'

type KpiCardProps = {
  label: string
  value: string
  footer: ReactNode
  icon: ReactNode
  iconClassName: string
  valueClassName?: string
  children?: ReactNode
}

function KpiCard({
  label,
  value,
  footer,
  icon,
  iconClassName,
  valueClassName = '',
  children,
}: KpiCardProps) {
  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-colors dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </span>
      </div>
      <p
        className={`mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white ${valueClassName}`}
      >
        {value}
      </p>
      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {footer}
      </div>
      {children}
    </article>
  )
}

type KpiCardsProps = {
  snapshot: DashboardSnapshot
}

export function KpiCards({ snapshot }: KpiCardsProps) {
  const {
    month,
    monthTotal,
    monthCount,
    previousTotal,
    variationPct,
    budgetLimit,
    budgetRemaining,
  } = snapshot

  const averagePerExpense = monthCount > 0 ? monthTotal / monthCount : 0
  const isIncrease = variationPct !== null && variationPct > 0
  const isDecrease = variationPct !== null && variationPct < 0
  const variationLabel =
    variationPct === null
      ? '—'
      : `${variationPct > 0 ? '+' : ''}${variationPct
          .toFixed(1)
          .replace('.', ',')} %`
  const variationClass = isIncrease
    ? 'text-rose-600 dark:text-rose-400'
    : isDecrease
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-slate-500 dark:text-slate-400'

  const budgetSpent =
    budgetLimit !== null && budgetRemaining !== null
      ? Math.max(0, budgetLimit - budgetRemaining)
      : 0
  const budgetPct =
    budgetLimit !== null && budgetLimit > 0
      ? Math.min(100, Math.round((budgetSpent / budgetLimit) * 100))
      : 0
  const isOverspent = budgetRemaining !== null && budgetRemaining < 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Total du mois"
        value={formatCurrency(monthTotal)}
        icon={<Wallet className="h-4.5 w-4.5" aria-hidden="true" />}
        iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
        footer={<>Dépenses cumulées en {formatMonthLabel(month)}</>}
      />

      <KpiCard
        label="Variation vs M-1"
        value={variationLabel}
        valueClassName={variationClass}
        icon={
          <TrendingUp
            className="h-4.5 w-4.5"
            aria-hidden="true"
          />
        }
        iconClassName={
          isIncrease
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
        }
        footer={
          <span className="flex items-center gap-1.5">
            {variationPct === null ? (
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            ) : isIncrease ? (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {variationPct === null
              ? 'Aucune dépense le mois précédent'
              : `${formatCurrency(previousTotal)} le mois précédent`}
          </span>
        }
      />

      <KpiCard
        label="Nombre de dépenses"
        value={String(monthCount)}
        icon={<ReceiptText className="h-4.5 w-4.5" aria-hidden="true" />}
        iconClassName="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
        footer={
          monthCount > 0
            ? `${formatCurrency(averagePerExpense)} en moyenne par dépense`
            : 'Aucune transaction sur la période'
        }
      />

      <KpiCard
        label="Budget restant"
        value={
          budgetRemaining === null
            ? 'Non défini'
            : formatCurrency(budgetRemaining)
        }
        valueClassName={
          isOverspent
            ? 'text-rose-600 dark:text-rose-400'
            : budgetRemaining === null
              ? 'text-slate-400 dark:text-slate-500'
              : ''
        }
        icon={<PiggyBank className="h-4.5 w-4.5" aria-hidden="true" />}
        iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
        footer={
          budgetLimit === null ? (
            <Link
              to="/budgets"
              className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Définir un budget
            </Link>
          ) : isOverspent ? (
            `Dépassement de ${formatCurrency(Math.abs(budgetRemaining ?? 0))}`
          ) : (
            `Restant sur ${formatCurrency(budgetLimit)}`
          )
        }
      >
        {budgetLimit !== null ? (
          <div
            className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="progressbar"
            aria-label="Consommation du budget"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={budgetPct}
          >
            <div
              className={`h-full rounded-full transition-all ${
                isOverspent
                  ? 'bg-rose-500'
                  : budgetPct >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        ) : null}
      </KpiCard>
    </div>
  )
}
