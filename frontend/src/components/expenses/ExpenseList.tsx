import {
  ArrowDown,
  ArrowUp,
  BookmarkPlus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { ReceiptViewer } from '@/components/expenses/ReceiptViewer'
import { getCategoryColors, getCategoryIcon } from '@/lib/categoryIcons'
import { formatCurrency, formatExpenseDate, formatTime } from '@/lib/format'
import { getPaymentMethod } from '@/lib/paymentMethods'
import type { ExpenseSortField, SortDirection } from '@/services/expenses'
import type { ExpenseWithCategory } from '@/types/database'

type ExpenseListProps = {
  rows: ExpenseWithCategory[]
  sortBy: ExpenseSortField
  sortDirection: SortDirection
  onSort: (field: ExpenseSortField) => void
  onEdit: (expense: ExpenseWithCategory) => void
  onDelete: (expense: ExpenseWithCategory) => void
  onSaveTemplate: (expense: ExpenseWithCategory) => void
}

function CategoryBadge({ expense }: { expense: ExpenseWithCategory }) {
  const colors = getCategoryColors(expense.category?.color ?? null)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colors.text }}
      />
      {expense.category?.name ?? 'Sans catégorie'}
    </span>
  )
}

function ReceiptCell({ receiptPath }: { receiptPath: string | null }) {
  if (!receiptPath) {
    return <span className="text-xs italic text-slate-400 dark:text-slate-500">Aucun</span>
  }
  return <ReceiptViewer path={receiptPath} className="h-11 w-11" />
}

export function ExpenseList({
  rows,
  sortBy,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onSaveTemplate,
}: ExpenseListProps) {
  const renderSortHeader = (
    field: ExpenseSortField,
    label: string,
    align: 'left' | 'right' = 'left',
  ) => {
    const isActive = sortBy === field
    return (
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-slate-800 dark:hover:text-white ${
          isActive ? 'text-slate-900 dark:text-white' : ''
        } ${align === 'right' ? 'justify-end' : ''}`}
      >
        {label}
        {isActive &&
          (sortDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          ))}
      </button>
    )
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900 lg:block">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <th className="px-6 py-3.5 font-semibold">
                {renderSortHeader('expense_date', 'Date')}
              </th>
              <th className="px-4 py-3.5 font-semibold">
                {renderSortHeader('merchant', 'Commerçant & note')}
              </th>
              <th className="px-4 py-3.5 font-semibold">Catégorie</th>
              <th className="px-4 py-3.5 font-semibold">Paiement</th>
              <th className="px-4 py-3.5 text-center font-semibold">
                Justificatif
              </th>
              <th className="px-4 py-3.5 text-right font-semibold">
                {renderSortHeader('amount', 'Montant', 'right')}
              </th>
              <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((expense) => {
              const CategoryIcon = getCategoryIcon(expense.category?.icon ?? null)
              const colors = getCategoryColors(expense.category?.color ?? null)
              const payment = getPaymentMethod(expense.payment_method)
              const PaymentIcon = payment.icon

              return (
                <tr
                  key={expense.id}
                  className="group border-t border-slate-100 transition-colors hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">
                      {formatExpenseDate(expense.expense_date)}
                    </span>
                    <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                      {formatTime(expense.created_at)}
                    </span>
                  </td>

                  <td className="min-w-[220px] px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          backgroundColor: colors.background,
                          color: colors.text,
                        }}
                      >
                        <CategoryIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {expense.merchant}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {expense.note || 'Sans note'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <CategoryBadge expense={expense} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                      <PaymentIcon
                        className="h-4 w-4 text-slate-400 dark:text-slate-500"
                        aria-hidden="true"
                      />
                      {payment.shortLabel}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-center">
                    <ReceiptCell receiptPath={expense.receipt_path} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    <span className="text-sm font-semibold tabular-nums text-red-600 dark:text-rose-400">
                      -{formatCurrency(expense.amount)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onSaveTemplate(expense)}
                        title="Enregistrer comme modèle"
                        aria-label={`Enregistrer ${expense.merchant} comme modèle`}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                      >
                        <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(expense)}
                        title="Modifier"
                        aria-label={`Modifier ${expense.merchant}`}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(expense)}
                        title="Supprimer"
                        aria-label={`Supprimer ${expense.merchant}`}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {rows.map((expense) => {
          const CategoryIcon = getCategoryIcon(expense.category?.icon ?? null)
          const colors = getCategoryColors(expense.category?.color ?? null)

          return (
            <article
              key={expense.id}
              className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                  >
                    <CategoryIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {expense.merchant}
                    </h3>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {expense.note || 'Sans note'}
                    </p>
                  </div>
                </div>
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-red-600 dark:text-rose-400">
                  -{formatCurrency(expense.amount)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <CategoryBadge expense={expense} />
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {formatExpenseDate(expense.expense_date)}
                  </span>
                  {expense.receipt_path && (
                    <ReceiptViewer
                      path={expense.receipt_path}
                      className="h-8 w-8"
                    />
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onSaveTemplate(expense)}
                    aria-label={`Enregistrer ${expense.merchant} comme modèle`}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                  >
                    <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(expense)}
                    aria-label={`Modifier ${expense.merchant}`}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(expense)}
                    aria-label={`Supprimer ${expense.merchant}`}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
