begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(4);

select ok(
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'campaign_members'
      and column_name = 'login_id'
  ),
  'campaign members have a login ID column'
);

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'login-gm@example.test'),
  ('10000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'login-player@example.test'),
  ('10000000-0000-4000-8000-000000000013', 'authenticated', 'authenticated', 'login-duplicate@example.test'),
  ('10000000-0000-4000-8000-000000000014', 'authenticated', 'authenticated', 'login-invalid@example.test')
on conflict (id) do nothing;

insert into public.campaign_members (campaign_id, user_id, role, login_id)
values
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000011', 'gm', 'gm_login'),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000012', 'player', 'player_login');

select is(
  (select count(*)::integer
   from public.campaign_members
   where login_id in ('gm_login', 'player_login')),
  2,
  'valid login IDs can be assigned'
);

select throws_ok(
  $$
    insert into public.campaign_members (campaign_id, user_id, role, login_id)
    values (
      '00000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000013',
      'player',
      'player_login'
    )
  $$,
  '23505',
  null,
  'login IDs must be unique'
);

select throws_ok(
  $$
    insert into public.campaign_members (campaign_id, user_id, role, login_id)
    values (
      '00000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000014',
      'player',
      'Bad ID'
    )
  $$,
  '23514',
  null,
  'login IDs must use the supported format'
);

select * from finish();
rollback;
