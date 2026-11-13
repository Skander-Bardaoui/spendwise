import { AccountSummary } from '@/components/settings/AccountSummary'
import { AppearanceCard } from '@/components/settings/AppearanceCard'
import { ProfileCard } from '@/components/settings/ProfileCard'
import { SecurityCard } from '@/components/settings/SecurityCard'
import { SessionCard } from '@/components/settings/SessionCard'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Mon compte
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Profil & paramètres
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gérez vos informations personnelles, votre sécurité et l’apparence de
          SpendWise.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <AccountSummary user={user} />
        </div>

        <div className="space-y-5">
          <ProfileCard user={user} />
          <AppearanceCard />
          <SecurityCard user={user} />
          <SessionCard user={user} />
        </div>
      </div>
    </div>
  )
}
