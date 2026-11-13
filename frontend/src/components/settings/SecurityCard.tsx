import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { AuthField } from '@/components/auth/AuthField'
import { SettingsCard } from '@/components/settings/SettingsCard'
import { getAuthErrorMessage } from '@/lib/authErrors'
import { passwordChangeSchema } from '@/lib/settingsSchemas'
import type { PasswordChangeFormValues } from '@/lib/settingsSchemas'
import { supabase } from '@/lib/supabase'

type SecurityCardProps = {
  user: User
}

type Feedback = {
  variant: 'error' | 'success'
  message: string
}

export function SecurityCard({ user }: SecurityCardProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setFeedback(null)

    if (!user.email) {
      setFeedback({
        variant: 'error',
        message: 'Aucune adresse email n’est associée à ce compte.',
      })
      return
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (verifyError) {
      setFeedback({
        variant: 'error',
        message: getAuthErrorMessage(verifyError),
      })
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      setFeedback({ variant: 'error', message: getAuthErrorMessage(error) })
      return
    }

    reset()
    setFeedback({
      variant: 'success',
      message: 'Votre mot de passe a bien été modifié.',
    })
    toast.success('Mot de passe mis à jour.')
  })

  return (
    <SettingsCard
      icon={ShieldCheck}
      title="Sécurité"
      description="Modifiez votre mot de passe. Une vérification du mot de passe actuel est requise."
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <AuthField
          label="Mot de passe actuel"
          icon={Lock}
          type="password"
          placeholder="••••••••••••"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField
            label="Nouveau mot de passe"
            icon={KeyRound}
            type="password"
            placeholder="••••••••••••"
            autoComplete="new-password"
            hint={
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                8 caractères minimum
              </span>
            }
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <AuthField
            label="Confirmer le mot de passe"
            icon={KeyRound}
            type="password"
            placeholder="••••••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        {feedback ? (
          <AuthAlert
            variant={feedback.variant}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        ) : null}

        <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            )}
            Mettre à jour le mot de passe
          </button>
        </div>
      </form>
    </SettingsCard>
  )
}
