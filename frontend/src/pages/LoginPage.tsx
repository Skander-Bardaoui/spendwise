import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { AuthField } from '@/components/auth/AuthField'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AuthTabs } from '@/components/auth/AuthTabs'
import { getAuthErrorMessage } from '@/lib/authErrors'
import { loginSchema } from '@/lib/authSchemas'
import type { LoginFormValues } from '@/lib/authSchemas'
import { supabase } from '@/lib/supabase'

type LoginLocationState = {
  from?: { pathname?: string }
  message?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LoginLocationState | null) ?? null

  const [authError, setAuthError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(
    state?.message ?? null,
  )

  const redirectTo =
    state?.from?.pathname && state.from.pathname !== '/logout'
      ? state.from.pathname
      : '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setAuthError(null)
    setInfoMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthError(getAuthErrorMessage(error))
      return
    }

    toast.success('Connexion réussie. Bienvenue !')
    navigate(redirectTo, { replace: true })
  })

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Bon retour parmi nous
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Connectez-vous à votre espace SpendWise pour suivre vos finances.
        </p>
      </div>

      <AuthTabs active="login" />

      {infoMessage && (
        <AuthAlert
          variant="success"
          message={infoMessage}
          onClose={() => setInfoMessage(null)}
        />
      )}
      {authError && (
        <AuthAlert
          variant="error"
          message={authError}
          onClose={() => setAuthError(null)}
        />
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
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
          autoComplete="current-password"
          hint={
            <span className="text-[11px] font-medium text-slate-400">
              8 caractères minimum
            </span>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Connexion…
            </>
          ) : (
            <>
              Se connecter à mon espace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Pas encore de compte ?{' '}
        <Link
          to="/register"
          className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline"
        >
          Créer un compte gratuitement
        </Link>
      </p>
    </AuthLayout>
  )
}
