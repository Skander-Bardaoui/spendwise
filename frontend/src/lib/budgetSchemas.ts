import { z } from 'zod'

export const budgetFormSchema = z.object({
  categoryId: z.string(),
  amount: z
    .string()
    .trim()
    .min(1, 'Indiquez une limite mensuelle.')
    .refine(
      (value) => /^\d+(?:[.,]\d{1,3})?$/.test(value),
      'Saisissez un montant valide (ex. 500,00).',
    )
    .refine(
      (value) => Number(value.replace(',', '.')) > 0,
      'La limite doit être supérieure à 0.',
    ),
  alertThreshold: z
    .string()
    .trim()
    .min(1, 'Indiquez un seuil d’alerte.')
    .refine(
      (value) => /^\d{1,3}$/.test(value),
      'Saisissez un pourcentage entier.',
    )
    .refine(
      (value) => Number(value) >= 0 && Number(value) <= 100,
      'Le seuil doit être compris entre 0 et 100.',
    ),
})

export type BudgetFormValues = z.infer<typeof budgetFormSchema>
