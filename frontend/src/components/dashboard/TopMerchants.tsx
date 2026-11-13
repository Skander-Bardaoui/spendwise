import { Store } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { DashboardEmpty } from '@/components/dashboard/DashboardEmpty'
import { formatCurrency } from '@/lib/format'
import type { DashboardMerchant } from '@/services/dashboard'

type TopMerchantsProps = {
  merchants: DashboardMerchant[]
}

export function TopMerchants({ merchants }: TopMerchantsProps) {
  const maxTotal = merchants[0]?.total ?? 0

  return (
    <ChartCard
      title="Top 5 commerçants"
      subtitle="Vos plus gros postes de dépense ce mois"
      className="flex h-full flex-col"
    >
      {merchants.length === 0 ? (
        <DashboardEmpty
          icon={<Store className="h-5 w-5" aria-hidden="true" />}
          title="Aucun commerçant"
          description="Les commerçants apparaîtront ici dès vos premières dépenses."
        />
      ) : (
        <ol className="space-y-4">
          {merchants.map((merchant, index) => {
            const width =
              maxTotal > 0
                ? Math.max(6, Math.round((merchant.total / maxTotal) * 100))
                : 0

            return (
              <li key={merchant.merchant} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {merchant.merchant}
                    </p>
                    <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(merchant.total)}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                      {merchant.count} dép.
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </ChartCard>
  )
}
