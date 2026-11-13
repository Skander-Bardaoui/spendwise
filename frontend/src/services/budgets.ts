import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { BudgetRow, BudgetStatusRow } from '@/types/database'

export type BudgetInput = {
  category_id: string | null
  amount_limit: number
  alert_threshold: number
}

function translateBudgetError(error: PostgrestError): Error {
  switch (error.code) {
    case '23514':
      return new Error('La limite du budget doit être supérieure à 0.')
    case '23505':
      return new Error(
        'Un budget existe déjà pour cette catégorie et ce mois.',
      )
    case '42501':
    case 'PGRST301':
      return new Error('Accès refusé. Vérifiez que vous êtes bien connecté.')
    default:
      return new Error(
        error.message || 'Une erreur est survenue avec la base de données.',
      )
  }
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Vous devez être connecté pour gérer vos budgets.')
  }

  return user.id
}

export async function listBudgetStatus(
  month: string,
): Promise<BudgetStatusRow[]> {
  const { data, error } = await supabase
    .from('budget_status')
    .select('*')
    .eq('month', month)
    .order('category_id', { ascending: true, nullsFirst: true })

  if (error) {
    throw translateBudgetError(error)
  }

  return (data ?? []) as BudgetStatusRow[]
}

export async function saveBudget(
  month: string,
  input: BudgetInput,
): Promise<BudgetRow> {
  const userId = await requireUserId()

  let existingQuery = supabase
    .from('budgets')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)

  existingQuery =
    input.category_id === null
      ? existingQuery.is('category_id', null)
      : existingQuery.eq('category_id', input.category_id)

  const { data: existing, error: existingError } =
    await existingQuery.maybeSingle()

  if (existingError) {
    throw translateBudgetError(existingError)
  }

  if (existing) {
    const { data, error } = await supabase
      .from('budgets')
      .update({
        amount_limit: input.amount_limit,
        alert_threshold: input.alert_threshold,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      throw translateBudgetError(error)
    }

    return data as BudgetRow
  }

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: userId,
      category_id: input.category_id,
      amount_limit: input.amount_limit,
      month,
      alert_threshold: input.alert_threshold,
    })
    .select()
    .single()

  if (error) {
    throw translateBudgetError(error)
  }

  return data as BudgetRow
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id)

  if (error) {
    throw translateBudgetError(error)
  }
}
