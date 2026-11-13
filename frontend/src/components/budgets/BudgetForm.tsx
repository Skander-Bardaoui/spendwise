import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarRange,
  Check,
  Loader2,
  PieChart,
  Wallet,
  X,
} from 'lucide-react'
import { budgetFormSchema } from '@/lib/budgetSchemas'
import type { BudgetFormValues } from '@/lib/budgetSchemas'
import type { BudgetInput } from '@/services/budgets'
import type { BudgetStatusRow, CategoryRow } from '@/types/database'

type BudgetFormProps = {
  budget: BudgetStatusRow | null
  categories: CategoryRow[]
  monthLabel: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (input: BudgetInput) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl bg-slate-50 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition-shadow placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-400 disabled:opacity-60 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:[color-scheme:dark]'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  )
}

export function BudgetForm({
  budget,
  categories,
  monthLabel,
  isSubmitting,
  onClose,
  onSubmit,
}: BudgetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    mode: 'onTouched',
    defaultValues: {
      categoryId: budget?.category_id ?? '',
      amount: budget
        ? String(budget.amount_limit).replace('.', ',')
        : '',
      alertThreshold: budget ? String(budget.alert_threshold) : '80',
    },
  })

  const submitForm = handleSubmit(async (values) => {
    await onSubmit({
      category_id: values.categoryId || null,
      amount_limit: Number(values.amount.replace(',', '.')),
      alert_threshold: Number(values.alertThreshold),
    })
  })

  return (
    <div className="flex max-h-[92dvh] flex-col">
      <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <PieChart className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="budget-modal-title"
              className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              {budget ? 'Modifier le budget' : 'Nouveau budget'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Définissez un plafond mensuel et un seuil d'alerte.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form
        onSubmit={submitForm}
        noValidate
        className="flex flex-col gap-4 overflow-y-auto px-6 py-4"
      >
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <CalendarRange
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          Mois concerné :
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {monthLabel}
          </span>
        </div>

        <div>
          <label
            htmlFor="budget-category"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Périmètre
          </label>
          <select
            id="budget-category"
            disabled={Boolean(budget)}
            className={inputClass}
            {...register('categoryId')}
          >
            <option value="">Budget global (toutes catégories)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {budget && (
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Le périmètre et le mois ne peuvent pas être modifiés.
            </p>
          )}
          <FieldError message={errors.categoryId?.message} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="budget-amount"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Limite mensuelle
            </label>
            <div className="relative">
              <Wallet
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <input
                id="budget-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                aria-invalid={Boolean(errors.amount)}
                className={`${inputClass} pl-9 pr-14`}
                {...register('amount')}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                TND
              </span>
            </div>
            <FieldError message={errors.amount?.message} />
          </div>

          <div>
            <label
              htmlFor="budget-threshold"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Seuil d'alerte
            </label>
            <div className="relative">
              <input
                id="budget-threshold"
                type="number"
                min={0}
                max={100}
                step={1}
                aria-invalid={Boolean(errors.alertThreshold)}
                className={`${inputClass} pr-10`}
                {...register('alertThreshold')}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                %
              </span>
            </div>
            <FieldError message={errors.alertThreshold?.message} />
          </div>
        </div>

        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          Une alerte s'affiche dès que les dépenses atteignent ce pourcentage
          de la limite, puis lorsque le budget est dépassé.
        </p>

        <div className="-mx-6 -mb-4 mt-1 flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-500/20 transition-colors hover:bg-emerald-600 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            {budget ? 'Enregistrer' : 'Créer le budget'}
          </button>
        </div>
      </form>
    </div>
  )
}
