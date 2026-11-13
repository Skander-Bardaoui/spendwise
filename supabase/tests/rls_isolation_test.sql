-- Tests manuels d'isolation RLS avec deux utilisateurs.
--
-- À exécuter dans le SQL Editor d'un projet Supabase de développement.
-- Tout est encapsulé dans une transaction et annulé par ROLLBACK.
--
-- Prérequis : les migrations
--   20261113154718_init_expense_tracker.sql
--   20261113160000_rls_and_receipts_bucket.sql
-- doivent être appliquées.

begin;

-- ---------------------------------------------------------------------------
-- Nettoyage éventuel des données de test
-- ---------------------------------------------------------------------------

delete from storage.objects
where bucket_id = 'receipts'
  and (storage.foldername(name))[1] in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  );

delete from auth.users
where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- ---------------------------------------------------------------------------
-- Deux utilisateurs (le trigger handle_new_user crée leurs profils)
-- ---------------------------------------------------------------------------

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'alice@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Alice"}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'bob@test.local',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Bob"}'::jsonb,
    now(),
    now()
  );

-- ---------------------------------------------------------------------------
-- Données isolées pour chaque utilisateur
-- ---------------------------------------------------------------------------

insert into public.categories (id, user_id, name, icon, color)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Catégorie Alice',
    'tag',
    '#111111'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Catégorie Bob',
    'tag',
    '#222222'
  );

insert into public.expenses (
  user_id,
  category_id,
  merchant,
  amount,
  expense_date,
  payment_method
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Boutique Alice',
    10.500,
    current_date,
    'card'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Boutique Bob',
    20.000,
    current_date,
    'cash'
  );

insert into public.budgets (user_id, category_id, amount_limit, month)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    100.000,
    date_trunc('month', current_date)::date
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    200.000,
    date_trunc('month', current_date)::date
  );

insert into public.recurring_expenses (
  user_id,
  category_id,
  merchant,
  amount,
  frequency,
  next_date
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Abonnement Alice',
    5.000,
    'monthly',
    current_date + 30
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Abonnement Bob',
    6.000,
    'weekly',
    current_date + 7
  );

insert into public.expense_templates (user_id, name, category_id, merchant, amount)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Café Alice',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Café',
    2.500
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Bus Bob',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Bus',
    1.500
  );

insert into storage.objects (id, bucket_id, name, owner)
values
  (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/alice.pdf',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    gen_random_uuid(),
    'receipts',
    '22222222-2222-2222-2222-222222222222/bob.pdf',
    '22222222-2222-2222-2222-222222222222'
  );

-- ===========================================================================
-- Alice
-- ===========================================================================

set local role authenticated;

select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

do $$
declare
  v_count integer;
  v_defaults integer;
  v_rows integer;
begin
  -- SELECT : une seule ligne visible par table
  select count(*) into v_count from public.profiles;
  if v_count <> 1 then
    raise exception 'Alice: % profil(s) visible(s), attendu 1', v_count;
  end if;

  select count(*) into v_count from public.expenses;
  if v_count <> 1 then
    raise exception 'Alice: % dépense(s) visible(s), attendu 1', v_count;
  end if;

  select count(*) into v_count
  from public.expenses
  where user_id = '22222222-2222-2222-2222-222222222222';
  if v_count <> 0 then
    raise exception 'Alice voit les dépenses de Bob';
  end if;

  select count(*) into v_defaults from public.categories where user_id is null;
  select count(*) into v_count from public.categories;
  if v_count <> v_defaults + 1 then
    raise exception 'Alice: % catégorie(s) visible(s), attendu % (défauts + 1)',
      v_count, v_defaults + 1;
  end if;

  select count(*) into v_count from public.budgets;
  if v_count <> 1 then
    raise exception 'Alice: % budget(s) visible(s), attendu 1', v_count;
  end if;

  select count(*) into v_count from public.recurring_expenses;
  if v_count <> 1 then
    raise exception 'Alice: % récurrence(s) visible(s), attendu 1', v_count;
  end if;

  select count(*) into v_count from public.expense_templates;
  if v_count <> 1 then
    raise exception 'Alice: % template(s) visible(s), attendu 1', v_count;
  end if;

  -- UPDATE / DELETE croisés : aucune ligne affectée
  update public.expenses set amount = 999
  where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Alice a modifié une dépense de Bob';
  end if;

  delete from public.expenses
  where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Alice a supprimé une dépense de Bob';
  end if;

  update public.profiles set full_name = 'Pirate'
  where id = '22222222-2222-2222-2222-222222222222';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Alice a modifié le profil de Bob';
  end if;

  -- INSERT croisés : refusés par WITH CHECK (SQLSTATE 42501)
  begin
    insert into public.expenses (user_id, merchant, amount, payment_method)
    values ('22222222-2222-2222-2222-222222222222', 'Intrusion', 1, 'cash');
    raise exception 'Alice a pu insérer une dépense pour Bob';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.profiles (id, full_name)
    values ('22222222-2222-2222-2222-222222222222', 'Intrusion');
    raise exception 'Alice a pu insérer le profil de Bob';
  exception
    when insufficient_privilege then null;
  end;

  raise notice 'Alice: isolation SELECT/INSERT/UPDATE/DELETE validée';
end;
$$;

-- CRUD légitime sur ses propres lignes
insert into public.expenses (
  user_id,
  category_id,
  merchant,
  amount,
  payment_method
)
values (
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Dépense légitime Alice',
  7.250,
  'transfer'
);

do $$
declare
  v_rows integer;
begin
  update public.expenses set amount = 7.500
  where merchant = 'Dépense légitime Alice';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'Alice: UPDATE de sa dépense a affecté % ligne(s), attendu 1', v_rows;
  end if;

  delete from public.expenses
  where merchant = 'Dépense légitime Alice';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'Alice: DELETE de sa dépense a affecté % ligne(s), attendu 1', v_rows;
  end if;

  raise notice 'Alice: CRUD sur ses propres lignes validé';
end;
$$;

-- Catégories : défauts en lecture seule, écriture limitée aux siennes
do $$
declare
  v_count integer;
  v_rows integer;
begin
  update public.categories set color = '#000000' where user_id is null;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Alice a modifié une catégorie par défaut';
  end if;

  begin
    insert into public.categories (user_id, name)
    values (null, 'Catégorie globale pirate');
    raise exception 'Alice a pu insérer une catégorie par défaut';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.categories (user_id, name)
    values ('22222222-2222-2222-2222-222222222222', 'Catégorie pirate');
    raise exception 'Alice a pu insérer une catégorie pour Bob';
  exception
    when insufficient_privilege then null;
  end;

  delete from public.categories
  where user_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Alice a supprimé une catégorie de Bob';
  end if;

  insert into public.categories (user_id, name, icon, color)
  values (
    '11111111-1111-1111-1111-111111111111',
    'Catégorie légitime Alice',
    'tag',
    '#ABC123'
  );

  select count(*) into v_count
  from public.categories
  where user_id = '11111111-1111-1111-1111-111111111111';
  if v_count <> 2 then
    raise exception 'Alice: % catégorie(s) personnelle(s), attendu 2', v_count;
  end if;

  raise notice 'Alice: règles catégories validées';
end;
$$;

-- Storage : uniquement le dossier {auth.uid()}/
do $$
declare
  v_count integer;
  v_rows integer;
begin
  select count(*) into v_count
  from storage.objects
  where bucket_id = 'receipts';
  if v_count <> 1 then
    raise exception 'Alice: % reçu(s) visible(s), attendu 1', v_count;
  end if;

  insert into storage.objects (id, bucket_id, name, owner)
  values (
    gen_random_uuid(),
    'receipts',
    '11111111-1111-1111-1111-111111111111/own.pdf',
    '11111111-1111-1111-1111-111111111111'
  );

  select count(*) into v_count
  from storage.objects
  where bucket_id = 'receipts';
  if v_count <> 2 then
    raise exception 'Alice: % reçu(s) visible(s) après upload, attendu 2', v_count;
  end if;

  begin
    insert into storage.objects (id, bucket_id, name, owner)
    values (
      gen_random_uuid(),
      'receipts',
      '22222222-2222-2222-2222-222222222222/intrusion.pdf',
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'Alice a pu écrire dans le dossier de Bob';
  exception
    when insufficient_privilege then null;
  end;

  update storage.objects set metadata = '{"test":true}'::jsonb
  where bucket_id = 'receipts'
    and name = '22222222-2222-2222-2222-222222222222/bob.pdf';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Alice a modifié un reçu de Bob';
  end if;

  delete from storage.objects
  where bucket_id = 'receipts'
    and name = '22222222-2222-2222-2222-222222222222/bob.pdf';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Alice a supprimé un reçu de Bob';
  end if;

  raise notice 'Alice: isolation du bucket receipts validée';
end;
$$;

reset role;

-- ===========================================================================
-- Bob
-- ===========================================================================

set local role authenticated;

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}',
  true
);

do $$
declare
  v_count integer;
  v_defaults integer;
  v_rows integer;
begin
  select count(*) into v_count from public.profiles;
  if v_count <> 1 then
    raise exception 'Bob: % profil(s) visible(s), attendu 1', v_count;
  end if;

  select count(*) into v_count from public.expenses;
  if v_count <> 1 then
    raise exception 'Bob: % dépense(s) visible(s), attendu 1', v_count;
  end if;

  select count(*) into v_count
  from public.expenses
  where user_id = '11111111-1111-1111-1111-111111111111';
  if v_count <> 0 then
    raise exception 'Bob voit les dépenses d''Alice';
  end if;

  select count(*) into v_defaults from public.categories where user_id is null;
  select count(*) into v_count from public.categories;
  if v_count <> v_defaults + 1 then
    raise exception 'Bob: % catégorie(s) visible(s), attendu % (défauts + 1)',
      v_count, v_defaults + 1;
  end if;

  select count(*) into v_count
  from public.categories
  where user_id = '11111111-1111-1111-1111-111111111111';
  if v_count <> 0 then
    raise exception 'Bob voit les catégories d''Alice';
  end if;

  select count(*) into v_count from public.budgets;
  if v_count <> 1 then
    raise exception 'Bob: % budget(s) visible(s), attendu 1', v_count;
  end if;

  select count(*) into v_count
  from storage.objects
  where bucket_id = 'receipts';
  if v_count <> 1 then
    raise exception 'Bob: % reçu(s) visible(s), attendu 1', v_count;
  end if;

  update public.expenses set amount = 999
  where user_id = '11111111-1111-1111-1111-111111111111';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Bob a modifié une dépense d''Alice';
  end if;

  begin
    insert into public.expenses (user_id, merchant, amount, payment_method)
    values ('11111111-1111-1111-1111-111111111111', 'Intrusion', 1, 'cash');
    raise exception 'Bob a pu insérer une dépense pour Alice';
  exception
    when insufficient_privilege then null;
  end;

  raise notice 'Bob: isolation SELECT/INSERT/UPDATE/STORAGE validée';
end;
$$;

reset role;

-- Aucune donnée de test n'est conservée.
rollback;

select 'Tests RLS terminés : transaction annulée.' as resultat;
