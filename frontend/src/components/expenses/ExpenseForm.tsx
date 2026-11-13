import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CalendarDays,
  Check,
  Loader2,
  Pencil,
  PlusCircle,
  StickyNote,
  Store,
  X,
} from 'lucide-react'
import { getCategoryColors, getCategoryIcon } from '@/lib/categoryIcons'
import { expenseFormSchema } from '@/lib/expenseSchemas'
import type { ExpenseFormValues } from '@/lib/expenseSchemas'
import { TODAY_ISO } from '@/lib/format'
import { PAYMENT_METHODS } from '@/lib/paymentMethods'
import type { ExpenseInput } from '@/services/expenses'
import type { CategoryRow, ExpenseWithCategory } from '@/types/database'

type ExpenseFormProps = {
  categories: CategoryRow[]
  expense: ExpenseWithCategory | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (input: ExpenseInput) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl bg-slate-50 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition-shadow placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-400'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-red-600">
      {message}
    </p>
  )
}

export function ExpenseForm({
  categories,
  expense,
  isSubmitting,
  onClose,
  onSubmit,
}: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    mode: 'onTouched',
    defaultValues: {
      amount: expense ? String(expense.amount).replace('.', ',') : '',
      expenseDate: expense?.expense_date ?? TODAY_ISO,
      merchant: expense?.merchant ?? '',
      categoryId: expense?.category_id ?? '',
      paymentMethod: expense?.payment_method ?? 'card',
      note: expense?.note ?? '',
    },
  })

  const noteLength = (useWatch({ control, name: 'note' }) ?? '').length
  const isEditing = Boolean(expense)

  const submitForm = handleSubmit(async (values) => {
    await onSubmit({
      merchant: values.merchant,
      amount: Number(values.amount.replace(',', '.')),
      expense_date: values.expenseDate,
      category_id: values.categoryId,
      payment_method: values.paymentMethod,
      note: values.note.trim() ? values.note.trim() : null,
    })
  })

  return (
    <div className="flex max-h-[92dvh] flex-col">
      <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-emerald-600">
            {isEditing ? (
              <Pencil className="h-5 w-5" aria-hidden="true" />
            ) : (
              <PlusCircle className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="expense-modal-title"
                className="text-xl font-semibold tracking-tight text-slate-900"
              >
                {isEditing ? 'Modifier la dépense' : 'Nouvelle dépense'}
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                {isEditing ? 'Modification' : 'Édition rapide'}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              Saisissez les informations de paiement.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <form
        onSubmit={submitForm}
        noValidate
        className="flex flex-col gap-4 overflow-y-auto px-6 py-4"
      >
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          <label
            htmlFor="expense-amount"
            className="text-[10px] font-semibold uppercase tracking-wider text-slate-500"
          >
            Montant de la dépense
          </label>
          <div className="mt-1 flex items-center justify-center gap-2">
            <input
              id="expense-amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              aria-invalid={Boolean(errors.amount)}
              className="w-full max-w-[240px] bg-transparent text-center text-4xl font-bold tracking-tight text-emerald-600 outline-none placeholder:text-slate-300"
              {...register('amount')}
            />
            <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
              TND
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Montant débité immédiatement sur votre solde
          </p>
          <FieldError message={errors.amount?.message} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="expense-date"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Date de l'opération
            </label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="expense-date"
                type="date"
                max={TODAY_ISO}
                aria-invalid={Boolean(errors.expenseDate)}
                className={`${inputClass} pl-9`}
                {...register('expenseDate')}
              />
            </div>
            <FieldError message={errors.expenseDate?.message} />
          </div>

          <div>
            <label
              htmlFor="expense-merchant"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Commerçant / Bénéficiaire
            </label>
            <div className="relative">
              <Store
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="expense-merchant"
                type="text"
                placeholder="Ex. Monoprix, SNCF, Starbucks..."
                aria-invalid={Boolean(errors.merchant)}
                className={`${inputClass} pl-9`}
                {...register('merchant')}
              />
            </div>
            <FieldError message={errors.merchant?.message} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Catégorie budgétaire
            </span>
            <span className="text-[11px] font-medium text-emerald-600">
              Obligatoire
            </span>
          </div>

          {categories.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
              Aucune catégorie disponible. Vérifiez que la migration SQL a bien
              été exécutée.
            </p>
          ) : (
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {categories.map((category) => {
                    const CategoryIcon = getCategoryIcon(category.icon)
                    const colors = getCategoryColors(category.color)
                    const selected = field.value === category.id

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() =>
                          field.onChange(selected ? '' : category.id)
                        }
                        aria-pressed={selected}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-center transition-all ${
                          selected
                            ? 'bg-emerald-50 ring-2 ring-emerald-400'
                            : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: colors.background,
                            color: colors.text,
                          }}
                        >
                          <CategoryIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="w-full truncate text-[11px] font-semibold text-slate-700">
                          {category.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            />
          )}
          <FieldError message={errors.categoryId?.message} />
        </div>

        <div>
          <span className="mb-2 block text-xs font-semibold text-slate-700">
            Moyen de règlement
          </span>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon
                  const selected = field.value === method.value
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => field.onChange(method.value)}
                      aria-pressed={selected}
                      className={`flex items-center gap-2 rounded-xl p-2.5 text-left transition-all ${
                        selected
                          ? 'bg-slate-200 ring-1 ring-slate-300'
                          : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          selected ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate text-xs font-medium text-slate-700">
                        {method.shortLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          />
          <FieldError message={errors.paymentMethod?.message} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="expense-note"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            >
              <StickyNote className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              Note / Contexte{' '}
              <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <span className="text-[11px] text-slate-400">{noteLength}/150</span>
          </div>
          <textarea
            id="expense-note"
            rows={2}
            placeholder="Ex. Ravitaillement semaine, dîner professionnel..."
            aria-invalid={Boolean(errors.note)}
            className="w-full resize-none rounded-xl bg-slate-50 p-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition-shadow placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-400"
            {...register('note')}
          />
          <FieldError message={errors.note?.message} />
        </div>

        <div className="-mx-6 -mb-4 mt-1 flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60"
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
            {isSubmitting
              ? 'Enregistrement...'
              : isEditing
                ? 'Enregistrer les modifications'
                : 'Enregistrer la dépense'}
          </button>
        </div>
      </form>
    </div>
  )
}
