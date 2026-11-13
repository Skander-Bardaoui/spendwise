import { createElement, useState } from 'react'
import {
  AlertTriangle,
  ChevronRight,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tags,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { useCategories } from '@/hooks/useCategories'
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategoryMutations'
import { getCategoryColors, getCategoryIcon } from '@/lib/categoryIcons'
import type { CategoryInput } from '@/services/categories'
import type { CategoryRow } from '@/types/database'

type CategoryCardProps = {
  category: CategoryRow
  onEdit?: (category: CategoryRow) => void
  onDelete?: (category: CategoryRow) => void
}

function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const colors = getCategoryColors(category.color)
  const editable = category.user_id !== null

  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.background, color: colors.text }}
        >
          {createElement(getCategoryIcon(category.icon), {
            className: 'h-5 w-5',
            'aria-hidden': true,
          })}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {category.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {editable ? 'Personnalisée' : 'Catégorie par défaut'}
          </p>
        </div>
      </div>

      {editable ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit?.(category)}
            aria-label={`Modifier ${category.name}`}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(category)}
            aria-label={`Supprimer ${category.name}`}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <span
          title="Catégorie partagée en lecture seule"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        >
          <Lock className="h-3 w-3" aria-hidden="true" />
          Partagée
        </span>
      )}
    </article>
  )
}

export default function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CategoryRow | null>(null)

  const {
    data: categories = [],
    isPending,
    isError,
    error,
    refetch,
  } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const defaultCategories = categories.filter(
    (category) => category.user_id === null,
  )
  const customCategories = categories.filter(
    (category) => category.user_id !== null,
  )

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (category: CategoryRow) => {
    setEditing(category)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleSave = async (input: CategoryInput) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input })
        toast.success('Catégorie mise à jour.')
      } else {
        await createMutation.mutateAsync(input)
        toast.success('Catégorie créée.')
      }
      closeForm()
    } catch (saveError) {
      toast.error(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d'enregistrer la catégorie.",
      )
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success(
        `Catégorie supprimée. Les éléments associés ont été réaffectés à « Autre ».`,
      )
      setPendingDelete(null)
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : 'Impossible de supprimer la catégorie.',
      )
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>Gestion financière</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              Catégories
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Catégories
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Créez vos propres catégories pour classer vos dépenses, budgets,
            modèles et récurrences.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-600 md:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nouvelle catégorie
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-emerald-50/70 px-4 py-3 text-xs text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        <p>
          Les catégories par défaut sont partagées et en lecture seule. En cas
          de suppression d'une catégorie personnalisée, les dépenses, modèles
          et récurrences associés sont réaffectés à « Autre » ; les budgets
          liés à cette catégorie sont supprimés.
        </p>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex animate-pulse items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                <div className="h-3 w-1/3 rounded bg-slate-50 dark:bg-slate-800/60" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm dark:bg-slate-900">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Impossible de charger les catégories
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
      ) : (
        <div className="flex flex-col gap-5">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Catégories personnalisées
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {customCategories.length}
              </span>
            </div>

            {customCategories.length === 0 ? (
              <button
                type="button"
                onClick={openCreate}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-10 text-center transition-colors hover:border-emerald-300 dark:border-slate-800 dark:bg-white/5 dark:hover:border-emerald-500/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Tags className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Aucune catégorie personnalisée
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Ajoutez une catégorie adaptée à vos dépenses.
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Créer une catégorie
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {customCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Catégories par défaut
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {defaultCategories.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {defaultCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        labelledBy="category-modal-title"
      >
        <CategoryForm
          key={editing?.id ?? 'new-category'}
          category={editing}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onClose={closeForm}
          onSubmit={handleSave}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Supprimer cette catégorie ?"
        description={
          pendingDelete
            ? `La catégorie « ${pendingDelete.name} » sera supprimée. Les dépenses, modèles et récurrences associés seront réaffectés à « Autre ». Les budgets liés à cette catégorie seront supprimés.`
            : ''
        }
        pending={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
