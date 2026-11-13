import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { deleteReceipt } from '@/services/receipts'
import type {
  ExpenseInsert,
  ExpenseUpdate,
  ExpenseWithCategory,
  PaymentMethod,
} from '@/types/database'

const EXPENSE_SELECT = '*, category:categories(id, name, icon, color)'

export type ExpenseSortField =
  | 'expense_date'
  | 'amount'
  | 'merchant'
  | 'created_at'

export type SortDirection = 'asc' | 'desc'

export type ExpenseFilters = {
  search: string
  categoryId: string | null
  paymentMethod: PaymentMethod | null
  dateFrom: string | null
  dateTo: string | null
  minAmount: number | null
  maxAmount: number | null
  sortBy: ExpenseSortField
  sortDirection: SortDirection
  page: number
  pageSize: number
}

export type ExpensePage = {
  rows: ExpenseWithCategory[]
  total: number
}

export type ExpenseInput = {
  merchant: string
  amount: number
  expense_date: string
  category_id: string
  payment_method: PaymentMethod
  note: string | null
  receipt_path?: string | null
}

function translateExpenseError(error: PostgrestError): Error {
  switch (error.code) {
    case '23514':
      return new Error('Le montant doit être supérieur à 0.')
    case '23503':
      return new Error(
        'La catégorie sélectionnée est introuvable. Actualisez la page.',
      )
    case '42501':
    case 'PGRST301':
      return new Error('Accès refusé. Vérifiez que vous êtes bien connecté.')
    case 'PGRST116':
      return new Error('Dépense introuvable ou déjà supprimée.')
    default:
      return new Error(
        error.message || 'Une erreur est survenue avec la base de données.',
      )
  }
}

function sanitizeSearchTerm(term: string) {
  // Les virgules et parenthèses cassent la syntaxe `or` de PostgREST.
  return term.replace(/[,()]/g, ' ').trim()
}

export async function listExpenses(
  filters: ExpenseFilters,
): Promise<ExpensePage> {
  let query = supabase
    .from('expenses')
    .select(EXPENSE_SELECT, { count: 'exact' })

  const search = sanitizeSearchTerm(filters.search)
  if (search) {
    query = query.or(`merchant.ilike.%${search}%,note.ilike.%${search}%`)
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }
  if (filters.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod)
  }
  if (filters.dateFrom) {
    query = query.gte('expense_date', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('expense_date', filters.dateTo)
  }
  if (filters.minAmount !== null) {
    query = query.gte('amount', filters.minAmount)
  }
  if (filters.maxAmount !== null) {
    query = query.lte('amount', filters.maxAmount)
  }

  query = query
    .order(filters.sortBy, {
      ascending: filters.sortDirection === 'asc',
      nullsFirst: false,
    })
    .range(
      (filters.page - 1) * filters.pageSize,
      filters.page * filters.pageSize - 1,
    )

  const { data, error, count } = await query

  if (error) {
    throw translateExpenseError(error)
  }

  return {
    rows: (data ?? []) as unknown as ExpenseWithCategory[],
    total: count ?? 0,
  }
}

const EXPORT_BATCH_SIZE = 1000
const EXPORT_MAX_PAGES = 200

export async function listAllExpenses(
  filters: ExpenseFilters,
): Promise<ExpenseWithCategory[]> {
  const rows: ExpenseWithCategory[] = []
  let page = 1

  while (page <= EXPORT_MAX_PAGES) {
    const batch = await listExpenses({
      ...filters,
      page,
      pageSize: EXPORT_BATCH_SIZE,
    })

    rows.push(...batch.rows)

    if (batch.rows.length === 0 || rows.length >= batch.total) {
      break
    }

    page += 1
  }

  return rows
}

export async function createExpense(
  input: ExpenseInput,
): Promise<ExpenseWithCategory> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error(
      'Vous devez être connecté pour enregistrer une dépense.',
    )
  }

  const payload: ExpenseInsert = {
    user_id: user.id,
    merchant: input.merchant.trim(),
    amount: input.amount,
    expense_date: input.expense_date,
    category_id: input.category_id,
    payment_method: input.payment_method,
    note: input.note?.trim() || null,
    receipt_path: input.receipt_path ?? null,
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert(payload)
    .select(EXPENSE_SELECT)
    .single()

  if (error) {
    throw translateExpenseError(error)
  }

  return data as unknown as ExpenseWithCategory
}

export type BulkExpenseInput = {
  merchant: string
  amount: number
  expense_date: string
  category_id: string
}

const BULK_INSERT_CHUNK_SIZE = 500

export async function createExpensesBulk(
  inputs: BulkExpenseInput[],
): Promise<number> {
  if (inputs.length === 0) return 0

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error(
      'Vous devez être connecté pour importer des dépenses.',
    )
  }

  let inserted = 0

  for (let start = 0; start < inputs.length; start += BULK_INSERT_CHUNK_SIZE) {
    const chunk = inputs.slice(start, start + BULK_INSERT_CHUNK_SIZE)
    const payload: ExpenseInsert[] = chunk.map((input) => ({
      user_id: user.id,
      merchant: input.merchant.trim(),
      amount: input.amount,
      expense_date: input.expense_date,
      category_id: input.category_id,
      payment_method: 'other',
      note: null,
      receipt_path: null,
    }))

    const { error } = await supabase.from('expenses').insert(payload)

    if (error) {
      const translated = translateExpenseError(error)
      throw new Error(
        inserted > 0
          ? `Import interrompu après ${inserted} dépense(s). ${translated.message}`
          : translated.message,
      )
    }

    inserted += chunk.length
  }

  return inserted
}

export async function updateExpense(
  id: string,
  input: ExpenseInput,
): Promise<ExpenseWithCategory> {
  const payload: ExpenseUpdate = {
    merchant: input.merchant.trim(),
    amount: input.amount,
    expense_date: input.expense_date,
    category_id: input.category_id,
    payment_method: input.payment_method,
    note: input.note?.trim() || null,
    receipt_path: input.receipt_path ?? null,
  }

  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .select(EXPENSE_SELECT)
    .single()

  if (error) {
    throw translateExpenseError(error)
  }

  return data as unknown as ExpenseWithCategory
}

export async function deleteExpense(
  id: string,
  receiptPath?: string | null,
): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) {
    throw translateExpenseError(error)
  }

  if (receiptPath) {
    try {
      await deleteReceipt(receiptPath)
    } catch {
      // La dépense est déjà supprimée : un fichier orphelin ne doit pas
      // faire échouer l'opération côté utilisateur.
    }
  }
}
