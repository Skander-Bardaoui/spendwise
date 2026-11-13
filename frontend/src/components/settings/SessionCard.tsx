import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Loader2, LogOut, MonitorSmartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { SettingsCard } from '@/components/settings/SettingsCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getAuthErrorMessage } from '@/lib/authErrors'
import { supabase } from '@/lib/supabase'

type SessionCardProps = {
  user: User
}

function formatLastSignIn(value: string | null | undefined) {
  if (!value) return '—'
  return format(parseISO(value), 'd MMM yyyy à HH:mm', { locale: fr })
}

export function SessionCard({ user }: SessionCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const handleSignOutOthers = async () => {
    setPending(true)
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    setPending(false)

    if (error) {
      toast.error(getAuthErrorMessage(error))
      return
    }

    setConfirmOpen(false)
    toast.success('Les autres appareils ont été déconnectés.')
  }

  return (
    <>
      <SettingsCard
        icon={MonitorSmartphone}
        title="Session et appareils"
        description="Contrôlez les appareils connectés à votre compte."
      >
        <dl className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-800/60 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">
              Compte
            </dt>
            <dd className="mt-0.5 break-all font-semibold text-slate-800 dark:text-slate-200">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">
              Dernière connexion
            </dt>
            <dd className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
              {formatLastSignIn(user.last_sign_in_at)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <MonitorSmartphone className="h-4 w-4" aria-hidden="true" />
            Déconnecter les autres appareils
          </button>
          <Link
            to="/logout"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Se déconnecter
          </Link>
        </div>

        {pending ? (
          <p className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Déconnexion des autres sessions…
          </p>
        ) : null}
      </SettingsCard>

      <ConfirmDialog
        open={confirmOpen}
        title="Déconnecter les autres appareils ?"
        description="Toutes les sessions actives, sauf celle-ci, seront fermées. Vous devrez vous reconnecter sur ces appareils."
        confirmLabel="Déconnecter"
        pending={pending}
        onConfirm={() => void handleSignOutOthers()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
