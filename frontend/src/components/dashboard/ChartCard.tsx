import type { ReactNode } from 'react'

type ChartCardProps = {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className = '',
}: ChartCardProps) {
  return (
    <section
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-colors dark:bg-slate-900 dark:ring-slate-800 ${className}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  )
}
