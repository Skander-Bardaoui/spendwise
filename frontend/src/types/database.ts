export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other'
export type RecurringFrequency = 'weekly' | 'monthly'

export type ProfileRow = {
  id: string
  full_name: string | null
  currency: string
  created_at: string
}

export type CategoryRow = {
  id: string
  user_id: string | null
  name: string
  icon: string | null
  color: string | null
}

export type ExpenseRow = {
  id: string
  user_id: string
  category_id: string | null
  merchant: string
  amount: number
  expense_date: string
  note: string | null
  receipt_path: string | null
  payment_method: PaymentMethod
  recurring_id: string | null
  created_at: string
}

export type BudgetRow = {
  id: string
  user_id: string
  category_id: string | null
  amount_limit: number
  month: string
  alert_threshold: number
}

export type RecurringExpenseRow = {
  id: string
  user_id: string
  category_id: string | null
  merchant: string
  amount: number
  frequency: RecurringFrequency
  next_date: string
  active: boolean
}

export type ExpenseTemplateRow = {
  id: string
  user_id: string
  name: string
  category_id: string | null
  merchant: string | null
  amount: number | null
}

export type ExpensesByCategoryMonthRow = {
  user_id: string | null
  category_id: string | null
  category_name: string | null
  month: string | null
  total_amount: number | null
  expense_count: number | null
}

export type ProfileInsert = {
  id: string
  full_name?: string | null
  currency?: string
  created_at?: string
}
export type ProfileUpdate = Partial<Omit<ProfileInsert, 'id'>>

export type CategoryInsert = {
  id?: string
  user_id?: string | null
  name: string
  icon?: string | null
  color?: string | null
}
export type CategoryUpdate = Partial<Omit<CategoryInsert, 'id'>>

export type ExpenseInsert = {
  id?: string
  user_id: string
  category_id?: string | null
  merchant: string
  amount: number
  expense_date?: string
  note?: string | null
  receipt_path?: string | null
  payment_method: PaymentMethod
  recurring_id?: string | null
  created_at?: string
}
export type ExpenseUpdate = Partial<Omit<ExpenseInsert, 'id' | 'user_id'>>

export type BudgetInsert = {
  id?: string
  user_id: string
  category_id?: string | null
  amount_limit: number
  month: string
  alert_threshold?: number
}
export type BudgetUpdate = Partial<Omit<BudgetInsert, 'id' | 'user_id'>>

export type RecurringExpenseInsert = {
  id?: string
  user_id: string
  category_id?: string | null
  merchant: string
  amount: number
  frequency: RecurringFrequency
  next_date: string
  active?: boolean
}
export type RecurringExpenseUpdate = Partial<
  Omit<RecurringExpenseInsert, 'id' | 'user_id'>
>

export type ExpenseTemplateInsert = {
  id?: string
  user_id: string
  name: string
  category_id?: string | null
  merchant?: string | null
  amount?: number | null
}
export type ExpenseTemplateUpdate = Partial<
  Omit<ExpenseTemplateInsert, 'id' | 'user_id'>
>

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
      categories: {
        Row: CategoryRow
        Insert: CategoryInsert
        Update: CategoryUpdate
        Relationships: []
      }
      expenses: {
        Row: ExpenseRow
        Insert: ExpenseInsert
        Update: ExpenseUpdate
        Relationships: []
      }
      budgets: {
        Row: BudgetRow
        Insert: BudgetInsert
        Update: BudgetUpdate
        Relationships: []
      }
      recurring_expenses: {
        Row: RecurringExpenseRow
        Insert: RecurringExpenseInsert
        Update: RecurringExpenseUpdate
        Relationships: []
      }
      expense_templates: {
        Row: ExpenseTemplateRow
        Insert: ExpenseTemplateInsert
        Update: ExpenseTemplateUpdate
        Relationships: []
      }
    }
    Views: {
      expenses_by_category_month: {
        Row: ExpensesByCategoryMonthRow
        Relationships: []
      }
    }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type ExpenseWithCategory = ExpenseRow & {
  category: Pick<CategoryRow, 'id' | 'name' | 'icon' | 'color'> | null
}
