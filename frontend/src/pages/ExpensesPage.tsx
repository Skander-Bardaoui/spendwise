import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { ExpenseFilters } from '@/components/expenses/ExpenseFilters'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { useCategories } from '@/hooks/useCategories'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
} from '@/hooks/useExpenses'
import { formatCurrency, getMonthBounds } from '@/lib/format'
import type {
  ExpenseFilters as ExpenseFiltersValue,
  ExpenseInput,
  ExpenseSortField,
} from '@/services/expenses'
import type { ExpenseWithCategory } from '@/types/database'

const INITIAL_MONTH = getMonthBounds(0)

const INITIAL_FILTERS: ExpenseFiltersValue = {
  search: '',
  categoryId: null,
  paymentMethod: null,
  dateFrom: INITIAL_MONTH.from,
  dateTo: INITIAL_MONTH.to,
  minAmount: null,
  maxAmount: null,
  sortBy: 'expense_date',
  sortDirection: 'desc',
  page: 1,
  pageSize: 10,
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function getPageNumbers(
  current: number,
  total: number,
): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = new Set<number>([1, total, current - 1, current, current + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const result: Array<number | 'ellipsis'> = []
  sorted.forEach((page, index) => {
    const previous = sorted[index - 1]
    if (previous && page - previous > 1) result.push('ellipsis')
    result.push(page)
  })
  return result
}

export default function ExpensesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<ExpenseFiltersValue>(INITIAL_FILTERS)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseWithCategory | null>(null)
  const [pendingDelete, setPendingDelete] =
    useState<ExpenseWithCategory | null>(null)

  const urlSearch = (searchParams.get('q') ?? '').trim()
  const createFromUrl = searchParams.get('nouvelle') === '1'

  const effectiveFilters = useMemo(
    () => (urlSearch ? { ...filters, search: urlSearch } : filters),
    [filters, urlSearch],
  )

  const debouncedSearch = useDebouncedValue(effectiveFilters.search, 300)
  const queryFilters = useMemo(
    () => ({ ...effectiveFilters, search: debouncedSearch.trim() }),
    [effectiveFilters, debouncedSearch],
  )

  const { data, isPending, isFetching, isError, error, refetch } =
    useExpenses(queryFilters)
  const { data: categories = [] } = useCategories()

  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()
  const deleteMutation = useDeleteExpense()

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / effectiveFilters.pageSize))
  const currentPage = Math.min(effectiveFilters.page, totalPages)
  const pageSum = rows.reduce((sum, expense) => sum + expense.amount, 0)
  const isModalOpen = createOpen || createFromUrl || editing !== null

  const clearSearchParam = () => {
    if (!searchParams.has('q')) return false
    const next = new URLSearchParams(searchParams)
    next.delete('q')
    setSearchParams(next, { replace: true })
    return true
  }

  const updateFilters = (patch: Partial<ExpenseFiltersValue>) => {
    const hadUrlSearch = clearSearchParam()
    setFilters((previous) => ({
      ...previous,
      ...patch,
      search:
        patch.search !== undefined
          ? patch.search
          : hadUrlSearch
            ? urlSearch
            : previous.search,
      page: patch.page ?? 1,
    }))
  }

  const resetFilters = () => {
    clearSearchParam()
    setFilters(INITIAL_FILTERS)
  }

  const handleSort = (field: ExpenseSortField) => {
    setFilters((previous) => ({
      ...previous,
      sortBy: field,
      sortDirection:
        previous.sortBy === field && previous.sortDirection === 'desc'
          ? 'asc'
          : 'desc',
      page: 1,
    }))
  }

  const openCreate = () => {
    setEditing(null)
    setCreateOpen(true)
  }

  const closeModal = () => {
    setCreateOpen(false)
    setEditing(null)
    if (createFromUrl) {
      const next = new URLSearchParams(searchParams)
      next.delete('nouvelle')
      setSearchParams(next, { replace: true })
    }
  }

  const handleFormSubmit = async (input: ExpenseInput) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input })
        toast.success('Dépense mise à jour.')
      } else {
        await createMutation.mutateAsync(input)
        toast.success('Dépense enregistrée.')
      }
      closeModal()
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : 'Impossible d’enregistrer la dépense.',
      )
    }
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('Dépense supprimée.')
      setPendingDelete(null)
      if (rows.length === 1 && currentPage > 1) {
        setFilters((previous) => ({
          ...previous,
          search: urlSearch || previous.search,
          page: currentPage - 1,
        }))
      }
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : 'Impossible de supprimer la dépense.',
      )
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400">
            <span>Gestion financière</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-medium text-emerald-600">Vue détaillée</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Historique des dépenses
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Gérez, filtrez et triez l'ensemble de vos transactions et notes de
            frais.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-600 md:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter une dépense
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white p-1.5 shadow-sm">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
          <ReceiptText className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          {isPending ? 'Chargement...' : `${total} opération${total > 1 ? 's' : ''}`}
        </span>
        <span className="flex items-center gap-2 pr-2 text-[11px] text-slate-400">
          {isFetching ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          )}
          Synchronisation {isFetching ? 'en cours' : 'active'}
        </span>
      </div>

      <ExpenseFilters
        filters={effectiveFilters}
        categories={categories}
        onChange={updateFilters}
        onReset={resetFilters}
        onSortDirectionToggle={() =>
          updateFilters({
            sortDirection:
              effectiveFilters.sortDirection === 'asc' ? 'desc' : 'asc',
          })
        }
      />

      {isPending ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-1/4 rounded-md bg-slate-100" />
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-14 w-full rounded-xl bg-slate-50" />
            ))}
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-36 rounded bg-slate-100" />
              <div className="h-8 w-48 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900">
            Impossible de charger les dépenses
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {error instanceof Error
              ? error.message
              : 'Une erreur inattendue est survenue.'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm">
          <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-emerald-600">
            <ReceiptText className="h-10 w-10" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Aucune dépense trouvée
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Aucune transaction ne correspond à vos filtres actuels, ou vous
            n'avez pas encore enregistré de dépense pour cette période.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Effacer les filtres
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer une dépense
            </button>
          </div>
        </div>
      ) : (
        <>
          <ExpenseList
            rows={rows}
            sortBy={effectiveFilters.sortBy}
            sortDirection={effectiveFilters.sortDirection}
            onSort={handleSort}
            onEdit={(expense) => setEditing(expense)}
            onDelete={(expense) => setPendingDelete(expense)}
          />

          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm md:flex-row">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <BarChart3 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
              <span>Total affiché :</span>
              <span className="font-semibold text-slate-900">
                {rows.length} dépense{rows.length > 1 ? 's' : ''}
              </span>
              <span>•</span>
              <span className="font-semibold tabular-nums text-red-600">
                {formatCurrency(pageSum)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="page-size"
                  className="hidden text-xs text-slate-500 sm:inline"
                >
                  Lignes :
                </label>
                <select
                  id="page-size"
                  value={effectiveFilters.pageSize}
                  onChange={(event) =>
                    updateFilters({ pageSize: Number(event.target.value) })
                  }
                  className="h-8 rounded-lg bg-slate-100 px-2 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} par page
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    updateFilters({ page: Math.max(1, currentPage - 1) })
                  }
                  disabled={currentPage <= 1}
                  aria-label="Page précédente"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                {getPageNumbers(currentPage, totalPages).map((page, index) =>
                  page === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="w-6 text-center text-xs text-slate-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => updateFilters({ page })}
                      aria-current={page === currentPage ? 'page' : undefined}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                        page === currentPage
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() =>
                    updateFilters({
                      page: Math.min(totalPages, currentPage + 1),
                    })
                  }
                  disabled={currentPage >= totalPages}
                  aria-label="Page suivante"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        labelledBy="expense-modal-title"
      >
        <ExpenseForm
          key={editing?.id ?? 'new-expense'}
          categories={categories}
          expense={editing}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Supprimer cette dépense ?"
        description={
          pendingDelete
            ? `« ${pendingDelete.merchant} » (${formatCurrency(pendingDelete.amount)}) sera définitivement supprimée.`
            : ''
        }
        pending={deleteMutation.isPending}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
