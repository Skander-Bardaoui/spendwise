import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '@/hooks/useCategories'
import { budgetKeys } from '@/hooks/useBudgets'
import { dashboardKeys } from '@/hooks/useDashboard'
import { expenseKeys } from '@/hooks/useExpenses'
import { recurringKeys } from '@/hooks/useRecurring'
import { templateKeys } from '@/hooks/useTemplates'
import {
  createCategory,
  deleteCategoryWithReassignment,
  updateCategory,
} from '@/services/categories'
import type { CategoryInput } from '@/services/categories'

function useInvalidateCategories() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    void queryClient.invalidateQueries({ queryKey: templateKeys.all })
    void queryClient.invalidateQueries({ queryKey: recurringKeys.all })
    void queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
  }
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories()

  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSettled: invalidate,
  })
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      updateCategory(id, input),
    onSettled: invalidate,
  })
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories()

  return useMutation({
    mutationFn: (id: string) => deleteCategoryWithReassignment(id),
    onSettled: invalidate,
  })
}
