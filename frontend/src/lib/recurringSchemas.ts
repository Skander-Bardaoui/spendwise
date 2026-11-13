import { z } from 'zod'
import { TODAY_ISO } from '@/lib/format'

export const recurringFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Indiquez un montant.')
    .refine(
      (value) => /^\d+(?:[.,]\d{1,3})?$/.test(value),
      'Saisissez un montant valide (ex. 42,50).',
    )
    .refine(
      (value) => Number(value.replace(',', '.')) > 0,
      'Le montant doit être supérieur à 0.',
    ),
  merchant: z
    .string()
    .trim()
    .min(2, 'Indiquez le commerçant ou le bénéficiaire.')
    .max(120, '120 caractères maximum.'),
  categoryId: z.string().min(1, 'Choisissez une catégorie.'),
  frequency: z.enum(['weekly', 'monthly'], {
    message: 'Choisissez une fréquence.',
  }),
  nextDate: z
    .string()
    .min(1, 'La prochaine date est requise.')
    .refine(
      (value) => value >= TODAY_ISO,
      'La prochaine date ne peut pas être passée.',
    ),
})

export type RecurringFormValues = z.infer<typeof recurringFormSchema>
