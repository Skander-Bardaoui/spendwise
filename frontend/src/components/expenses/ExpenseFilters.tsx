import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import { getMonthBounds, TODAY_ISO } from '@/lib/format'
import { PAYMENT_METHODS } from '@/lib/paymentMethods'
import type {
  ExpenseFilters as ExpenseFiltersValue,
  ExpenseSortField,
} from '@/services/expenses'
import type { CategoryRow, PaymentMethod } from '@/types/database'

type ExpenseFiltersProps = {
  filters: ExpenseFiltersValue
  categories: CategoryRow[]
  onChange: (patch: Partial<ExpenseFiltersValue>) => void
  onReset: () => void
  onSortDirectionToggle: () => void
}

const currentMonth = getMonthBounds(0)
const lastMonth = getMonthBounds(-1)
const currentYear = TODAY_ISO.slice(0, 4)

const PERIOD_PRESETS = [
  { key: 'month', label: 'Ce mois-ci', from: currentMonth.from, to: currentMonth.to },
  { key: 'last', label: 'Mois dernier', from: lastMonth.from, to: lastMonth.to },
  { key: 'year', label: 'Cette année', from: `${currentYear}-01-01`, to: TODAY_ISO },
  { key: 'all', label: 'Tout', from: null, to: null },
] as const

const SORT_OPTIONS: Array<{ value: ExpenseSortField; label: string }> = [
  { value: 'expense_date', label: 'Date' },
  { value: 'amount', label: 'Montant' },
  { value: 'merchant', label: 'Commerçant' },
]

const fieldClass =
  'h-9 w-full rounded-lg bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none ring-1 ring-slate-200 transition-shadow focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700'
const labelClass =
  'mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400'

function parseNumberInput(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function ExpenseFilters({
  filters,
  categories,
  onChange,
  onReset,
  onSortDirectionToggle,
}: ExpenseFiltersProps) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            placeholder="Rechercher un commerçant, un mot-clé ou une note..."
            aria-label="Rechercher une dépense"
            className="h-11 w-full rounded-xl bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition-shadow placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: '' })}
              aria-label="Effacer la recherche"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center justify-center gap-1.5 self-end rounded-lg px-3 text-xs font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 lg:self-auto"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Réinitialiser
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {PERIOD_PRESETS.map((preset) => {
          const isActive =
            filters.dateFrom === preset.from && filters.dateTo === preset.to
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() =>
                onChange({ dateFrom: preset.from, dateTo: preset.to })
              }
              className={`h-8 shrink-0 rounded-full px-3 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div>
          <label htmlFor="filter-category" className={labelClass}>
            Catégorie
          </label>
          <div className="relative">
            <select
              id="filter-category"
              value={filters.categoryId ?? ''}
              onChange={(event) =>
                onChange({ categoryId: event.target.value || null })
              }
              className={`${fieldClass} appearance-none pr-7`}
            >
              <option value="">Toutes</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter-payment" className={labelClass}>
            Paiement
          </label>
          <div className="relative">
            <select
              id="filter-payment"
              value={filters.paymentMethod ?? ''}
              onChange={(event) =>
                onChange({
                  paymentMethod: (event.target.value || null) as PaymentMethod | null,
                })
              }
              className={`${fieldClass} appearance-none pr-7`}
            >
              <option value="">Tous</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
          </div>
        </div>

        <div>
          <label htmlFor="filter-date-from" className={labelClass}>
            Du
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={filters.dateFrom ?? ''}
            max={filters.dateTo ?? undefined}
            onChange={(event) =>
              onChange({ dateFrom: event.target.value || null })
            }
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="filter-date-to" className={labelClass}>
            Au
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={filters.dateTo ?? ''}
            min={filters.dateFrom ?? undefined}
            onChange={(event) =>
              onChange({ dateTo: event.target.value || null })
            }
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="filter-min" className={labelClass}>
            Montant min (TND)
          </label>
          <input
            id="filter-min"
            type="number"
            min="0"
            step="0.001"
            inputMode="decimal"
            value={filters.minAmount ?? ''}
            onChange={(event) =>
              onChange({ minAmount: parseNumberInput(event.target.value) })
            }
            placeholder="0"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="filter-max" className={labelClass}>
            Montant max (TND)
          </label>
          <input
            id="filter-max"
            type="number"
            min="0"
            step="0.001"
            inputMode="decimal"
            value={filters.maxAmount ?? ''}
            onChange={(event) =>
              onChange({ maxAmount: parseNumberInput(event.target.value) })
            }
            placeholder="—"
            className={fieldClass}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <label
            htmlFor="filter-sort"
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            Trier par
          </label>
          <div className="relative">
            <select
              id="filter-sort"
              value={filters.sortBy}
              onChange={(event) =>
                onChange({
                  sortBy: event.target.value as ExpenseSortField,
                })
              }
              className={`${fieldClass} h-8 w-auto appearance-none pr-7`}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
          </div>
          <button
            type="button"
            onClick={onSortDirectionToggle}
            aria-label={
              filters.sortDirection === 'asc'
                ? 'Trier par ordre décroissant'
                : 'Trier par ordre croissant'
            }
            title={
              filters.sortDirection === 'asc'
                ? 'Ordre décroissant'
                : 'Ordre croissant'
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            {filters.sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {filters.dateFrom || filters.dateTo
            ? 'Période personnalisée possible via les champs Du / Au'
            : 'Toutes les dépenses'}
        </span>
      </div>
    </section>
  )
}
