import { useState } from 'react'
import type { FormEvent } from 'react'
import { BookmarkPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { useCreateTemplate } from '@/hooks/useTemplates'
import { formatCurrency } from '@/lib/format'
import type { ExpenseWithCategory } from '@/types/database'

type TemplateSaveDialogProps = {
  expense: ExpenseWithCategory
  onClose: () => void
}

export function TemplateSaveDialog({
  expense,
  onClose,
}: TemplateSaveDialogProps) {
  const createTemplate = useCreateTemplate()
  const [name, setName] = useState(expense.merchant)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || createTemplate.isPending) return

    try {
      await createTemplate.mutateAsync({
        name: trimmed,
        merchant: expense.merchant,
        amount: expense.amount,
        category_id: expense.category_id,
      })
      toast.success('Modèle enregistré.')
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Impossible d’enregistrer le modèle.',
      )
    }
  }

  return (
    <Modal open onClose={onClose} maxWidthClassName="max-w-md">
      <form onSubmit={handleSubmit} className="p-6 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <BookmarkPlus className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Enregistrer comme modèle
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Le commerçant, le montant et la catégorie seront réutilisés
              lors d’un ajout rapide, à la date du jour.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-100 dark:bg-slate-800/60 dark:ring-slate-800">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{expense.merchant}</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formatCurrency(expense.amount)} ·{' '}
            {expense.category?.name ?? 'Sans catégorie'}
          </p>
        </div>

        <label
          htmlFor="template-name"
          className="mt-4 block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Nom du modèle
        </label>
        <input
          id="template-name"
          type="text"
          autoFocus
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex. Café du matin"
          className="mt-1.5 h-11 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition-shadow placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
        />

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createTemplate.isPending}
            className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!name.trim() || createTemplate.isPending}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
          >
            {createTemplate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
            )}
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  )
}
