import { createElement, useState } from 'react'
import { addMonths, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  AlertTriangle,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Pencil,
  PieChart,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { BudgetForm } from '@/components/budgets/BudgetForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { useBudgetStatus, useDeleteBudget, useSaveBudget } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { getCategoryColors, getCategoryIcon } from '@/lib/categoryIcons'
import { dismissBudgetAlert } from '@/lib/budgetAlertStore'
import { formatCurrency } from '@/lib/format'
import type { BudgetInput } from '@/services/budgets'
import type { BudgetStatusRow, BudgetStatusValue } from '@/types/database'

const STATUS_META: Record<
  BudgetStatusValue,
  { label: string; badge: string; bar: string; text: string }
> = {
  ok: {
    label: 'Sous contrôle',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    label: 'Vigilance',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  exceeded: {
    label: 'Dépassé',
    badge: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
    bar: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function getCurrentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
}

function shiftMonth(value: string, offset: number) {
  const date = addMonths(parseISO(`${value}-01T00:00:00`), offset)
  return format(date, 'yyyy-MM')
}

function formatMonthLabel(value: string) {
  const label = format(parseISO(`${value}-01T00:00:00`), 'MMMM yyyy', {
    locale: fr,
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

type BudgetCardProps = {
  budget: BudgetStatusRow
  onEdit: (budget: BudgetStatusRow) => void
  onDelete: (budget: BudgetStatusRow) => void
}

function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const meta = STATUS_META[budget.status]
  const percentage = Math.round(
    (budget.spent_amount / budget.amount_limit) * 100,
  )
  const width = Math.min(100, Math.max(0, percentage))
  const isGlobal = budget.category_id === null
  const colors = getCategoryColors(budget.category_color)
  const icon = isGlobal
    ? PieChart
    : getCategoryIcon(budget.category_icon)
  const remaining = budget.remaining_amount

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={
              isGlobal
                ? { backgroundColor: '#ECFDF5', color: '#059669' }
                : { backgroundColor: colors.background, color: colors.text }
            }
          >
            {createElement(icon, {
              className: 'h-5 w-5',
              'aria-hidden': true,
            })}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {isGlobal
                ? 'Budget global'
                : (budget.category_name ?? 'Sans catégorie')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alerte à {budget.alert_threshold} %
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span
            className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${meta.badge}`}
          >
            {meta.label}
          </span>
          <button
            type="button"
            onClick={() => onEdit(budget)}
            aria-label={`Modifier le budget ${isGlobal ? 'global' : budget.category_name}`}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(budget)}
            aria-label={`Supprimer le budget ${isGlobal ? 'global' : budget.category_name}`}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatCurrency(budget.spent_amount)}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            sur {formatCurrency(budget.amount_limit)}
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={width}
          aria-label={`Budget ${isGlobal ? 'global' : budget.category_name}`}
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <div
            className={`h-full rounded-full transition-all ${meta.bar}`}
            style={{ width: `${width}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px]">
          <span className={`font-semibold ${meta.text}`}>
            {percentage} % consommé
          </span>
          <span
            className={
              remaining < 0
                ? 'font-semibold text-red-600 dark:text-red-400'
                : 'text-slate-500 dark:text-slate-400'
            }
          >
            {remaining < 0
              ? `${formatCurrency(Math.abs(remaining))} de dépassement`
              : `${formatCurrency(remaining)} restants`}
          </span>
        </div>
      </div>
    </article>
  )
}

export default function BudgetsPage() {
  const currentMonth = getCurrentMonthValue()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetStatusRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<BudgetStatusRow | null>(
    null,
  )

  const month = `${selectedMonth}-01`
  const {
    data: budgets = [],
    isPending,
    isError,
    error,
    refetch,
  } = useBudgetStatus(month)
  const { data: categories = [] } = useCategories()
  const saveMutation = useSaveBudget()
  const deleteMutation = useDeleteBudget()

  const globalBudget = budgets.find((budget) => budget.category_id === null)
  const categoryBudgets = budgets
    .filter((budget) => budget.category_id !== null)
    .sort((a, b) =>
      (a.category_name ?? '').localeCompare(b.category_name ?? '', 'fr'),
    )
  const alertCount = budgets.filter(
    (budget) => budget.status !== 'ok',
  ).length
  const monthLabel = formatMonthLabel(selectedMonth)

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (budget: BudgetStatusRow) => {
    setEditing(budget)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleSave = async (input: BudgetInput) => {
    try {
      await saveMutation.mutateAsync({ month, input })
      if (editing) dismissBudgetAlert(editing.budget_id)
      toast.success(editing ? 'Budget mis à jour.' : 'Budget enregistré.')
      closeForm()
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer le budget.",
      )
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.budget_id)
      dismissBudgetAlert(pendingDelete.budget_id)
      toast.success('Budget supprimé.')
      setPendingDelete(null)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : 'Impossible de supprimer le budget.',
      )
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Gestion financière</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Budgets
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Budgets mensuels
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Définissez un plafond global ou par catégorie et suivez la
            consommation du mois en temps réel.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-600 md:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouveau budget
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
        <button
          type="button"
          onClick={() => setSelectedMonth((value) => shiftMonth(value, -1))}
          aria-label="Mois précédent"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <label className="relative flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 dark:bg-slate-800/60 dark:text-slate-100">
          <CalendarRange
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <span className="sr-only">Mois du budget</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              if (/^\d{4}-\d{2}$/.test(event.target.value)) {
                setSelectedMonth(event.target.value)
              }
            }}
            className="w-[9.5rem] bg-transparent text-sm font-semibold text-slate-900 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
          />
        </label>

        <button
          type="button"
          onClick={() => setSelectedMonth((value) => shiftMonth(value, 1))}
          aria-label="Mois suivant"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <span className="ml-1 hidden text-xs text-slate-400 sm:inline dark:text-slate-500">
          {monthLabel}
        </span>

        {selectedMonth !== currentMonth && (
          <button
            type="button"
            onClick={() => setSelectedMonth(currentMonth)}
            className="ml-auto rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Mois en cours
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
          <PieChart
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          {budgets.length} budget{budgets.length > 1 ? 's' : ''} suivi
          {budgets.length > 1 ? 's' : ''}
        </span>
        {alertCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {alertCount} alerte{alertCount > 1 ? 's' : ''}
          </span>
        )}
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
                  <div className="h-3 w-1/3 rounded bg-slate-50 dark:bg-slate-800/60" />
                </div>
              </div>
              <div className="mt-5 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="mt-2 h-3 w-2/3 rounded bg-slate-50 dark:bg-slate-800/60" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm dark:bg-slate-900">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Impossible de charger les budgets
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {error instanceof Error
              ? error.message
              : 'Une erreur inattendue est survenue.'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm dark:bg-slate-900">
          <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-emerald-600 dark:bg-slate-800/60 dark:text-emerald-400">
            <PieChart className="h-10 w-10" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Aucun budget pour {monthLabel.toLowerCase()}
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Créez un budget global ou un plafond par catégorie pour suivre vos
            dépenses et recevoir des alertes.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-6 inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Créer un budget
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Budget global
            </h2>
            {globalBudget ? (
              <BudgetCard
                budget={globalBudget}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            ) : (
              <button
                type="button"
                onClick={openCreate}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-4 py-8 text-sm font-semibold text-slate-500 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-white/5 dark:text-slate-400 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Ajouter un budget global pour {monthLabel.toLowerCase()}
              </button>
            )}
          </div>

          {categoryBudgets.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Budgets par catégorie ({categoryBudgets.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {categoryBudgets.map((budget) => (
                  <BudgetCard
                    key={budget.budget_id}
                    budget={budget}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        labelledBy="budget-modal-title"
      >
        <BudgetForm
          key={editing?.budget_id ?? `new-${selectedMonth}`}
          budget={editing}
          categories={categories}
          monthLabel={monthLabel}
          isSubmitting={saveMutation.isPending}
          onClose={closeForm}
          onSubmit={handleSave}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Supprimer ce budget ?"
        description={
          pendingDelete
            ? `Le budget ${pendingDelete.category_id ? `« ${pendingDelete.category_name} »` : 'global'} de ${monthLabel.toLowerCase()} (${formatCurrency(pendingDelete.amount_limit)}) sera définitivement supprimé. Les dépenses ne sont pas affectées.`
            : ''
        }
        pending={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
