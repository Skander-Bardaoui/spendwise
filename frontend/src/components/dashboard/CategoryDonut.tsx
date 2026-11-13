import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { DashboardEmpty } from '@/components/dashboard/DashboardEmpty'
import {
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
} from '@/components/dashboard/chartTheme'
import { formatCompactCurrency, formatCurrency } from '@/lib/format'
import type { DashboardCategorySlice } from '@/services/dashboard'

const FALLBACK_COLORS = [
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
  '#14B8A6',
  '#EC4899',
  '#6366F1',
]

type CategoryDonutProps = {
  categories: DashboardCategorySlice[]
  total: number
}

export function CategoryDonut({ categories, total }: CategoryDonutProps) {
  const chartData = categories.map((slice, index) => ({
    ...slice,
    fill: slice.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }))

  return (
    <ChartCard
      title="Répartition par catégorie"
      subtitle="Part de chaque catégorie dans les dépenses du mois"
      className="flex h-full flex-col"
    >
      {chartData.length === 0 ? (
        <DashboardEmpty
          icon={<PieIcon className="h-5 w-5" aria-hidden="true" />}
          title="Aucune dépense catégorisée"
          description="Ajoutez une dépense pour voir la répartition par catégorie."
        />
      ) : (
        <>
          <div
            className="relative h-[220px] w-full"
            role="img"
            aria-label="Camembert de répartition des dépenses par catégorie"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                  stroke="none"
                >
                  {chartData.map((slice) => (
                    <Cell key={slice.id ?? slice.name} fill={slice.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipContentStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total
              </span>
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {formatCompactCurrency(total)} TND
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {chartData.length} catégorie{chartData.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
            {chartData.map((slice) => {
              const percentage =
                total > 0 ? Math.round((slice.total / total) * 100) : 0
              return (
                <li
                  key={slice.id ?? slice.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.fill }}
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                    {slice.name}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(slice.total)}
                  </span>
                  <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                    {percentage} %
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </ChartCard>
  )
}
