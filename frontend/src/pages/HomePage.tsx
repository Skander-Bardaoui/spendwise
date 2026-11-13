import { Link } from 'react-router-dom'
import {
  ArrowRight,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Tags,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { user } = useAuth()

  const metadataName = user?.user_metadata?.full_name
  const displayName =
    typeof metadataName === 'string' && metadataName.trim() !== ''
      ? metadataName
      : (user?.email ?? 'vous')

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
          Vue d'ensemble
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Bonjour, {displayName}.
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Votre espace SpendWise est prêt. Commencez par enregistrer vos
          dépenses du mois.
        </p>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Données isolées par RLS
          </span>
          <h2 className="mt-4 max-w-xl text-xl font-semibold tracking-tight sm:text-2xl">
            Suivez chaque dinar, sans effort.
          </h2>
          <p className="mt-2 max-w-lg text-sm text-emerald-100/80">
            Enregistrez une dépense en quelques secondes, filtrez votre
            historique par période, catégorie ou moyen de paiement.
          </p>
          <Link
            to="/expenses"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-500/30 transition-colors hover:bg-emerald-400 hover:text-emerald-950"
          >
            Ouvrir l'historique des dépenses
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          to="/expenses"
          className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ReceiptText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Gérer les dépenses
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Créer, modifier, filtrer et supprimer vos transactions.
          </p>
        </Link>

        <div className="rounded-2xl bg-white p-5 opacity-60 shadow-sm ring-1 ring-slate-100">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <PieChart className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Budgets
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Définir des plafonds et recevoir des alertes à 80 %.
          </p>
          <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Bientôt
          </span>
        </div>

        <div className="rounded-2xl bg-white p-5 opacity-60 shadow-sm ring-1 ring-slate-100">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <Tags className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Catégories
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Personnaliser vos catégories et leurs icônes.
          </p>
          <span className="mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Bientôt
          </span>
        </div>
      </div>
    </div>
  )
}
