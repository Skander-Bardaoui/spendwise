import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Lock, LockKeyhole, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { AuthField } from '@/components/auth/AuthField'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthTabs } from '@/components/auth/AuthTabs'
import { getAuthErrorMessage } from '@/lib/authErrors'
import { registerSchema } from '@/lib/authSchemas'
import type { RegisterFormValues } from '@/lib/authSchemas'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setAuthError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setAuthError(getAuthErrorMessage(error))
      return
    }

    if (data.session) {
      toast.success('Compte créé. Bienvenue sur SpendWise !')
      navigate('/', { replace: true })
      return
    }

    toast.success('Compte créé. Consultez votre boîte mail.')
    navigate('/login', {
      replace: true,
      state: {
        message:
          'Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.',
      },
    })
  })

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Créer un compte SpendWise
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Commencez à optimiser vos dépenses en moins de 2 minutes.
        </p>
      </div>

      <AuthTabs active="register" />

      {authError && (
        <AuthAlert
          variant="error"
          message={authError}
          onClose={() => setAuthError(null)}
        />
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <AuthField
          label="Nom complet"
          icon={User}
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
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthField
          label="Mot de passe"
          icon={Lock}
          type="password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          hint={
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              8 caractères minimum
            </span>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <AuthField
          label="Confirmer le mot de passe"
          icon={LockKeyhole}
          type="password"
          placeholder="••••••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 dark:focus-visible:ring-offset-slate-900"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Création du compte…
            </>
          ) : (
            <>
              Créer mon compte gratuitement
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Vous avez déjà un compte ?{' '}
        <Link
          to="/login"
          className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  )
}
