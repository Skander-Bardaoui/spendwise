-- Statut des budgets par rapport aux dépenses du mois.
-- security_invoker : les politiques RLS des tables sous-jacentes s'appliquent.

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
