-- Politiques Storage du bucket privé "receipts".
-- Chemin imposé : receipts/{auth.uid()}/fichier
--
-- IMPORTANT (Supabase hébergé) : le rôle `postgres` du SQL Editor n'est pas
-- propriétaire de `storage.objects`. Exécuter ce fichier renvoie
-- `ERROR: 42501: must be owner of table objects`.
--
-- Sur un projet hébergé, crée le bucket et ses 4 politiques depuis le
-- Dashboard :
--   1. Storage > New bucket > id et nom `receipts`, Public désactivé.
--   2. Storage > Policies > bucket `receipts` > New policy > Custom.
--   3. Pour chaque opération (SELECT, INSERT, UPDATE, DELETE), utiliser
--      l'expression ci-dessous dans USING (SELECT/UPDATE/DELETE) ou
--      WITH CHECK (INSERT/UPDATE), rôle cible `authenticated`.
--
-- Sur un projet local/auto-hébergé (npx supabase start), ce fichier peut
-- être exécuté tel quel.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

-- SELECT
create policy "receipts_select_own_folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- INSERT
create policy "receipts_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- UPDATE
create policy "receipts_update_own_folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- DELETE
create policy "receipts_delete_own_folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
