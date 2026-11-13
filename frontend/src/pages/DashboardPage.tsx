import { useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { CategoryDonut } from '@/components/dashboard/CategoryDonut'
import { DailySpendChart } from '@/components/dashboard/DailySpendChart'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { KpiCards } from '@/components/dashboard/KpiCards'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart'
import { RecentExpenses } from '@/components/dashboard/RecentExpenses'
import { TopMerchants } from '@/components/dashboard/TopMerchants'
import { useDashboard } from '@/hooks/useDashboard'
import { formatMonthLabel, getCurrentMonthISO } from '@/lib/format'

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonthISO)
  const { data, isPending, isError, isFetching, error, refetch } =
    useDashboard(month)

  return (
    <div className="space-y-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-transparent transition-colors dark:bg-slate-950 dark:ring-slate-800 sm:p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Vue d'ensemble
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Tableau de bord
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {formatMonthLabel(month)}
              {isFetching && !isPending ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin text-emerald-500"
                  aria-hidden="true"
                />
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MonthSelector value={month} onChange={setMonth} />
          </div>
        </header>

        {isPending ? <DashboardSkeleton /> : null}

        {isError ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Impossible de charger le tableau de bord
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {error instanceof Error
                    ? error.message
                    : 'Une erreur inattendue est survenue.'}
                </p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {data ? (
          <>
            <KpiCards snapshot={data} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="h-full xl:col-span-1">
                <CategoryDonut
                  categories={data.categories}
                  total={data.monthTotal}
                />
              </div>
              <div className="h-full xl:col-span-2">
                <DailySpendChart
                  daily={data.daily}
                  month={data.month}
                  monthTotal={data.monthTotal}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="h-full xl:col-span-2">
                <MonthlyTrendChart
                  monthlyTrend={data.monthlyTrend}
                  month={data.month}
                />
              </div>
              <div className="h-full xl:col-span-1">
                <TopMerchants merchants={data.merchants} />
              </div>
            </div>

            <RecentExpenses expenses={data.recentExpenses} />
          </>
        ) : null}
    </div>
  )
}
