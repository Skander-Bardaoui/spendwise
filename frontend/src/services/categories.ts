import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/database'

export type CategoryInput = {
  name: string
  icon: string
  color: string
}

function translateCategoryError(error: PostgrestError): Error {
  switch (error.code) {
    case '42501':
    case 'PGRST301':
      return new Error('Accès refusé. Vérifiez que vous êtes bien connecté.')
    case 'PGRST116':
      return new Error('Catégorie introuvable ou déjà supprimée.')
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
    throw new Error('Vous devez être connecté pour gérer vos catégories.')
  }

  return user.id
}

export async function listCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(
      error.message || 'Impossible de charger les catégories.',
    )
  }

  return data ?? []
}

export async function createCategory(
  input: CategoryInput,
): Promise<CategoryRow> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
    })
    .select()
    .single()

  if (error) {
    throw translateCategoryError(error)
  }

  return data as CategoryRow
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<CategoryRow> {
  const { data, error } = await supabase
    .from('categories')
    .update({
      name: input.name.trim(),
      icon: input.icon,
      color: input.color,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw translateCategoryError(error)
  }

  return data as CategoryRow
}

export async function deleteCategoryWithReassignment(
  id: string,
): Promise<{ reassignedTo: string }> {
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (categoryError) {
    throw translateCategoryError(categoryError)
  }

  if (category.user_id === null) {
    throw new Error(
      'Les catégories par défaut ne peuvent pas être supprimées.',
    )
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from('categories')
    .select('id, name')
    .is('user_id', null)
    .eq('name', 'Autre')
    .maybeSingle()

  if (fallbackError) {
    throw translateCategoryError(fallbackError)
  }

  if (!fallback) {
    throw new Error(
      'La catégorie « Autre » est introuvable : impossible de réaffecter les dépenses.',
    )
  }

  const { error: expensesError } = await supabase
    .from('expenses')
    .update({ category_id: fallback.id })
    .eq('category_id', id)

  if (expensesError) {
    throw new Error(
      expensesError.message ||
        'Impossible de réaffecter les dépenses à la catégorie « Autre ».',
    )
  }

  const { error: recurringError } = await supabase
    .from('recurring_expenses')
    .update({ category_id: fallback.id })
    .eq('category_id', id)

  if (recurringError) {
    throw new Error(
      recurringError.message ||
        'Impossible de réaffecter les récurrences à la catégorie « Autre ».',
    )
  }

  const { error: templatesError } = await supabase
    .from('expense_templates')
    .update({ category_id: fallback.id })
    .eq('category_id', id)

  if (templatesError) {
    throw new Error(
      templatesError.message ||
        'Impossible de réaffecter les modèles à la catégorie « Autre ».',
    )
  }

  // Les budgets de cette catégorie sont supprimés par la contrainte
  // "on delete cascade" de budgets.category_id.
  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw translateCategoryError(deleteError)
  }

  return { reassignedTo: fallback.name }
}
