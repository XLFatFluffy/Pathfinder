begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(5);

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'gm@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'player@example.test')
on conflict (id) do nothing;

insert into public.campaign_members (campaign_id, user_id, role)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'gm'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'player'
  );

insert into public.campaign_journal_entries
  (campaign_id, title, content, player_visible, created_by)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Public rumor',
    'A merchant saw strange lights.',
    true,
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    'GM secret',
    'The merchant is an informant.',
    false,
    '10000000-0000-4000-8000-000000000001'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_journal_entries),
  2,
  'GM can read player-visible and GM-only journal entries'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_journal_entries),
  1,
  'player can read only player-visible journal entries'
);
select is(
  (select count(*)::integer
   from public.campaign_journal_entries
   where title = 'GM secret'),
  0,
  'player cannot read GM-only journal content'
);
select ok(
  not has_table_privilege('authenticated', 'public.campaign_members', 'INSERT')
  and not has_table_privilege('authenticated', 'public.campaign_members', 'UPDATE'),
  'authenticated users cannot assign or change campaign roles'
);
select throws_ok(
  $$
    insert into public.campaign_journal_entries
      (campaign_id, title, player_visible)
    values
      ('00000000-0000-4000-8000-000000000001', 'Player-created entry', true)
  $$,
  '42501',
  null,
  'player cannot create campaign journal entries'
);

select * from finish();
rollback;
