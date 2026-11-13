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

create unique index expenses_recurring_occurrence_unique
  on public.expenses (recurring_id, expense_date);

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
-- Vue de statut des budgets (dépensé / limite + seuil d'alerte)
-- ---------------------------------------------------------------------------

create or replace view public.budget_status
with (security_invoker = true)
as
select
  b.id as budget_id,
  b.user_id,
  b.category_id,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color,
  b.month,
  b.amount_limit,
  b.alert_threshold,
  round(coalesce(sum(e.amount), 0), 3) as spent_amount,
  round(b.amount_limit - coalesce(sum(e.amount), 0), 3) as remaining_amount,
  case
    when coalesce(sum(e.amount), 0) >= b.amount_limit then 'exceeded'
    when coalesce(sum(e.amount), 0) >= b.amount_limit * b.alert_threshold / 100.0
      then 'warning'
    else 'ok'
  end as status
from public.budgets b
left join public.categories c on c.id = b.category_id
left join public.expenses e
  on e.user_id = b.user_id
 and e.expense_date >= b.month
 and e.expense_date < (b.month + interval '1 month')::date
 and (b.category_id is null or e.category_id = b.category_id)
group by
  b.id,
  b.user_id,
  b.category_id,
  c.name,
  c.icon,
  c.color,
  b.month,
  b.amount_limit,
  b.alert_threshold;

grant select on public.budget_status to authenticated;
revoke all on public.budget_status from anon;

-- ---------------------------------------------------------------------------
-- Vues agrégées du tableau de bord
-- ---------------------------------------------------------------------------

create or replace view public.dashboard_daily_stats
with (security_invoker = true)
as
select
  e.user_id,
  date_trunc('month', e.expense_date)::date as month,
  e.expense_date as day,
  round(sum(e.amount), 3) as total_amount,
  count(*) as expense_count
from public.expenses e
group by
  e.user_id,
  date_trunc('month', e.expense_date)::date,
  e.expense_date;

create or replace view public.dashboard_monthly_stats
with (security_invoker = true)
as
select
  e.user_id,
  date_trunc('month', e.expense_date)::date as month,
  round(sum(e.amount), 3) as total_amount,
  count(*) as expense_count
from public.expenses e
group by e.user_id, date_trunc('month', e.expense_date)::date;

create or replace view public.dashboard_category_stats
with (security_invoker = true)
as
select
  e.user_id,
  date_trunc('month', e.expense_date)::date as month,
  e.category_id,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color,
  round(sum(e.amount), 3) as total_amount,
  count(*) as expense_count
from public.expenses e
left join public.categories c on c.id = e.category_id
group by
  e.user_id,
  date_trunc('month', e.expense_date)::date,
  e.category_id,
  c.name,
  c.icon,
  c.color;

create or replace view public.dashboard_merchant_stats
with (security_invoker = true)
as
select
  e.user_id,
  date_trunc('month', e.expense_date)::date as month,
  e.merchant,
  round(sum(e.amount), 3) as total_amount,
  count(*) as expense_count
from public.expenses e
group by
  e.user_id,
  date_trunc('month', e.expense_date)::date,
  e.merchant;

create or replace view public.dashboard_recent_expenses
with (security_invoker = true)
as
select
  e.id,
  e.user_id,
  e.category_id,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color,
  e.merchant,
  e.amount,
  e.expense_date,
  e.note,
  e.payment_method,
  e.created_at,
  date_trunc('month', e.expense_date)::date as month,
  row_number() over (
    partition by e.user_id, date_trunc('month', e.expense_date)
    order by e.expense_date desc, e.created_at desc
  ) as month_rank
from public.expenses e
left join public.categories c on c.id = e.category_id;

grant select on public.dashboard_daily_stats to authenticated;
grant select on public.dashboard_monthly_stats to authenticated;
grant select on public.dashboard_category_stats to authenticated;
grant select on public.dashboard_merchant_stats to authenticated;
grant select on public.dashboard_recent_expenses to authenticated;

revoke all on public.dashboard_daily_stats from anon;
revoke all on public.dashboard_monthly_stats from anon;
revoke all on public.dashboard_category_stats from anon;
revoke all on public.dashboard_merchant_stats from anon;
revoke all on public.dashboard_recent_expenses from anon;

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
