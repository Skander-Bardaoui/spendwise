import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getDashboardSnapshot } from '@/services/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  snapshot: (month: string) =>
    [...dashboardKeys.all, 'snapshot', month] as const,
}

export function useDashboard(month: string) {
  return useQuery({
    queryKey: dashboardKeys.snapshot(month),
    queryFn: () => getDashboardSnapshot(month),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}
