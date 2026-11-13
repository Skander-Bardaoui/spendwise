import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { DashboardEmpty } from '@/components/dashboard/DashboardEmpty'
import {
  chartAxisTick,
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
} from '@/components/dashboard/chartTheme'
import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLabel,
  formatMonthShort,
} from '@/lib/format'
import type { DashboardMonthPoint } from '@/services/dashboard'

type MonthlyTrendChartProps = {
  monthlyTrend: DashboardMonthPoint[]
  month: string
}

export function MonthlyTrendChart({
  monthlyTrend,
  month,
}: MonthlyTrendChartProps) {
  const hasData = monthlyTrend.some((point) => point.total > 0)

  return (
    <ChartCard
      title="Tendance sur 6 mois"
      subtitle="Évolution des dépenses mensuelles"
      className="flex h-full flex-col"
    >
      {!hasData ? (
        <DashboardEmpty
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
          title="Historique vide"
          description="Les six derniers mois s'afficheront ici au fil de vos saisies."
        />
      ) : (
        <div
          className="h-[260px] w-full"
          role="img"
          aria-label="Histogramme des dépenses des six derniers mois"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyTrend}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--sw-chart-grid)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={chartAxisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: string) => formatMonthShort(value)}
              />
              <YAxis
                width={52}
                tick={chartAxisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => formatCompactCurrency(value)}
              />
              <Tooltip
                contentStyle={chartTooltipContentStyle}
                labelStyle={chartTooltipLabelStyle}
                itemStyle={chartTooltipItemStyle}
                cursor={{ fill: 'var(--sw-chart-cursor)' }}
                labelFormatter={(label) => formatMonthLabel(String(label))}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Bar dataKey="total" name="Dépenses" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {monthlyTrend.map((point) => (
                  <Cell
                    key={point.month}
                    fill={
                      point.month === month
                        ? 'var(--sw-chart-primary)'
                        : 'var(--sw-bar-muted)'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
