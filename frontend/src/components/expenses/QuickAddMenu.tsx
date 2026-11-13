import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { useTemplates } from '@/hooks/useTemplates'
import { getCategoryColors, getCategoryIcon } from '@/lib/categoryIcons'
import { formatCurrency } from '@/lib/format'
import type { ExpenseTemplateWithCategory } from '@/types/database'

type QuickAddMenuProps = {
  onSelect: (template: ExpenseTemplateWithCategory) => void
}

export function QuickAddMenu({ onSelect }: QuickAddMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: templates = [], isPending, isError, refetch } = useTemplates()

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Ajout rapide depuis un modèle"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800 dark:hover:bg-slate-800/60 sm:px-4"
      >
        <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <span className="hidden sm:inline">Ajout rapide</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform dark:text-slate-500 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Modèles de dépenses"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Modèles
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {templates.length}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5">
            {isPending ? (
              <div className="space-y-1.5 p-1">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="h-12 animate-pulse rounded-xl bg-slate-50 dark:bg-slate-800/60"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Impossible de charger les modèles.
                </p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Réessayer
                </button>
              </div>
            ) : templates.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <Zap
                  className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600"
                  aria-hidden="true"
                />
                <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Aucun modèle enregistré
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Utilisez l’icône marque-page sur une dépense pour créer un
                  modèle.
                </p>
              </div>
            ) : (
              templates.map((template) => {
                const Icon = getCategoryIcon(template.category?.icon ?? null)
                const colors = getCategoryColors(
                  template.category?.color ?? null,
                )
                return (
                  <button
                    key={template.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onSelect(template)
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-slate-800/60 dark:focus-visible:bg-slate-800/60"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: colors.background,
                        color: colors.text,
                      }}
                    >
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {template.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {template.merchant ?? 'Sans commerçant'}
                        {template.amount !== null &&
                          ` · ${formatCurrency(template.amount)}`}
                      </span>
                    </span>
                    <Zap
                      className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
