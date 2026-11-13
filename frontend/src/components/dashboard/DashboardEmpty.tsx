import type { ReactNode } from 'react'

type DashboardEmptyProps = {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

export function DashboardEmpty({
  icon,
  title,
  description,
  className = 'h-[240px]',
}: DashboardEmptyProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 text-center dark:border-slate-700 ${className}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        {icon}
      </span>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {title}
      </p>
      <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}
