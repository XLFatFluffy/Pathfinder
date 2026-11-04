begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'gm@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'player@example.test'),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'other-player@example.test')
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
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'player'
  )
on conflict (campaign_id, user_id) do nothing;

insert into public.campaign_player_notes
  (id, campaign_id, user_id, title, content)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'My clues',
    'A private player note.'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'Another player clue',
    'This belongs to a different player.'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_player_notes),
  1,
  'player can read only their own notes'
);
select lives_ok(
  $$
    insert into public.campaign_player_notes (campaign_id, user_id, title, content)
    values (
      '00000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000002',
      'Session reminders',
      'Bring the silver key.'
    )
  $$,
  'player can create their own private notes'
);
select throws_ok(
  $$
    insert into public.campaign_player_notes (campaign_id, user_id, title)
    values (
      '00000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000003',
      'Impersonated note'
    )
  $$,
  '42501',
  null,
  'player cannot create a note for another player'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.campaign_player_notes),
  1,
  'another player cannot read someone else’s notes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_player_notes),
  0,
  'GM cannot read player-private notes'
);
select throws_ok(
  $$
    insert into public.campaign_player_notes (campaign_id, user_id, title)
    values (
      '00000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      'GM-created player note'
    )
  $$,
  '42501',
  null,
  'GM cannot create notes in a player’s private space'
);

select * from finish();
rollback;
