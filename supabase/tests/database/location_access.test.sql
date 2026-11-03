begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(8);

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
  )
on conflict (campaign_id, user_id) do nothing;

insert into public.campaign_locations
  (id, campaign_id, name, location_type, description, player_visible, created_by)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Greyhaven',
    'city',
    'A busy port city.',
    true,
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Hidden Catacombs',
    'dungeon',
    'A sealed entrance beneath the city.',
    false,
    '10000000-0000-4000-8000-000000000001'
  );

insert into public.campaign_location_gm_notes
  (campaign_id, location_id, notes)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'The harbor master is secretly a cultist.'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$
    select public.create_campaign_location(
      '00000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      'Lantern Tower',
      'building',
      'A watchtower above the harbor.',
      false,
      'The bell signals the hidden cult.'
    )
  $$,
  'GM can create a parent-linked location and private notes atomically'
);
select is(
  (select count(*)::integer from public.campaign_locations),
  3,
  'GM can read visible and hidden locations'
);
select is(
  (select count(*)::integer from public.campaign_location_gm_notes),
  2,
  'GM can read separate private location notes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_locations),
  1,
  'player can read only player-visible locations'
);
select is(
  (select count(*)::integer
   from public.campaign_locations
   where name = 'Hidden Catacombs'),
  0,
  'player cannot read hidden location records'
);
select is(
  (select count(*)::integer from public.campaign_location_gm_notes),
  0,
  'player cannot read private location notes, even for visible locations'
);
select throws_ok(
  $$
    insert into public.campaign_locations
      (campaign_id, name, player_visible)
    values
      ('00000000-0000-4000-8000-000000000001', 'Player-created place', true)
  $$,
  '42501',
  null,
  'player cannot create campaign locations'
);
select throws_ok(
  $$
    select public.create_campaign_location(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Player-created through RPC',
      '',
      '',
      true,
      ''
    )
  $$,
  '42501',
  'Only a campaign GM can create locations.',
  'player cannot create locations through the atomic RPC'
);

select * from finish();
rollback;
