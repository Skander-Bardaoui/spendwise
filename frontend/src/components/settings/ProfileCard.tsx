import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Loader2, Mail, Save, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { AuthField } from '@/components/auth/AuthField'
import { SettingsCard } from '@/components/settings/SettingsCard'
import { getAuthErrorMessage } from '@/lib/authErrors'
import { profileSchema } from '@/lib/settingsSchemas'
import type { ProfileFormValues } from '@/lib/settingsSchemas'
import { supabase } from '@/lib/supabase'

type ProfileCardProps = {
  user: User
}

type Feedback = {
  variant: 'error' | 'success'
  message: string
}

function getMetadataName(user: User) {
  const value = user.user_metadata?.full_name
  return typeof value === 'string' ? value : ''
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: getMetadataName(user),
      email: user.email ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null)

    const nextEmail = values.email.trim().toLowerCase()
    const emailChanged = nextEmail !== (user.email ?? '').toLowerCase()

    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: values.fullName },
      ...(emailChanged ? { email: nextEmail } : {}),
    })

    if (error) {
      setFeedback({ variant: 'error', message: getAuthErrorMessage(error) })
      return
    }

    reset({ fullName: values.fullName, email: nextEmail })

    if (emailChanged) {
      setPendingEmail(nextEmail)
      setFeedback({
        variant: 'success',
        message: `Un lien de confirmation a été envoyé à ${nextEmail}. Votre adresse actuelle (${data.user?.email ?? user.email}) reste active jusqu’à validation.`,
      })
      toast.success('Demande de modification d’email envoyée.')
      return
    }

    setPendingEmail(null)
    setFeedback({
      variant: 'success',
      message: 'Vos informations personnelles ont été mises à jour.',
    })
    toast.success('Profil mis à jour.')
  })

  return (
    <SettingsCard
      icon={UserRound}
      title="Informations personnelles"
      description="Votre nom est affiché dans la barre latérale et sur votre profil."
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField
            label="Nom complet"
            icon={UserRound}
            type="text"
            placeholder="Sophie Laurent"
            autoComplete="name"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <AuthField
            label="Adresse email"
            icon={Mail}
            type="email"
            placeholder="sophie.laurent@exemple.fr"
            autoComplete="email"
            hint={
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Confirmation requise
              </span>
            }
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        {pendingEmail ? (
          <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            En attente de confirmation pour {pendingEmail}.
          </p>
        ) : null}

        {feedback ? (
          <AuthAlert
            variant={feedback.variant}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            La modification de l’email nécessite une confirmation par courriel.
          </p>
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            Enregistrer
          </button>
        </div>
      </form>
    </SettingsCard>
  )
}
