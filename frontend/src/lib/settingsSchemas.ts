import { z } from 'zod'

const emailField = z
  .string()
  .trim()
  .min(1, 'L’adresse email est requise.')
  .email('Saisissez une adresse email valide.')

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Indiquez votre nom complet.')
    .max(80, 'Le nom ne peut pas dépasser 80 caractères.'),
  email: emailField,
})

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Saisissez votre mot de passe actuel.'),
    newPassword: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    confirmPassword: z
      .string()
      .min(1, 'Confirmez votre nouveau mot de passe.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe ne correspondent pas.',
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'Le nouveau mot de passe doit être différent du précédent.',
  })

export type ProfileFormValues = z.infer<typeof profileSchema>
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>
