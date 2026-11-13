import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTemplate, listTemplates } from '@/services/templates'
import type { TemplateInput } from '@/services/templates'

export const templateKeys = {
  all: ['templates'] as const,
  list: () => [...templateKeys.all, 'list'] as const,
}

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: listTemplates,
    staleTime: 60_000,
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TemplateInput) => createTemplate(input),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: templateKeys.all })
    },
  })
}
