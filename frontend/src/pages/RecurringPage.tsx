import { createElement, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  Loader2,
  Pause,
  Plus,
  RefreshCw,
  Repeat2,
} from 'lucide-react'
import { toast } from 'sonner'
import { RecurringForm } from '@/components/recurring/RecurringForm'
import { Modal } from '@/components/ui/Modal'
import { useCategories } from '@/hooks/useCategories'
import {
  useCreateRecurringExpense,
  useRecurringExpenses,
  useToggleRecurringExpense,
} from '@/hooks/useRecurring'
import { getCategoryColors, getCategoryIcon } from '@/lib/categoryIcons'
import { formatCurrency, formatExpenseDate } from '@/lib/format'
import type { RecurringInput } from '@/services/recurring'
import type {
  RecurringExpenseWithCategory,
  RecurringFrequency,
} from '@/types/database'

function frequencyLabel(frequency: RecurringFrequency) {
  return frequency === 'weekly' ? 'Chaque semaine' : 'Chaque mois'
}

type RecurringCardProps = {
  rule: RecurringExpenseWithCategory
  isPending: boolean
  onToggle: (rule: RecurringExpenseWithCategory) => void
}

function RecurringCard({ rule, isPending, onToggle }: RecurringCardProps) {
  const colors = getCategoryColors(rule.category?.color ?? null)

  return (
    <article
      className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-opacity dark:bg-slate-900 dark:ring-slate-800 ${
        rule.active ? '' : 'opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: colors.background, color: colors.text }}
          >
            {createElement(getCategoryIcon(rule.category?.icon ?? null), {
              className: 'h-5 w-5',
              'aria-hidden': true,
            })}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {rule.merchant}
            </h3>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {rule.category?.name ?? 'Sans catégorie'} ·{' '}
              {frequencyLabel(rule.frequency)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatCurrency(rule.amount)}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={rule.active}
            aria-label={
              rule.active
                ? `Mettre en pause ${rule.merchant}`
                : `Réactiver ${rule.merchant}`
            }
            disabled={isPending}
            onClick={() => onToggle(rule)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
              rule.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-slate-100 ${
                rule.active ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          {rule.active ? (
            <>
              <CalendarClock
                className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              Prochaine échéance :{' '}
              <strong className="font-semibold text-slate-700 dark:text-slate-200">
                {formatExpenseDate(rule.next_date)}
              </strong>
            </>
          ) : (
            <>
              <Pause
                className="h-4 w-4 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
              En pause — aucune dépense ne sera générée.
            </>
          )}
        </span>
        {isPending && (
          <Loader2
            className="h-4 w-4 animate-spin text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
        )}
      </div>
    </article>
  )
}

export default function RecurringPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: categories = [] } = useCategories()
  const { data: rules = [], isPending, isError, error, refetch } =
    useRecurringExpenses()
  const createMutation = useCreateRecurringExpense()
  const toggleMutation = useToggleRecurringExpense()

  const activeCount = rules.filter((rule) => rule.active).length
  const pausedCount = rules.length - activeCount
  const nextRule = rules
    .filter((rule) => rule.active)
    .sort((a, b) => a.next_date.localeCompare(b.next_date))[0]

  const handleCreate = async (input: RecurringInput) => {
    try {
      await createMutation.mutateAsync(input)
      toast.success('Récurrence créée.')
      setCreateOpen(false)
    } catch (createError) {
      toast.error(
        createError instanceof Error
          ? createError.message
          : 'Impossible de créer la récurrence.',
      )
    }
  }

  const handleToggle = async (rule: RecurringExpenseWithCategory) => {
    try {
      await toggleMutation.mutateAsync({ id: rule.id, active: !rule.active })
      toast.success(
        rule.active
          ? 'Récurrence mise en pause.'
          : 'Récurrence réactivée.',
      )
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error
          ? toggleError.message
          : 'Impossible de modifier la récurrence.',
      )
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Gestion financière</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Récurrences
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            Dépenses récurrentes
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Créez vos loyers et abonnements : les dépenses échues sont générées
            automatiquement à l'ouverture de l'application.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-600 md:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle récurrence
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Repeat2 className="h-4 w-4" aria-hidden="true" />
          {activeCount} active{activeCount > 1 ? 's' : ''}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Pause className="h-4 w-4" aria-hidden="true" />
          {pausedCount} en pause
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          {nextRule
            ? `Prochaine échéance le ${formatExpenseDate(nextRule.next_date)}`
            : "Aucune échéance à venir"}
        </span>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-3 w-2/3 rounded bg-slate-50 dark:bg-slate-800/60" />
                </div>
              </div>
              <div className="mt-4 h-4 w-3/4 rounded bg-slate-50 dark:bg-slate-800/60" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm dark:bg-slate-900">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Impossible de charger les récurrences
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {error instanceof Error
              ? error.message
              : 'Une erreur inattendue est survenue.'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm dark:bg-slate-900">
          <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-emerald-600 dark:bg-slate-800/60 dark:text-emerald-400">
            <Repeat2 className="h-10 w-10" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Aucune dépense récurrente
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Ajoutez votre loyer ou vos abonnements pour les enregistrer
            automatiquement chaque semaine ou chaque mois.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Créer une récurrence
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rules.map((rule) => (
            <RecurringCard
              key={rule.id}
              rule={rule}
              isPending={toggleMutation.isPending}
              onToggle={(target) => void handleToggle(target)}
            />
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        labelledBy="recurring-modal-title"
        maxWidthClassName="max-w-[560px]"
      >
        <RecurringForm
          categories={categories}
          isSubmitting={createMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </Modal>
    </div>
  )
}
