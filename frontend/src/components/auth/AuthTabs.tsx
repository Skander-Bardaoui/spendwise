import { Link } from 'react-router-dom'

type AuthTabsProps = {
  active: 'login' | 'register'
}

const tabs = [
  { value: 'login', to: '/login', label: 'Se connecter' },
  { value: 'register', to: '/register', label: 'Créer un compte' },
] as const

export function AuthTabs({ active }: AuthTabsProps) {
  return (
    <div
      className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-center text-xs font-semibold dark:bg-slate-800"
      role="tablist"
      aria-label="Mode d’authentification"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === active

        return (
          <Link
            key={tab.value}
            to={tab.to}
            role="tab"
            aria-selected={isActive}
            className={`rounded-lg py-2.5 transition-colors ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white dark:shadow-none'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
