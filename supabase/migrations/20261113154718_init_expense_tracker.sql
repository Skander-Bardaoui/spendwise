-- Schéma initial du suivi de dépenses.
-- Appliquer avec `npx supabase db reset` (local) ou `npx supabase db push` (distant).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  currency text not null default 'TND',
  created_at timestamptz not null default now()
);

-- user_id NULL = catégorie par défaut partagée par tous les utilisateurs.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  icon text,
  color text
);

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  merchant text not null,
  amount numeric(12, 3) not null check (amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly')),
  next_date date not null,
  active boolean not null default true
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  merchant text not null,
  amount numeric(12, 3) not null check (amount > 0),
  expense_date date not null default current_date,
  note text,
  receipt_path text,
  payment_method text not null check (payment_method in ('cash', 'card', 'transfer', 'other')),
  recurring_id uuid references public.recurring_expenses (id) on delete set null,
  created_at timestamptz not null default now()
);

-- category_id NULL = budget global (toutes catégories confondues).
-- NULLS NOT DISTINCT évite plusieurs budgets globaux pour un même mois.
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid references public.categories (id) on delete cascade,
  amount_limit numeric(12, 3) not null check (amount_limit > 0),
  month date not null check (month = date_trunc('month', month)::date),
  alert_threshold integer not null default 80 check (alert_threshold between 0 and 100),
  constraint budgets_user_category_month_key unique nulls not distinct (user_id, category_id, month)
);

create table public.expense_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  merchant text,
  amount numeric(12, 3) check (amount > 0)
);

-- ---------------------------------------------------------------------------
-- Index
-- ---------------------------------------------------------------------------

create index expenses_user_id_expense_date_idx
  on public.expenses (user_id, expense_date);

create index expenses_category_id_idx
  on public.expenses (category_id);

create index expenses_recurring_id_idx
  on public.expenses (recurring_id);

create index categories_user_id_idx
  on public.categories (user_id)
  where user_id is not null;

create index budgets_user_id_month_idx
  on public.budgets (user_id, month);

create index recurring_expenses_user_id_next_date_idx
  on public.recurring_expenses (user_id, next_date)
  where active;

create index expense_templates_user_id_idx
  on public.expense_templates (user_id);

-- Permet un seed idempotent des catégories par défaut.
create unique index categories_default_name_key
  on public.categories (name)
  where user_id is null;

-- ---------------------------------------------------------------------------
-- Catégories par défaut
-- ---------------------------------------------------------------------------

insert into public.categories (name, icon, color)
values
  ('Alimentation', 'utensils', '#F59E0B'),
  ('Transport', 'car', '#3B82F6'),
  ('Santé', 'heart-pulse', '#EF4444'),
  ('Loisirs', 'gamepad-2', '#8B5CF6'),
  ('Logement', 'house', '#10B981'),
  ('Factures', 'receipt', '#6366F1'),
  ('Autre', 'circle-help', '#64748B')
on conflict (name) where user_id is null do nothing;

-- ---------------------------------------------------------------------------
-- Vue agrégée par catégorie et par mois
-- ---------------------------------------------------------------------------

create or replace view public.expenses_by_category_month
with (security_invoker = true)
as
select
  e.user_id,
  e.category_id,
  c.name as category_name,
  date_trunc('month', e.expense_date)::date as month,
  sum(e.amount) as total_amount,
  count(*) as expense_count
from public.expenses e
left join public.categories c on c.id = e.category_id
group by e.user_id, e.category_id, c.name, date_trunc('month', e.expense_date)::date;

grant select on public.expenses_by_category_month to authenticated;
revoke all on public.expenses_by_category_month from anon;

-- ---------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill pour les utilisateurs déjà existants.
insert into public.profiles (id, full_name)
select
  id,
  nullif(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.expense_templates enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Catégories par défaut (user_id NULL) en lecture seule pour tous,
-- catégories personnelles entièrement gérées par leur propriétaire.
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

create policy "expenses_manage_own"
  on public.expenses for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "budgets_manage_own"
  on public.budgets for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "recurring_expenses_manage_own"
  on public.recurring_expenses for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "expense_templates_manage_own"
  on public.expense_templates for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
