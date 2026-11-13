import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/hooks/useDashboard'
import { deleteBudget, listBudgetStatus, saveBudget } from '@/services/budgets'
import type { BudgetInput } from '@/services/budgets'

export const budgetKeys = {
  all: ['budgets'] as const,
  status: (month: string) => [...budgetKeys.all, 'status', month] as const,
}

export function useBudgetStatus(month: string) {
  return useQuery({
    queryKey: budgetKeys.status(month),
    queryFn: () => listBudgetStatus(month),
    staleTime: 30_000,
  })
}

export function useSaveBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      month,
      input,
    }: {
      month: string
      input: BudgetInput
    }) => saveBudget(month, input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
    },
  })
}
