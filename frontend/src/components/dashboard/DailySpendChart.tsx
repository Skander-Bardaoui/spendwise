import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LineChart } from 'lucide-react'
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
  formatExpenseDate,
  formatMonthLabel,
} from '@/lib/format'
import type { DashboardDailyPoint } from '@/services/dashboard'

type DailySpendChartProps = {
  daily: DashboardDailyPoint[]
  month: string
  monthTotal: number
}

export function DailySpendChart({
  daily,
  month,
  monthTotal,
}: DailySpendChartProps) {
  return (
    <ChartCard
      title="Dépenses quotidiennes"
      subtitle={formatMonthLabel(month)}
      className="flex h-full flex-col"
    >
      {monthTotal <= 0 ? (
        <DashboardEmpty
          icon={<LineChart className="h-5 w-5" aria-hidden="true" />}
          title="Pas encore de dépenses"
          description="La courbe quotidienne apparaîtra dès la première dépense du mois."
        />
      ) : (
        <div
          className="h-[260px] w-full"
          role="img"
          aria-label={`Courbe des dépenses quotidiennes de ${formatMonthLabel(month)}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={daily}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="dashboardDailyGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--sw-chart-primary)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--sw-chart-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--sw-chart-grid)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={chartAxisTick}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickFormatter={(value: string) =>
                  String(Number(value.slice(8, 10)))
                }
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
                cursor={{
                  stroke: 'var(--sw-chart-cursor)',
                  strokeWidth: 1,
                }}
                labelFormatter={(label) => formatExpenseDate(String(label))}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Dépenses"
                stroke="var(--sw-chart-primary)"
                strokeWidth={2.5}
                fill="url(#dashboardDailyGradient)"
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  )
}
