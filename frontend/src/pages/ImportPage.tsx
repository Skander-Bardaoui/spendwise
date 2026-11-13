import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileUp,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { dashboardKeys } from '@/hooks/useDashboard'
import { expenseKeys } from '@/hooks/useExpenses'
import { useCategories } from '@/hooks/useCategories'
import {
  captureBudgetStatuses,
  evaluateBudgetAlerts,
  expenseMonth,
} from '@/lib/budgetAlerts'
import {
  CSV_MAPPING_FIELDS,
  analyzeCsv,
  emptyMapping,
  guessMapping,
  parseCsvFile,
} from '@/lib/csvImport'
import type {
  CsvColumnMapping,
  CsvValidRow,
  ParsedCsv,
} from '@/lib/csvImport'
import { createExpensesBulk } from '@/services/expenses'
import type { BulkExpenseInput } from '@/services/expenses'

const MAX_FILE_SIZE = 10 * 1024 * 1024

type ImportResult = {
  inserted: number
  skipped: number
}

type ImportPayload = {
  rows: CsvValidRow[]
  skipped: number
  previousStatuses: Awaited<ReturnType<typeof captureBudgetStatuses>>
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<CsvColumnMapping>(emptyMapping)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const {
    data: categories = [],
    isPending: categoriesPending,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategories()
  const queryClient = useQueryClient()

  const selectedHeaders = CSV_MAPPING_FIELDS.map(
    (field) => mapping[field.key],
  ).filter(Boolean)
  const hasDuplicateMapping =
    new Set(selectedHeaders).size !== selectedHeaders.length
  const mappingComplete = Boolean(
    mapping.date && mapping.amount && mapping.merchant,
  )

  const analysis = useMemo(() => {
    if (
      !parsed ||
      categoriesPending ||
      categoriesError ||
      !mappingComplete ||
      hasDuplicateMapping
    ) {
      return null
    }
    return analyzeCsv(parsed, mapping, categories)
  }, [
    parsed,
    mapping,
    categories,
    categoriesPending,
    categoriesError,
    mappingComplete,
    hasDuplicateMapping,
  ])

  const importMutation = useMutation({
    mutationFn: ({ rows }: ImportPayload) => {
      const payload: BulkExpenseInput[] = rows.map((row) => ({
        merchant: row.merchant,
        amount: row.amount,
        expense_date: row.expense_date,
        category_id: row.category_id,
      }))
      return createExpensesBulk(payload)
    },
    onSuccess: (inserted, variables) => {
      setResult({ inserted, skipped: variables.skipped })
      void queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
      void evaluateBudgetAlerts(variables.previousStatuses)
      toast.success(
        `${inserted} dépense${inserted > 1 ? 's' : ''} importée${inserted > 1 ? 's' : ''}.`,
      )
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible d'importer les dépenses.",
      )
    },
  })

  const reset = () => {
    setParsed(null)
    setMapping(emptyMapping())
    setParseError(null)
    setResult(null)
    setIsDragging(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFile = async (file: File) => {
    if (!/\.csv$/i.test(file.name)) {
      toast.error('Choisissez un fichier au format .csv.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Le fichier dépasse la limite de 10 Mo.')
      return
    }

    setIsParsing(true)
    setParseError(null)
    setResult(null)
    try {
      const next = await parseCsvFile(file)
      setParsed(next)
      setMapping(guessMapping(next.headers))
    } catch (error) {
      setParsed(null)
      setMapping(emptyMapping())
      setParseError(
        error instanceof Error
          ? error.message
          : 'Impossible de lire ce fichier CSV.',
      )
    } finally {
      setIsParsing(false)
    }
  }

  const handleImport = async () => {
    if (!analysis || analysis.validRows.length === 0 || isPreparing) return
    setIsPreparing(true)
    try {
      const months = [
        ...new Set(
          analysis.validRows.map((row) => expenseMonth(row.expense_date)),
        ),
      ]
      const previousStatuses = await captureBudgetStatuses(months)
      importMutation.mutate({
        rows: analysis.validRows,
        skipped: analysis.errors.length,
        previousStatuses,
      })
    } finally {
      setIsPreparing(false)
    }
  }

  const isImporting = importMutation.isPending || isPreparing

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-5">
      <div>
        <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <span>Gestion financière</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Import CSV
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Importer des dépenses
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Chargez un relevé bancaire ou un export CSV, associez les colonnes
          puis vérifiez chaque ligne avant l'insertion.
        </p>
      </div>

      {result ? (
        <section className="flex flex-col items-center rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
          <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            {result.inserted} dépense{result.inserted > 1 ? 's' : ''} importée
            {result.inserted > 1 ? 's' : ''}
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {result.skipped > 0
              ? `${result.skipped} ligne${result.skipped > 1 ? 's' : ''} en erreur ${result.skipped > 1 ? 'ont' : 'a'} été ignorée${result.skipped > 1 ? 's' : ''}. `
              : 'Toutes les lignes ont été importées. '}
            Le moyen de paiement est défini sur « Autre » et pourra être
            modifié depuis la liste des dépenses.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/expenses"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Voir les dépenses
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Importer un autre fichier
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                1
              </span>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Fichier CSV
              </h2>
            </div>

            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void handleFile(file)
              }}
            />

            {parsed ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400">
                    <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {parsed.fileName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {parsed.records.length} ligne
                      {parsed.records.length > 1 ? 's' : ''} ·{' '}
                      {parsed.headers.length} colonne
                      {parsed.headers.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isParsing}
                    className="h-9 rounded-xl bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    aria-label="Retirer le fichier"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setIsDragging(false)
                  const file = event.dataTransfer.files?.[0]
                  if (file) void handleFile(file)
                }}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-50/60 dark:border-emerald-500/50 dark:bg-emerald-500/10'
                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/40'
                }`}
              >
                {isParsing ? (
                  <>
                    <Loader2
                      className="mb-3 h-8 w-8 animate-spin text-emerald-600"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Lecture du fichier…
                    </p>
                  </>
                ) : (
                  <>
                    <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400">
                      <FileUp className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Glissez votre fichier CSV ici
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Séparateur virgule, point-virgule ou tabulation · 10 Mo
                      max
                    </p>
                    <label
                      htmlFor="csv-file"
                      className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
                    >
                      Choisir un fichier
                    </label>
                  </>
                )}
              </div>
            )}

            {parseError && (
              <div
                role="alert"
                className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400"
              >
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                {parseError}
              </div>
            )}
          </section>

          {parsed && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  2
                </span>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Correspondance des colonnes
                </h2>
                {categoriesPending && (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-slate-400 dark:text-slate-500"
                    aria-label="Chargement des catégories"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {CSV_MAPPING_FIELDS.map((field) => (
                  <div key={field.key}>
                    <label
                      htmlFor={`mapping-${field.key}`}
                      className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {field.label}
                      {field.required ? (
                        <span className="ml-0.5 text-red-500 dark:text-red-400">
                          *
                        </span>
                      ) : (
                        <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">
                          (optionnel)
                        </span>
                      )}
                    </label>
                    <select
                      id={`mapping-${field.key}`}
                      value={mapping[field.key]}
                      onChange={(event) =>
                        setMapping((previous) => ({
                          ...previous,
                          [field.key]: event.target.value,
                        }))
                      }
                      className="h-10 w-full rounded-xl bg-slate-50 px-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 transition-shadow focus:bg-white focus:ring-2 focus:ring-emerald-400 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700 dark:focus:bg-slate-800 dark:[color-scheme:dark]"
                    >
                      <option value="">Ignorer</option>
                      {parsed.headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {categoriesError && (
                <p
                  role="alert"
                  className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400"
                >
                  Impossible de charger vos catégories.
                  <button
                    type="button"
                    onClick={() => void refetchCategories()}
                    className="font-semibold underline underline-offset-2"
                  >
                    Réessayer
                  </button>
                </p>
              )}

              {hasDuplicateMapping && (
                <p
                  role="alert"
                  className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  Une même colonne est associée à plusieurs champs. Choisissez
                  des colonnes différentes.
                </p>
              )}

              {!mappingComplete && !hasDuplicateMapping && (
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  Associez au minimum la date, le montant et le commerçant pour
                  lancer l'analyse.
                </p>
              )}

              {!mapping.category && mappingComplete && (
                <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  Sans colonne catégorie, les dépenses seront classées dans
                  « Autre ».
                </p>
              )}

              {analysis && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {analysis.validRows.length} valide
                    {analysis.validRows.length > 1 ? 's' : ''}
                  </span>
                  {analysis.errors.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      {analysis.errors.length} erreur
                      {analysis.errors.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {analysis.totalRows} ligne
                    {analysis.totalRows > 1 ? 's' : ''} analysée
                    {analysis.totalRows > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </section>
          )}

          {analysis && (
            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-2 pt-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    3
                  </span>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Aperçu des 10 premières lignes
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Valeurs brutes du fichier
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                      <th className="px-5 py-3 font-semibold">Ligne</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Montant</th>
                      <th className="px-4 py-3 font-semibold">Commerçant</th>
                      <th className="px-4 py-3 font-semibold">Catégorie</th>
                      <th className="px-5 py-3 text-right font-semibold">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.preview.map((row) => {
                      const hasError = row.messages.length > 0
                      return (
                        <tr
                          key={row.line}
                          className={`border-t border-slate-100 dark:border-slate-800 ${
                            hasError ? 'bg-red-50/40 dark:bg-red-500/10' : ''
                          }`}
                        >
                          <td className="px-5 py-3 text-xs tabular-nums text-slate-400 dark:text-slate-500">
                            {row.line}
                          </td>
                          {(
                            ['date', 'amount', 'merchant', 'category'] as const
                          ).map((key) => (
                            <td
                              key={key}
                              title={row.values[key]}
                              className="max-w-[220px] truncate px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
                            >
                              {row.values[key] || (
                                <span className="italic text-slate-300 dark:text-slate-600">
                                  —
                                </span>
                              )}
                            </td>
                          ))}
                          <td className="whitespace-nowrap px-5 py-3 text-right">
                            {hasError ? (
                              <span
                                title={row.messages.join(' · ')}
                                className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400"
                              >
                                <AlertTriangle
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                Erreur
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                <CheckCircle2
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                                Valide
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {analysis.totalRows > analysis.preview.length && (
                <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
                  Seules les 10 premières lignes sont affichées, les{' '}
                  {analysis.totalRows} lignes du fichier seront analysées.
                </p>
              )}
            </section>
          )}

          {analysis && analysis.errors.length > 0 && (
            <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Rapport des erreurs
                </h2>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  {analysis.errors.length}
                </span>
              </div>

              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {analysis.errors.slice(0, 50).map((error) => (
                  <li key={error.line} className="py-2.5">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                      Ligne {error.line}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                      {error.messages.join(' · ')}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">
                      {error.preview}
                    </p>
                  </li>
                ))}
              </ul>

              {analysis.errors.length > 50 && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {analysis.errors.length - 50} autre
                  {analysis.errors.length - 50 > 1 ? 's' : ''} erreur
                  {analysis.errors.length - 50 > 1 ? 's' : ''} non affichée
                  {analysis.errors.length - 50 > 1 ? 's' : ''}.
                </p>
              )}

              <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Les lignes en erreur seront ignorées lors de l'import.
              </p>
            </section>
          )}

          {analysis && (
            <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900 dark:ring-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {analysis.validRows.length} dépense
                  {analysis.validRows.length > 1 ? 's' : ''} prête
                  {analysis.validRows.length > 1 ? 's' : ''} à importer
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {analysis.errors.length > 0
                    ? `${analysis.errors.length} ligne${analysis.errors.length > 1 ? 's' : ''} en erreur sera${analysis.errors.length > 1 ? 'ont' : ''} ignorée${analysis.errors.length > 1 ? 's' : ''}.`
                    : 'Toutes les lignes sont valides.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={isImporting}
                  className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={
                    analysis.validRows.length === 0 ||
                    isImporting
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-500/20 transition-colors hover:bg-emerald-600 disabled:opacity-60"
                >
                  {isImporting ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <FileUp className="h-4 w-4" aria-hidden="true" />
                  )}
                  Importer {analysis.validRows.length} dépense
                  {analysis.validRows.length > 1 ? 's' : ''}
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
