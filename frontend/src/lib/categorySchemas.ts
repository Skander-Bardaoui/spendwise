import { z } from 'zod'

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Indiquez un nom de catégorie.')
    .max(40, '40 caractères maximum.'),
  icon: z.string().min(1, 'Choisissez une icône.'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Choisissez une couleur valide.'),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>
