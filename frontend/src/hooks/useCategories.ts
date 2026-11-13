import { useQuery } from '@tanstack/react-query'
import { listCategories } from '@/services/categories'

export const categoryKeys = {
  all: ['categories'] as const,
  list: () => [...categoryKeys.all, 'list'] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: listCategories,
    staleTime: 5 * 60_000,
  })
}
