import { z } from 'zod'
import { TODAY_ISO } from '@/lib/format'

export const expenseFormSchema = z.object({
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
  expenseDate: z
    .string()
    .min(1, 'La date est requise.')
    .refine(
      (value) => value <= TODAY_ISO,
      'La date ne peut pas être dans le futur.',
    ),
  merchant: z
    .string()
    .trim()
    .min(2, 'Indiquez le commerçant ou le bénéficiaire.')
    .max(120, '120 caractères maximum.'),
  categoryId: z.string().min(1, 'Choisissez une catégorie.'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'other'], {
    message: 'Choisissez un moyen de paiement.',
  }),
  note: z.string().trim().max(150, '150 caractères maximum.'),
})

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>
