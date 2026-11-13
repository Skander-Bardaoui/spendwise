import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SettingsCard } from '@/components/settings/SettingsCard'
import { useTheme } from '@/components/theme/themeContext'
import type { ThemePreference } from '@/lib/theme'

const THEME_OPTIONS: Array<{
  value: ThemePreference
  label: string
  description: string
  icon: LucideIcon
}> = [
  {
    value: 'light',
    label: 'Clair',
    description: 'Interface lumineuse',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Sombre',
    description: 'Confort visuel',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Système',
    description: 'Suit votre appareil',
    icon: Monitor,
  },
]

export function AppearanceCard() {
  const { preference, setPreference } = useTheme()

  return (
    <SettingsCard
      icon={Palette}
      title="Apparence"
      description="Choisissez le thème de SpendWise. Le changement est immédiat."
    >
      <div
        role="radiogroup"
        aria-label="Thème de l’application"
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {THEME_OPTIONS.map((option) => {
          const isSelected = preference === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setPreference(option.value)}
              className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:ring-emerald-500/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-slate-600 dark:hover:bg-slate-800/70'
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                <option.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {option.label}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {option.description}
              </span>
              {isSelected ? (
                <Check
                  className="absolute right-3 top-3 h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
        Le choix est mémorisé sur cet appareil. Le mode Système suit le réglage
        clair/sombre de votre système d’exploitation.
      </p>
    </SettingsCard>
  )
}
