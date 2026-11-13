import { useEffect, useRef } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { budgetKeys } from '@/hooks/useBudgets'
import { dashboardKeys } from '@/hooks/useDashboard'
import { expenseKeys } from '@/hooks/useExpenses'
import {
  createRecurringExpense,
  listRecurringExpenses,
  processRecurringExpenses,
  setRecurringExpenseActive,
} from '@/services/recurring'
import type { RecurringInput } from '@/services/recurring'

export const recurringKeys = {
  all: ['recurring'] as const,
  list: () => [...recurringKeys.all, 'list'] as const,
}

export function useRecurringExpenses() {
  return useQuery({
    queryKey: recurringKeys.list(),
    queryFn: listRecurringExpenses,
  })
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RecurringInput) => createRecurringExpense(input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: recurringKeys.all })
    },
  })
}

export function useToggleRecurringExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setRecurringExpenseActive(id, active),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: recurringKeys.all })
    },
  })
}

export function useRecurringProcessor() {
  const queryClient = useQueryClient()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    void processRecurringExpenses()
      .then(({ created }) => {
        if (created > 0) {
          toast.success(
            `${created} dépense${created > 1 ? 's' : ''} récurrente${created > 1 ? 's' : ''} ajoutée${created > 1 ? 's' : ''}.`,
          )
          void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
          void queryClient.invalidateQueries({ queryKey: budgetKeys.all })
          void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
        }
        void queryClient.invalidateQueries({ queryKey: recurringKeys.all })
      })
      .catch(() => undefined)
  }, [queryClient])
}
