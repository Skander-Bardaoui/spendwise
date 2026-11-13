-- RLS complète sur les tables publiques.
-- Remplace les politiques définies dans la migration initiale par des
-- politiques explicites par opération.
--
-- Les politiques du bucket "receipts" (storage.objects) ne sont volontairement
-- pas ici : sur Supabase hébergé, le rôle du SQL Editor n'est pas propriétaire
-- de storage.objects (erreur 42501). Les créer via Dashboard > Storage.
-- Voir supabase/storage_receipts_policies.sql pour les expressions.

-- ---------------------------------------------------------------------------
-- Activation de RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.expense_templates enable row level security;

-- ---------------------------------------------------------------------------
-- Suppression des politiques existantes (idempotence)
-- ---------------------------------------------------------------------------

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

drop policy if exists "categories_select_default_or_own" on public.categories;
drop policy if exists "categories_insert_own" on public.categories;
drop policy if exists "categories_update_own" on public.categories;
drop policy if exists "categories_delete_own" on public.categories;

drop policy if exists "expenses_manage_own" on public.expenses;
drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

drop policy if exists "budgets_manage_own" on public.budgets;
drop policy if exists "budgets_select_own" on public.budgets;
drop policy if exists "budgets_insert_own" on public.budgets;
drop policy if exists "budgets_update_own" on public.budgets;
drop policy if exists "budgets_delete_own" on public.budgets;

drop policy if exists "recurring_expenses_manage_own" on public.recurring_expenses;
drop policy if exists "recurring_expenses_select_own" on public.recurring_expenses;
drop policy if exists "recurring_expenses_insert_own" on public.recurring_expenses;
drop policy if exists "recurring_expenses_update_own" on public.recurring_expenses;
drop policy if exists "recurring_expenses_delete_own" on public.recurring_expenses;

drop policy if exists "expense_templates_manage_own" on public.expense_templates;
drop policy if exists "expense_templates_select_own" on public.expense_templates;
drop policy if exists "expense_templates_insert_own" on public.expense_templates;
drop policy if exists "expense_templates_update_own" on public.expense_templates;
drop policy if exists "expense_templates_delete_own" on public.expense_templates;

-- ---------------------------------------------------------------------------
-- profiles : accès uniquement à sa propre ligne (id = auth.uid())
-- ---------------------------------------------------------------------------

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- categories : lecture des catégories par défaut + des siennes,
-- écriture uniquement sur les siennes.
-- ---------------------------------------------------------------------------

create policy "categories_select_default_or_own"
  on public.categories for select
  to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "categories_insert_own"
  on public.categories for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "categories_update_own"
  on public.categories for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "categories_delete_own"
  on public.categories for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------

create policy "expenses_select_own"
  on public.expenses for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "expenses_insert_own"
  on public.expenses for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "expenses_update_own"
  on public.expenses for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "expenses_delete_own"
  on public.expenses for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- budgets
-- ---------------------------------------------------------------------------

create policy "budgets_select_own"
  on public.budgets for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "budgets_insert_own"
  on public.budgets for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "budgets_update_own"
  on public.budgets for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "budgets_delete_own"
  on public.budgets for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- recurring_expenses
-- ---------------------------------------------------------------------------

create policy "recurring_expenses_select_own"
  on public.recurring_expenses for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "recurring_expenses_insert_own"
  on public.recurring_expenses for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "recurring_expenses_update_own"
  on public.recurring_expenses for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "recurring_expenses_delete_own"
  on public.recurring_expenses for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- expense_templates
-- ---------------------------------------------------------------------------

create policy "expense_templates_select_own"
  on public.expense_templates for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "expense_templates_insert_own"
  on public.expense_templates for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "expense_templates_update_own"
  on public.expense_templates for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "expense_templates_delete_own"
  on public.expense_templates for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Droits pour le rôle authenticated (RLS limite ensuite les lignes)
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on table
  public.profiles,
  public.categories,
  public.expenses,
  public.budgets,
  public.recurring_expenses,
  public.expense_templates
to authenticated;

grant select on public.expenses_by_category_month to authenticated;

-- Bucket et politiques Storage : à configurer dans le Dashboard
-- (Storage > New bucket puis Storage > Policies), car storage.objects
-- n'est pas modifiable depuis le SQL Editor d'un projet hébergé.
-- Expressions prêtes à copier : supabase/storage_receipts_policies.sql
