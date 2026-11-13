import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  getCurrentMonthISO,
  getTodayISO,
  shiftMonthISO,
} from '@/lib/format'
import type {
  BudgetStatusRow,
  DashboardCategoryStatRow,
  DashboardDailyStatRow,
  DashboardMonthlyStatRow,
  DashboardRecentExpenseRow,
} from '@/types/database'

const TREND_MONTHS = 6

export type DashboardCategorySlice = {
  id: string | null
  name: string
  icon: string | null
  color: string | null
  total: number
  count: number
}

export type DashboardDailyPoint = {
  day: string
  total: number
}

export type DashboardMonthPoint = {
  month: string
  total: number
}

export type DashboardMerchant = {
  merchant: string
  total: number
  count: number
}

export type DashboardSnapshot = {
  month: string
  monthTotal: number
  monthCount: number
  previousTotal: number
  variationPct: number | null
  budgetLimit: number | null
  budgetRemaining: number | null
  daily: DashboardDailyPoint[]
  categories: DashboardCategorySlice[]
  monthlyTrend: DashboardMonthPoint[]
  merchants: DashboardMerchant[]
  recentExpenses: DashboardRecentExpenseRow[]
}

function toNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function ensureSuccess(error: PostgrestError | null, fallback: string) {
  if (error) {
    throw new Error(error.message || fallback)
  }
}

function buildDailySeries(
  month: string,
  rows: DashboardDailyStatRow[],
): DashboardDailyPoint[] {
  const [year, monthNumber] = month.split('-').map(Number)
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  const isCurrentMonth = month === getCurrentMonthISO()
  const lastDay = isCurrentMonth
    ? Math.min(Number(getTodayISO().slice(8, 10)), daysInMonth)
    : daysInMonth

  const totalsByDay = new Map(
    rows.map((row) => [row.day, toNumber(row.total_amount)]),
  )

  return Array.from({ length: lastDay }, (_, index) => {
    const day = `${month.slice(0, 7)}-${String(index + 1).padStart(2, '0')}`
    return { day, total: totalsByDay.get(day) ?? 0 }
  })
}

function buildMonthlyTrend(
  month: string,
  rows: DashboardMonthlyStatRow[],
): DashboardMonthPoint[] {
  const totalsByMonth = new Map(
    rows.map((row) => [row.month, toNumber(row.total_amount)]),
  )

  return Array.from({ length: TREND_MONTHS }, (_, index) => {
    const trendMonth = shiftMonthISO(month, index - (TREND_MONTHS - 1))
    return {
      month: trendMonth,
      total: totalsByMonth.get(trendMonth) ?? 0,
    }
  })
}

function resolveBudget(
  rows: BudgetStatusRow[],
): { limit: number | null; remaining: number | null } {
  const globalBudget = rows.find((row) => row.category_id === null)

  if (globalBudget) {
    return {
      limit: toNumber(globalBudget.amount_limit),
      remaining: toNumber(globalBudget.remaining_amount),
    }
  }

  if (rows.length > 0) {
    return {
      limit: rows.reduce((sum, row) => sum + toNumber(row.amount_limit), 0),
      remaining: rows.reduce(
        (sum, row) => sum + toNumber(row.remaining_amount),
        0,
      ),
    }
  }

  return { limit: null, remaining: null }
}

export async function getDashboardSnapshot(
  month: string,
): Promise<DashboardSnapshot> {
  const previousMonth = shiftMonthISO(month, -1)
  const trendMonths = Array.from({ length: TREND_MONTHS }, (_, index) =>
    shiftMonthISO(month, index - (TREND_MONTHS - 1)),
  )

  const [
    monthResult,
    previousResult,
    dailyResult,
    categoryResult,
    monthlyResult,
    merchantResult,
    recentResult,
    budgetResult,
  ] = await Promise.all([
    supabase
      .from('dashboard_monthly_stats')
      .select('*')
      .eq('month', month)
      .maybeSingle(),
    supabase
      .from('dashboard_monthly_stats')
      .select('*')
      .eq('month', previousMonth)
      .maybeSingle(),
    supabase
      .from('dashboard_daily_stats')
      .select('*')
      .eq('month', month)
      .order('day', { ascending: true }),
    supabase
      .from('dashboard_category_stats')
      .select('*')
      .eq('month', month)
      .order('total_amount', { ascending: false }),
    supabase
      .from('dashboard_monthly_stats')
      .select('*')
      .in('month', trendMonths)
      .order('month', { ascending: true }),
    supabase
      .from('dashboard_merchant_stats')
      .select('*')
      .eq('month', month)
      .order('total_amount', { ascending: false })
      .limit(5),
    supabase
      .from('dashboard_recent_expenses')
      .select('*')
      .eq('month', month)
      .lte('month_rank', 5)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('budget_status').select('*').eq('month', month),
  ])

  ensureSuccess(
    monthResult.error,
    'Impossible de charger les totaux du mois.',
  )
  ensureSuccess(
    previousResult.error,
    'Impossible de charger les totaux du mois précédent.',
  )
  ensureSuccess(
    dailyResult.error,
    'Impossible de charger les dépenses quotidiennes.',
  )
  ensureSuccess(
    categoryResult.error,
    'Impossible de charger la répartition par catégorie.',
  )
  ensureSuccess(
    monthlyResult.error,
    'Impossible de charger la tendance mensuelle.',
  )
  ensureSuccess(
    merchantResult.error,
    'Impossible de charger les commerçants.',
  )
  ensureSuccess(
    recentResult.error,
    'Impossible de charger les dernières dépenses.',
  )
  ensureSuccess(
    budgetResult.error,
    'Impossible de charger les budgets du mois.',
  )

  const monthTotal = toNumber(monthResult.data?.total_amount)
  const previousTotal = toNumber(previousResult.data?.total_amount)
  const variationPct =
    previousTotal > 0 ? ((monthTotal - previousTotal) / previousTotal) * 100 : null
  const budget = resolveBudget(budgetResult.data ?? [])

  const categoryRows: DashboardCategoryStatRow[] = categoryResult.data ?? []

  return {
    month,
    monthTotal,
    monthCount: toNumber(monthResult.data?.expense_count),
    previousTotal,
    variationPct,
    budgetLimit: budget.limit,
    budgetRemaining: budget.remaining,
    daily: buildDailySeries(month, dailyResult.data ?? []),
    categories: categoryRows
      .map((row) => ({
        id: row.category_id,
        name: row.category_name ?? 'Sans catégorie',
        icon: row.category_icon,
        color: row.category_color,
        total: toNumber(row.total_amount),
        count: toNumber(row.expense_count),
      }))
      .filter((slice) => slice.total > 0),
    monthlyTrend: buildMonthlyTrend(month, monthlyResult.data ?? []),
    merchants: (merchantResult.data ?? []).map((row) => ({
      merchant: row.merchant,
      total: toNumber(row.total_amount),
      count: toNumber(row.expense_count),
    })),
    recentExpenses: recentResult.data ?? [],
  }
}
