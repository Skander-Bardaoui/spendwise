import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { getAuthErrorMessage } from '@/lib/authErrors'
import { supabase } from '@/lib/supabase'

export default function LogoutPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const logout = async () => {
      const { error: signOutError } = await supabase.auth.signOut()

      if (!isMounted) return

      if (signOutError) {
        setError(getAuthErrorMessage(signOutError))
        return
      }

      toast.success('Vous êtes déconnecté.')
      navigate('/login', { replace: true })
    }

    void logout()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          {error ? (
            <LogOut className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
          )}
        </div>

        <h1 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          {error ? 'Déconnexion impossible' : 'Déconnexion en cours…'}
        </h1>

        {error ? (
          <>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
            <Link
              to="/"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Retour à l’accueil
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Fermeture sécurisée de votre session.
          </p>
        )}
      </div>
    </main>
  )
}
