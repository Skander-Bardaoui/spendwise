import type { User } from '@supabase/supabase-js'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
} from 'lucide-react'
import { getInitials, getUserDisplayName } from '@/lib/user'

type AccountSummaryProps = {
  user: User
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return format(parseISO(value), 'd MMMM yyyy', { locale: fr })
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return format(parseISO(value), 'd MMM yyyy à HH:mm', { locale: fr })
}

export function AccountSummary({ user }: AccountSummaryProps) {
  const displayName = getUserDisplayName(user)
  const initials = getInitials(displayName) || 'SW'
  const emailConfirmed = Boolean(user.email_confirmed_at)

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-2xl font-bold text-white shadow-lg shadow-emerald-500/25">
          {initials}
        </span>
        <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
          {displayName}
        </h2>
        <p className="mt-0.5 break-all text-xs text-slate-500 dark:text-slate-400">
          {user.email}
        </p>
        <span
          className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            emailConfirmed
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
          }`}
        >
          {emailConfirmed ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {emailConfirmed ? 'Email confirmé' : 'Email non confirmé'}
        </span>
      </div>

      <dl className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
        <div className="flex items-start gap-2.5">
          <Mail
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <dt className="font-medium text-slate-500 dark:text-slate-400">
              Adresse email
            </dt>
            <dd className="mt-0.5 break-all font-semibold text-slate-700 dark:text-slate-300">
              {user.email}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Calendar
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">
              Compte créé le
            </dt>
            <dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-300">
              {formatDate(user.created_at)}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Clock
            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <div>
            <dt className="font-medium text-slate-500 dark:text-slate-400">
              Dernière connexion
            </dt>
            <dd className="mt-0.5 font-semibold text-slate-700 dark:text-slate-300">
              {formatDateTime(user.last_sign_in_at)}
            </dd>
          </div>
        </div>
      </dl>
    </section>
  )
}
