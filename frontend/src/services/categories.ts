import { supabase } from '@/lib/supabase'
import type { CategoryRow } from '@/types/database'

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
