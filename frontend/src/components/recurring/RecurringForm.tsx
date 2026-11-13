import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarDays,
  Check,
  Loader2,
  Repeat2,
  Store,
  X,
} from 'lucide-react'
import { TODAY_ISO } from '@/lib/format'
import { recurringFormSchema } from '@/lib/recurringSchemas'
import type { RecurringFormValues } from '@/lib/recurringSchemas'
import type { RecurringInput } from '@/services/recurring'
import type { CategoryRow } from '@/types/database'

type RecurringFormProps = {
  categories: CategoryRow[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (input: RecurringInput) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl bg-slate-50 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition-shadow placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:[color-scheme:dark]'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
    >
      {message}
    </p>
  )
}

export function RecurringForm({
  categories,
  isSubmitting,
  onClose,
  onSubmit,
}: RecurringFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RecurringFormValues>({
    resolver: zodResolver(recurringFormSchema),
    mode: 'onTouched',
    defaultValues: {
      amount: '',
      merchant: '',
      categoryId: '',
      frequency: 'monthly',
      nextDate: TODAY_ISO,
    },
  })

  const submitForm = handleSubmit(async (values) => {
    await onSubmit({
      merchant: values.merchant,
      amount: Number(values.amount.replace(',', '.')),
      category_id: values.categoryId,
      frequency: values.frequency,
      next_date: values.nextDate,
    })
  })

  return (
    <div className="flex max-h-[92dvh] flex-col dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Repeat2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="recurring-modal-title"
              className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              Nouvelle récurrence
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Loyer, abonnement, assurance… généré automatiquement.
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
        <div>
          <label
            htmlFor="recurring-merchant"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Commerçant / Bénéficiaire
          </label>
          <div className="relative">
            <Store
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            />
            <input
              id="recurring-merchant"
              type="text"
              placeholder="Ex. Loyer, Netflix, assurance..."
              aria-invalid={Boolean(errors.merchant)}
              className={`${inputClass} pl-9`}
              {...register('merchant')}
            />
          </div>
          <FieldError message={errors.merchant?.message} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="recurring-amount"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Montant
            </label>
            <div className="relative">
              <input
                id="recurring-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                aria-invalid={Boolean(errors.amount)}
                className={`${inputClass} pr-14`}
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
              htmlFor="recurring-next-date"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Prochaine échéance
            </label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              <input
                id="recurring-next-date"
                type="date"
                min={TODAY_ISO}
                aria-invalid={Boolean(errors.nextDate)}
                className={`${inputClass} pl-9`}
                {...register('nextDate')}
              />
            </div>
            <FieldError message={errors.nextDate?.message} />
          </div>
        </div>

        <div>
          <label
            htmlFor="recurring-category"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Catégorie
          </label>
          {categories.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              Aucune catégorie disponible.
            </p>
          ) : (
            <select
              id="recurring-category"
              aria-invalid={Boolean(errors.categoryId)}
              className={inputClass}
              {...register('categoryId')}
            >
              <option value="">Choisir une catégorie…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          <FieldError message={errors.categoryId?.message} />
        </div>

        <div>
          <span className="mb-2 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Fréquence
          </span>
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'monthly', label: 'Chaque mois' },
                  { value: 'weekly', label: 'Chaque semaine' },
                ].map((option) => {
                  const selected = field.value === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        field.onChange(
                          option.value as RecurringFormValues['frequency'],
                        )
                      }
                      aria-pressed={selected}
                      className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                        selected
                          ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            )}
          />
          <FieldError message={errors.frequency?.message} />
        </div>

        <div className="-mx-6 -mb-4 mt-1 flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
            Créer la récurrence
          </button>
        </div>
      </form>
    </div>
  )
}
