import type { ReactNode } from 'react'
import {
  BadgeCheck,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'

type AuthLayoutProps = {
  children: ReactNode
}

const currentYear = new Date().getFullYear()

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white dark:bg-slate-950 lg:flex-row">
      <aside className="relative hidden w-[52%] flex-col gap-8 overflow-hidden bg-gradient-to-br from-slate-950 via-[#06241a] to-slate-900 p-12 text-white lg:flex xl:w-[54%] xl:p-16">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-1/2 h-[420px] w-[420px] rounded-full bg-emerald-600/15 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] opacity-40 [background-size:24px_24px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/30">
              <Wallet className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 text-2xl font-bold tracking-tight text-white">
                SpendWise
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs font-medium tracking-wide text-emerald-300/80">
                Maîtrisez chaque dépense, simplement
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-4 py-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/[0.09]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Économies réalisées ce mois
                </span>
              </div>
              <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                +18,4 %
              </span>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-white">
                  +342,100 TND
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  vs mois précédent (288,500 TND)
                </p>
              </div>
              <div className="h-9 w-28">
                <svg
                  className="h-full w-full fill-none stroke-emerald-400"
                  viewBox="0 0 100 30"
                  aria-hidden="true"
                >
                  <path
                    d="M0,25 Q15,22 28,16 T55,14 T80,6 T100,2"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  <circle className="fill-emerald-400" cx="100" cy="2" r="3.5" />
                </svg>
              </div>
            </div>
          </div>

          <div className="ml-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-black/30 backdrop-blur-xl transition-all hover:bg-white/[0.08]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
                  <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  Budget Alimentation &amp; Courses
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-300">
                84 % utilisé
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-300" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>420 TND dépensés sur 500 TND</span>
              <span className="flex items-center gap-1 font-medium text-emerald-400">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Dans la cible
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-3.5 shadow-lg shadow-black/20 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-bold text-slate-900 shadow dark:bg-slate-800 dark:text-slate-100">
                M
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Monoprix Madeleine
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>Aujourd’hui, 14:28</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 font-medium text-emerald-400">
                    <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                    Reçu validé
                  </span>
                </p>
              </div>
            </div>
            <p className="text-sm font-bold tracking-tight text-white">
              -45,900 TND
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6 border-t border-white/10 pt-4">
          <div className="flex items-start gap-3.5 rounded-xl border border-white/5 bg-white/[0.04] p-4 backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-sm font-bold text-emerald-200 ring-2 ring-emerald-400/40">
              SL
            </div>
            <div className="flex-1 text-xs">
              <div
                className="mb-1 flex items-center gap-1 text-amber-400"
                aria-label="Note de 5 étoiles sur 5"
              >
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star
                    key={star}
                    className="h-3.5 w-3.5 fill-amber-400"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="italic leading-relaxed text-slate-200">
                « SpendWise m’a permis d’économiser plus de 240 TND dès le
                premier mois, sans contrainte. »
              </p>
              <span className="mt-1 block font-medium text-slate-400">
                Sophie Laurent — Paris
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <LockKeyhole
                className="h-3.5 w-3.5 text-emerald-400"
                aria-hidden="true"
              />
              Chiffrement AES-256
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck
                className="h-3.5 w-3.5 text-emerald-400"
                aria-hidden="true"
              />
              Données isolées par utilisateur
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck
                className="h-3.5 w-3.5 text-emerald-400"
                aria-hidden="true"
              />
              Conforme RGPD
            </span>
          </div>
        </div>
      </aside>

      <section className="flex min-h-screen w-full flex-col justify-between bg-white p-6 dark:bg-slate-900 sm:p-10 lg:w-[48%] lg:p-12 xl:w-[46%] xl:p-16">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              SpendWise
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <LockKeyhole
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <span>Connexion sécurisée</span>
          </div>
        </div>

        <div className="mx-auto my-auto w-full max-w-[440px] py-2">
          {children}
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-6 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {currentYear} SpendWise. Tous droits réservés.</span>
          <span>Données chiffrées · Conforme RGPD</span>
        </footer>
      </section>
    </div>
  )
}
