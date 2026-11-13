-- ---------------------------------------------------------------------------
-- Vues agrégées du tableau de bord
-- Toutes les vues sont en security_invoker : les policies RLS de public.expenses
-- et public.categories s'appliquent automatiquement à l'utilisateur connecté.
-- ---------------------------------------------------------------------------

-- Totaux par jour pour un mois donné.
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

-- Totaux mensuels (KPI, variation vs mois précédent, tendance 6 mois).
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

-- Répartition par catégorie (camembert) avec couleur et icône.
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

-- Agrégats par commerçant (top 5).
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

-- Les 5 dernières dépenses de chaque mois (month_rank <= 5).
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
