import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type SettingsCardProps = {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
}

export function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: SettingsCardProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:shadow-none dark:ring-slate-800">
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  )
}
