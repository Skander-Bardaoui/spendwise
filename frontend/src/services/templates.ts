import { supabase } from '@/lib/supabase'
import type { ExpenseTemplateWithCategory } from '@/types/database'

const TEMPLATE_SELECT = '*, category:categories(id, name, icon, color)'

export type TemplateInput = {
  name: string
  merchant: string
  amount: number
  category_id: string | null
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Vous devez être connecté pour gérer vos modèles.')
  }

  return user.id
}

export async function listTemplates(): Promise<
  ExpenseTemplateWithCategory[]
> {
  const { data, error } = await supabase
    .from('expense_templates')
    .select(TEMPLATE_SELECT)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(
      error.message || 'Impossible de charger les modèles.',
    )
  }

  return (data ?? []) as unknown as ExpenseTemplateWithCategory[]
}

export async function createTemplate(
  input: TemplateInput,
): Promise<ExpenseTemplateWithCategory> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('expense_templates')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      merchant: input.merchant.trim(),
      amount: input.amount,
      category_id: input.category_id,
    })
    .select(TEMPLATE_SELECT)
    .single()

  if (error) {
    throw new Error(
      error.message || 'Impossible d’enregistrer le modèle.',
    )
  }

  return data as unknown as ExpenseTemplateWithCategory
}
