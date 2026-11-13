import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  PieChart,
  Plus,
  ReceiptText,
  Repeat2,
  Search,
  Settings,
  Tags,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Dépenses', icon: ReceiptText, end: false },
  { label: 'Récurrentes', icon: Repeat2, soon: true },
  { label: 'Budgets', icon: PieChart, soon: true },
  { label: 'Catégories', icon: Tags, soon: true },
  { label: 'Profil & Paramètres', icon: Settings, soon: true },
]

function getInitials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function AppLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const metadataName = user?.user_metadata?.full_name
  const displayName =
    typeof metadataName === 'string' && metadataName.trim() !== ''
      ? metadataName
      : (user?.email ?? 'Utilisateur')
  const initials = getInitials(displayName) || 'SW'

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const term = search.trim()
    navigate(term ? `/expenses?q=${encodeURIComponent(term)}` : '/expenses')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col justify-between bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
        <div className="flex min-h-0 flex-1 flex-col">
          <Link to="/" className="flex h-16 items-center gap-3 px-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SpendWise
            </span>
          </Link>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
            {NAV_ITEMS.map((item) =>
              item.soon ? (
                <span
                  key={item.label}
                  title="Bientôt disponible"
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 opacity-60"
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </span>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to!}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 font-semibold text-emerald-800 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>
        </div>

        <div className="mx-4 mb-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/logout"
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Se déconnecter
          </Link>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-4 bg-white/85 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-72 lg:px-8">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <Wallet className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">SpendWise</span>
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden max-w-md flex-1 md:block"
            role="search"
          >
            <div className="flex h-10 items-center gap-2 rounded-xl bg-slate-50 px-4 text-slate-500 ring-1 ring-slate-200 transition-colors focus-within:bg-white focus-within:ring-emerald-400">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une transaction..."
                aria-label="Rechercher une transaction"
                className="h-full flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <kbd className="hidden rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 lg:block">
                Entrée
              </kbd>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/expenses?nouvelle=1"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition-colors hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Nouvelle dépense</span>
            </Link>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 lg:hidden">
              {initials}
            </span>
          </div>
        </header>

        <main className="min-h-screen bg-slate-50 px-4 pb-24 pt-20 lg:px-8 lg:pb-12 lg:pt-24">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around bg-white px-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] lg:hidden">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-1 text-xs ${
              isActive ? 'font-semibold text-emerald-600' : 'text-slate-500'
            }`
          }
        >
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          Dashboard
        </NavLink>
        <NavLink
          to="/expenses"
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-1 text-xs ${
              isActive ? 'font-semibold text-emerald-600' : 'text-slate-500'
            }`
          }
        >
          <ReceiptText className="h-5 w-5" aria-hidden="true" />
          Dépenses
        </NavLink>
        <Link
          to="/expenses?nouvelle=1"
          aria-label="Ajouter une dépense"
          className="-mt-6 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Link>
        <span className="flex flex-1 cursor-not-allowed flex-col items-center gap-0.5 py-1 text-xs text-slate-300">
          <PieChart className="h-5 w-5" aria-hidden="true" />
          Budgets
        </span>
        <span className="flex flex-1 cursor-not-allowed flex-col items-center gap-0.5 py-1 text-xs text-slate-300">
          <Settings className="h-5 w-5" aria-hidden="true" />
          Profil
        </span>
      </nav>
    </div>
  )
}
