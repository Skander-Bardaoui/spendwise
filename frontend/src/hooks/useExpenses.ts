import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { categoryKeys } from '@/hooks/useCategories'
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from '@/services/expenses'
import type {
  ExpenseFilters,
  ExpenseInput,
  ExpensePage,
  ExpenseSortField,
  SortDirection,
} from '@/services/expenses'
import type { CategoryRow, ExpenseWithCategory } from '@/types/database'

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
}

type ListSnapshot = Array<[QueryKey, ExpensePage | undefined]>

type UpdateExpenseVariables = {
  id: string
  input: ExpenseInput
}

function getFiltersFromKey(key: QueryKey): ExpenseFilters | null {
  const candidate = key[2]
  if (!candidate || typeof candidate !== 'object') return null
  if (!('pageSize' in candidate) || !('sortBy' in candidate)) return null
  return candidate as ExpenseFilters
}

function matchesFilters(
  expense: ExpenseWithCategory,
  filters: ExpenseFilters,
) {
  const term = filters.search.trim().toLowerCase()
  if (term) {
    const haystack = `${expense.merchant} ${expense.note ?? ''}`.toLowerCase()
    if (!haystack.includes(term)) return false
  }
  if (filters.categoryId && expense.category_id !== filters.categoryId) {
    return false
  }
  if (filters.paymentMethod && expense.payment_method !== filters.paymentMethod) {
    return false
  }
  if (filters.dateFrom && expense.expense_date < filters.dateFrom) return false
  if (filters.dateTo && expense.expense_date > filters.dateTo) return false
  if (filters.minAmount !== null && expense.amount < filters.minAmount) {
    return false
  }
  if (filters.maxAmount !== null && expense.amount > filters.maxAmount) {
    return false
  }
  return true
}

function sortRows(
  rows: ExpenseWithCategory[],
  sortBy: ExpenseSortField,
  direction: SortDirection,
) {
  const sorted = [...rows].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return a.amount - b.amount
      case 'merchant':
        return a.merchant.localeCompare(b.merchant, 'fr', {
          sensitivity: 'base',
        })
      case 'created_at':
        return a.created_at.localeCompare(b.created_at)
      case 'expense_date':
      default:
        return (
          a.expense_date.localeCompare(b.expense_date) ||
          a.created_at.localeCompare(b.created_at)
        )
    }
  })

  return direction === 'asc' ? sorted : sorted.reverse()
}

function snapshotLists(queryClient: QueryClient): ListSnapshot {
  return queryClient.getQueriesData<ExpensePage>({
    queryKey: expenseKeys.lists(),
  })
}

function rollbackLists(queryClient: QueryClient, snapshots?: ListSnapshot) {
  if (!snapshots) return
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data)
  }
}

function pickCategory(
  category: CategoryRow | undefined,
): ExpenseWithCategory['category'] {
  if (!category) return null
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
  }
}

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => listExpenses(filters),
    placeholderData: keepPreviousData,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.lists() })
      const snapshots = snapshotLists(queryClient)

      const category = queryClient
        .getQueryData<CategoryRow[]>(categoryKeys.list())
        ?.find((item) => item.id === input.category_id)

      const optimistic: ExpenseWithCategory = {
        id: `optimistic-${crypto.randomUUID()}`,
        user_id: 'optimistic',
        category_id: input.category_id,
        merchant: input.merchant.trim(),
        amount: input.amount,
        expense_date: input.expense_date,
        note: input.note,
        receipt_path: null,
        payment_method: input.payment_method,
        recurring_id: null,
        created_at: new Date().toISOString(),
        category: pickCategory(category),
      }

      for (const [key, data] of snapshots) {
        if (!data) continue
        const filters = getFiltersFromKey(key)
        if (!filters || filters.page !== 1) continue
        if (!matchesFilters(optimistic, filters)) continue

        const rows = sortRows(
          [optimistic, ...data.rows],
          filters.sortBy,
          filters.sortDirection,
        ).slice(0, filters.pageSize)

        queryClient.setQueryData<ExpensePage>(key, {
          rows,
          total: data.total + 1,
        })
      }

      return { snapshots }
    },
    onError: (_error, _input, context) => {
      rollbackLists(queryClient, context?.snapshots)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: UpdateExpenseVariables) =>
      updateExpense(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.lists() })
      const snapshots = snapshotLists(queryClient)

      const category = queryClient
        .getQueryData<CategoryRow[]>(categoryKeys.list())
        ?.find((item) => item.id === input.category_id)

      for (const [key, data] of snapshots) {
        if (!data) continue
        const filters = getFiltersFromKey(key)
        if (!filters || !data.rows.some((row) => row.id === id)) continue

        const rows = data.rows.map((row) =>
          row.id === id
            ? {
                ...row,
                merchant: input.merchant.trim(),
                amount: input.amount,
                expense_date: input.expense_date,
                category_id: input.category_id,
                category: pickCategory(category),
                payment_method: input.payment_method,
                note: input.note,
              }
            : row,
        )

        queryClient.setQueryData<ExpensePage>(key, {
          rows: sortRows(rows, filters.sortBy, filters.sortDirection),
          total: data.total,
        })
      }

      return { snapshots }
    },
    onError: (_error, _variables, context) => {
      rollbackLists(queryClient, context?.snapshots)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: expenseKeys.lists() })
      const snapshots = snapshotLists(queryClient)

      for (const [key, data] of snapshots) {
        if (!data || !data.rows.some((row) => row.id === id)) continue
        queryClient.setQueryData<ExpensePage>(key, {
          rows: data.rows.filter((row) => row.id !== id),
          total: Math.max(0, data.total - 1),
        })
      }

      return { snapshots }
    },
    onError: (_error, _id, context) => {
      rollbackLists(queryClient, context?.snapshots)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
    },
  })
}
