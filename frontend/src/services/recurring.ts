import { addMonths, addWeeks, format, isValid, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { TODAY_ISO } from '@/lib/format'
import type {
  ExpenseInsert,
  RecurringExpenseRow,
  RecurringExpenseWithCategory,
  RecurringFrequency,
} from '@/types/database'

const RECURRING_SELECT = '*, category:categories(id, name, icon, color)'
const MAX_OCCURRENCES_PER_RUN = 500

export type RecurringInput = {
  merchant: string
  amount: number
  category_id: string
  frequency: RecurringFrequency
  next_date: string
}

export type RecurringRunResult = {
  created: number
  rules: number
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Vous devez être connecté pour gérer vos récurrences.')
  }

  return user.id
}

export async function listRecurringExpenses(): Promise<
  RecurringExpenseWithCategory[]
> {
  const { data, error } = await supabase
    .from('recurring_expenses')
    .select(RECURRING_SELECT)
    .order('active', { ascending: false })
    .order('next_date', { ascending: true })

  if (error) {
    throw new Error(
      error.message || 'Impossible de charger les dépenses récurrentes.',
    )
  }

  return (data ?? []) as unknown as RecurringExpenseWithCategory[]
}

export async function createRecurringExpense(
  input: RecurringInput,
): Promise<RecurringExpenseWithCategory> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert({
      user_id: userId,
      merchant: input.merchant.trim(),
      amount: input.amount,
      category_id: input.category_id,
      frequency: input.frequency,
      next_date: input.next_date,
      active: true,
    })
    .select(RECURRING_SELECT)
    .single()

  if (error) {
    throw new Error(
      error.message || 'Impossible de créer la dépense récurrente.',
    )
  }

  return data as unknown as RecurringExpenseWithCategory
}

export async function setRecurringExpenseActive(
  id: string,
  active: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('recurring_expenses')
    .update({ active })
    .eq('id', id)

  if (error) {
    throw new Error(
      error.message || 'Impossible de modifier la récurrence.',
    )
  }
}

function collectDueDates(
  rule: RecurringExpenseRow,
  today: string,
): { dates: string[]; nextDate: string } {
  const dates: string[] = []
  let cursor = parseISO(rule.next_date)

  if (!isValid(cursor)) {
    return { dates, nextDate: rule.next_date }
  }

  let guard = 0
  while (
    format(cursor, 'yyyy-MM-dd') <= today &&
    guard < MAX_OCCURRENCES_PER_RUN
  ) {
    dates.push(format(cursor, 'yyyy-MM-dd'))
    cursor =
      rule.frequency === 'weekly'
        ? addWeeks(cursor, 1)
        : addMonths(cursor, 1)
    guard += 1
  }

  return { dates, nextDate: format(cursor, 'yyyy-MM-dd') }
}

/**
 * Génère les dépenses échues (next_date <= aujourd'hui) puis avance next_date.
 * Les occurrences déjà présentes pour une règle sont ignorées : le traitement
 * est idempotent et peut être relancé sans créer de doublon.
 */
export async function processRecurringExpenses(): Promise<RecurringRunResult> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('active', true)
    .lte('next_date', TODAY_ISO)

  if (error) {
    throw new Error(
      error.message ||
        'Impossible de charger les récurrences à générer.',
    )
  }

  const rules = (data ?? []) as RecurringExpenseRow[]
  let created = 0

  for (const rule of rules) {
    const { dates, nextDate } = collectDueDates(rule, TODAY_ISO)
    if (dates.length === 0) continue

    const { data: existing, error: existingError } = await supabase
      .from('expenses')
      .select('expense_date')
      .eq('recurring_id', rule.id)
      .in('expense_date', dates)

    if (existingError) {
      throw new Error(
        existingError.message ||
          'Impossible de vérifier les dépenses déjà générées.',
      )
    }

    const existingDates = new Set(
      (existing ?? []).map((row) => row.expense_date as string),
    )
    const payload: ExpenseInsert[] = dates
      .filter((date) => !existingDates.has(date))
      .map((date) => ({
        user_id: userId,
        category_id: rule.category_id,
        merchant: rule.merchant,
        amount: rule.amount,
        expense_date: date,
        note: null,
        receipt_path: null,
        payment_method: 'other',
        recurring_id: rule.id,
      }))

    if (payload.length > 0) {
      const { error: insertError } = await supabase
        .from('expenses')
        .insert(payload)

      if (!insertError) {
        created += payload.length
      } else if (insertError.code === '23505') {
        // Une autre exécution a déjà inséré une occurrence : on réessaie
        // ligne par ligne pour ne perdre aucune nouvelle occurrence.
        for (const row of payload) {
          const { error: rowError } = await supabase
            .from('expenses')
            .insert(row)

          if (rowError && rowError.code !== '23505') {
            throw new Error(
              rowError.message ||
                'Impossible de générer les dépenses récurrentes.',
            )
          }
          if (!rowError) created += 1
        }
      } else {
        throw new Error(
          insertError.message ||
            'Impossible de générer les dépenses récurrentes.',
        )
      }
    }

    const { error: updateError } = await supabase
      .from('recurring_expenses')
      .update({ next_date: nextDate })
      .eq('id', rule.id)

    if (updateError) {
      throw new Error(
        updateError.message || 'Impossible d’avancer la récurrence.',
      )
    }
  }

  return { created, rules: rules.length }
}
