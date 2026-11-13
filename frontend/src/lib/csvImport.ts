import Papa from 'papaparse'
import { z } from 'zod'
import { TODAY_ISO } from '@/lib/format'
import type { CategoryRow } from '@/types/database'

export type CsvField = 'date' | 'amount' | 'merchant' | 'category'

export type CsvColumnMapping = Record<CsvField, string>

export const CSV_MAPPING_FIELDS: Array<{
  key: CsvField
  label: string
  required: boolean
}> = [
  { key: 'date', label: 'Date', required: true },
  { key: 'amount', label: 'Montant', required: true },
  { key: 'merchant', label: 'Commerçant', required: true },
  { key: 'category', label: 'Catégorie', required: false },
]

export type ParsedCsv = {
  fileName: string
  headers: string[]
  records: Array<Record<string, string>>
}

export type CsvValidRow = {
  line: number
  expense_date: string
  amount: number
  merchant: string
  category_id: string
  category_name: string
}

export type CsvRowError = {
  line: number
  messages: string[]
  preview: string
}

export type CsvPreviewRow = {
  line: number
  values: Record<CsvField, string>
  messages: string[]
}

export type CsvAnalysis = {
  totalRows: number
  validRows: CsvValidRow[]
  errors: CsvRowError[]
  preview: CsvPreviewRow[]
}

const EMPTY_MAPPING: CsvColumnMapping = {
  date: '',
  amount: '',
  merchant: '',
  category: '',
}

function normalizeLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function parseCsvDate(value: string): string | null {
  const cleaned = value.trim()
  if (!cleaned) return null

  let year: number
  let month: number
  let day: number

  const isoMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/.exec(cleaned)
  if (isoMatch) {
    year = Number(isoMatch[1])
    month = Number(isoMatch[2])
    day = Number(isoMatch[3])
  } else {
    const localMatch = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(cleaned)
    if (!localMatch) return null
    day = Number(localMatch[1])
    month = Number(localMatch[2])
    year = Number(localMatch[3])
    if (year < 100) year += 2000
  }

  if (
    year < 1900 ||
    year > 2100 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function parseCsvAmount(value: string): number | null {
  let cleaned = value.replace(/[^\d.,-]/g, '').trim()
  if (!cleaned || cleaned.startsWith('-')) return null
  cleaned = cleaned.replace(/-/g, '')

  const comma = cleaned.lastIndexOf(',')
  const dot = cleaned.lastIndexOf('.')

  if (comma !== -1 && dot !== -1) {
    if (comma > dot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (comma !== -1) {
    const parts = cleaned.split(',')
    cleaned = parts.length === 2 ? `${parts[0]}.${parts[1]}` : parts.join('')
  } else if (dot !== -1) {
    const parts = cleaned.split('.')
    if (parts.length > 2) cleaned = parts.join('')
  }

  const amount = Number(cleaned)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return Math.round(amount * 1000) / 1000
}

const DATE_SYNONYMS = [
  'date',
  'datedepense',
  'dateoperation',
  'datevaleur',
  'expense_date',
  'jour',
  'transactiondate',
]

const AMOUNT_SYNONYMS = [
  'montant',
  'amount',
  'somme',
  'total',
  'prix',
  'valeur',
  'value',
  'debit',
]

const MERCHANT_SYNONYMS = [
  'commercant',
  'marchand',
  'merchant',
  'libelle',
  'description',
  'beneficiaire',
  'label',
  'payee',
  'nom',
]

const CATEGORY_SYNONYMS = [
  'categorie',
  'category',
  'rubrique',
  'cat',
  'type',
]

function findMatchingHeader(headers: string[], synonyms: string[]) {
  const normalizedSynonyms = synonyms.map((synonym) => normalizeLabel(synonym))

  const exact = headers.find((header) =>
    normalizedSynonyms.includes(normalizeLabel(header)),
  )
  if (exact) return exact

  return (
    headers.find((header) => {
      const normalized = normalizeLabel(header)
      return normalizedSynonyms.some((synonym) => normalized.includes(synonym))
    }) ?? ''
  )
}

export function guessMapping(headers: string[]): CsvColumnMapping {
  const used = new Set<string>()

  const pick = (synonyms: string[]) => {
    const header = findMatchingHeader(
      headers.filter((candidate) => !used.has(candidate)),
      synonyms,
    )
    if (header) used.add(header)
    return header
  }

  return {
    date: pick(DATE_SYNONYMS),
    amount: pick(AMOUNT_SYNONYMS),
    merchant: pick(MERCHANT_SYNONYMS),
    category: pick(CATEGORY_SYNONYMS),
  }
}

export function emptyMapping(): CsvColumnMapping {
  return { ...EMPTY_MAPPING }
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.replace(/^\ufeff/, '').trim(),
      complete: (result) => {
        const headers = (result.meta.fields ?? [])
          .map((header) => header.trim())
          .filter(Boolean)

        if (headers.length === 0) {
          reject(new Error('Aucune colonne détectée dans ce fichier CSV.'))
          return
        }

        const records = result.data.filter((record) =>
          headers.some((header) => (record[header] ?? '').trim() !== ''),
        )

        if (records.length === 0) {
          reject(new Error('Le fichier ne contient aucune ligne de données.'))
          return
        }

        resolve({ fileName: file.name, headers, records })
      },
      error: (error) => {
        reject(
          new Error(
            error.message || 'Impossible de lire le fichier CSV sélectionné.',
          ),
        )
      },
    })
  })
}

const dateFieldSchema = z
  .string()
  .trim()
  .min(1, 'Date manquante.')
  .transform((value, ctx) => {
    const iso = parseCsvDate(value)
    if (!iso) {
      ctx.addIssue({
        code: 'custom',
        message: 'Date invalide (AAAA-MM-JJ ou JJ/MM/AAAA).',
      })
      return z.NEVER
    }
    if (iso > TODAY_ISO) {
      ctx.addIssue({
        code: 'custom',
        message: 'La date ne peut pas être dans le futur.',
      })
      return z.NEVER
    }
    return iso
  })

const amountFieldSchema = z
  .string()
  .trim()
  .min(1, 'Montant manquant.')
  .transform((value, ctx) => {
    const amount = parseCsvAmount(value)
    if (amount === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Montant invalide (ex. 42,50).',
      })
      return z.NEVER
    }
    return amount
  })

const merchantFieldSchema = z
  .string()
  .trim()
  .min(2, 'Commerçant manquant (2 caractères minimum).')
  .max(120, 'Commerçant trop long (120 caractères maximum).')

function buildRowSchema(
  categoriesByLabel: Map<string, CategoryRow>,
  fallbackCategory: CategoryRow | null,
) {
  return z.object({
    date: dateFieldSchema,
    amount: amountFieldSchema,
    merchant: merchantFieldSchema,
    category: z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (!value) {
          if (fallbackCategory) return fallbackCategory
          ctx.addIssue({
            code: 'custom',
            message: 'Catégorie manquante (aucune catégorie « Autre »).',
          })
          return z.NEVER
        }

        const category = categoriesByLabel.get(normalizeLabel(value))
        if (!category) {
          ctx.addIssue({
            code: 'custom',
            message: `Catégorie « ${value} » inconnue.`,
          })
          return z.NEVER
        }
        return category
      }),
  })
}

function readCell(record: Record<string, string>, header: string) {
  if (!header) return ''
  return (record[header] ?? '').trim()
}

export function analyzeCsv(
  parsed: ParsedCsv,
  mapping: CsvColumnMapping,
  categories: CategoryRow[],
): CsvAnalysis {
  const categoriesByLabel = new Map<string, CategoryRow>()
  for (const category of categories) {
    const label = normalizeLabel(category.name)
    if (label && !categoriesByLabel.has(label)) {
      categoriesByLabel.set(label, category)
    }
  }

  const fallbackCategory =
    categories.find((category) => normalizeLabel(category.name) === 'autre') ??
    null

  const rowSchema = buildRowSchema(categoriesByLabel, fallbackCategory)
  const validRows: CsvValidRow[] = []
  const errors: CsvRowError[] = []
  const preview: CsvPreviewRow[] = []

  parsed.records.forEach((record, index) => {
    const line = index + 2
    const values: Record<CsvField, string> = {
      date: readCell(record, mapping.date),
      amount: readCell(record, mapping.amount),
      merchant: readCell(record, mapping.merchant),
      category: readCell(record, mapping.category),
    }

    const result = rowSchema.safeParse(values)
    const messages = result.success
      ? []
      : [...new Set(result.error.issues.map((issue) => issue.message))]

    if (preview.length < 10) {
      preview.push({ line, values, messages })
    }

    if (result.success) {
      validRows.push({
        line,
        expense_date: result.data.date,
        amount: result.data.amount,
        merchant: result.data.merchant,
        category_id: result.data.category.id,
        category_name: result.data.category.name,
      })
    } else {
      errors.push({
        line,
        messages,
        preview: `${values.date || '—'} · ${values.amount || '—'} · ${values.merchant || '—'} · ${values.category || '—'}`,
      })
    }
  })

  return {
    totalRows: parsed.records.length,
    validRows,
    errors,
    preview,
  }
}
