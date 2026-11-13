import { z } from 'zod'

const emailField = z
  .string()
  .trim()
  .min(1, 'L’adresse email est requise.')
  .email('Saisissez une adresse email valide.')

const passwordField = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
})

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Indiquez votre nom complet.'),
    email: emailField,
    password: passwordField,
    confirmPassword: z
      .string()
      .min(1, 'Confirmez votre mot de passe.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe ne correspondent pas.',
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
