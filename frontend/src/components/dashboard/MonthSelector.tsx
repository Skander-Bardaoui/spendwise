import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  formatMonthLabel,
  getCurrentMonthISO,
  shiftMonthISO,
} from '@/lib/format'

type MonthSelectorProps = {
  value: string
  onChange: (month: string) => void
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const currentMonth = getCurrentMonthISO()
  const isCurrent = value === currentMonth
  const isAtMax = value >= currentMonth

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <button
          type="button"
          onClick={() => onChange(shiftMonthISO(value, -1))}
          aria-label="Mois précédent"
          className="flex h-10 w-9 items-center justify-center rounded-l-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1.5 border-x border-slate-100 px-2 dark:border-slate-800">
          <CalendarDays
            className="h-4 w-4 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <label htmlFor="dashboard-month" className="sr-only">
            Mois affiché — {formatMonthLabel(value)}
          </label>
          <input
            id="dashboard-month"
            type="month"
            value={value.slice(0, 7)}
            max={currentMonth.slice(0, 7)}
            onChange={(event) => {
              if (event.target.value) {
                onChange(`${event.target.value}-01`)
              }
            }}
            className="h-10 w-[132px] bg-transparent text-sm font-medium text-slate-700 outline-none [color-scheme:light] dark:text-slate-200 dark:[color-scheme:dark]"
          />
        </div>

        <button
          type="button"
          onClick={() => onChange(shiftMonthISO(value, 1))}
          disabled={isAtMax}
          aria-label="Mois suivant"
          className="flex h-10 w-9 items-center justify-center rounded-r-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {!isCurrent ? (
        <button
          type="button"
          onClick={() => onChange(currentMonth)}
          className="h-10 rounded-xl bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
        >
          Ce mois-ci
        </button>
      ) : null}
    </div>
  )
}
