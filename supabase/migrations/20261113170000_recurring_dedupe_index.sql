-- Empêche les doublons lors de la génération des dépenses récurrentes.
-- Les dépenses manuelles ont recurring_id NULL : PostgreSQL considère chaque
-- NULL comme distinct, elles ne sont donc pas contraintes par cet index.
create unique index if not exists expenses_recurring_occurrence_unique
  on public.expenses (recurring_id, expense_date);
