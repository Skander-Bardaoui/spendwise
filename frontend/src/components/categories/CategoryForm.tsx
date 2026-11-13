import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createElement } from 'react'
import {
  Check,
  Loader2,
  Tags,
  X,
} from 'lucide-react'
import {
  CATEGORY_COLOR_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  getCategoryColors,
  getCategoryIcon,
} from '@/lib/categoryIcons'
import { categoryFormSchema } from '@/lib/categorySchemas'
import type { CategoryFormValues } from '@/lib/categorySchemas'
import type { CategoryInput } from '@/services/categories'
import type { CategoryRow } from '@/types/database'

type CategoryFormProps = {
  category: CategoryRow | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (input: CategoryInput) => Promise<void>
}

const inputClass =
  'h-11 w-full rounded-xl bg-slate-50 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition-shadow placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500 dark:focus:bg-slate-800 dark:[color-scheme:dark]'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  )
}

export function CategoryForm({
  category,
  isSubmitting,
  onClose,
  onSubmit,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: category?.name ?? '',
      icon: category?.icon ?? 'tag',
      color: category?.color ?? '#64748B',
    },
  })

  const watchedName = useWatch({ control, name: 'name' })
  const watchedIcon = useWatch({ control, name: 'icon' })
  const watchedColor = useWatch({ control, name: 'color' })
  const previewColors = getCategoryColors(watchedColor)

  const submitForm = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name,
      icon: values.icon,
      color: values.color,
    })
  })

  return (
    <div className="flex max-h-[92dvh] flex-col">
      <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Tags className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="category-modal-title"
              className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            >
              {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Personnalisez le nom, l'icône et la couleur.
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
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: previewColors.background,
              color: previewColors.text,
            }}
          >
            {createElement(getCategoryIcon(watchedIcon), {
              className: 'h-5 w-5',
              'aria-hidden': true,
            })}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Aperçu
            </p>
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {watchedName?.trim() || 'Nom de la catégorie'}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="category-name"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Nom
          </label>
          <input
            id="category-name"
            type="text"
            placeholder="Ex. Animaux, Éducation, Cadeaux..."
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
            {...register('name')}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Icône
          </span>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <div className="grid grid-cols-4 gap-2">
                {CATEGORY_ICON_OPTIONS.map((option) => {
                  const selected = field.value === option.value
                  const Icon = getCategoryIcon(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      aria-pressed={selected}
                      title={option.label}
                      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[10px] font-semibold transition-all ${
                        selected
                          ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {option.label}
                    </button>
                  )
                })}
              </div>
            )}
          />
          <FieldError message={errors.icon?.message} />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Couleur
          </span>
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLOR_OPTIONS.map((color) => {
                  const selected = field.value.toLowerCase() === color.toLowerCase()
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      aria-label={`Couleur ${color}`}
                      aria-pressed={selected}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-transform ${
                        selected
                          ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-900'
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {selected && (
                        <Check
                          className="h-4 w-4 text-white"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          />
          <FieldError message={errors.color?.message} />
        </div>

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
            {category ? 'Enregistrer' : 'Créer la catégorie'}
          </button>
        </div>
      </form>
    </div>
  )
}
