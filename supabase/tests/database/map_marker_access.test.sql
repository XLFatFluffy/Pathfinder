begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(10);

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'gm@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'player@example.test')
on conflict (id) do nothing;

insert into public.campaign_members (campaign_id, user_id, role)
values
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'gm'),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'player')
on conflict (campaign_id, user_id) do nothing;

insert into public.campaign_locations
  (id, campaign_id, name, player_visible, created_by)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Shared City',
    true,
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Secret Lair',
    false,
    '10000000-0000-4000-8000-000000000001'
  );

insert into public.campaign_maps
  (id, campaign_id, name, map_type, player_visible)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Shared Map',
    'world',
    true
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Hidden Map',
    'world',
    false
  );

insert into public.campaign_map_markers
  (id, campaign_id, map_id, location_id, name, marker_type, x, y, player_visible)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Shared City Marker',
    'city',
    0.25,
    0.75,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002',
    'Hidden Location Marker',
    'hidden',
    0.5,
    0.5,
    true
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    null,
    'Private Marker',
    'ruins',
    0.7,
    0.4,
    false
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    null,
    'Marker on Hidden Map',
    'landmark',
    0.2,
    0.2,
    true
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_map_markers),
  4,
  'GM can read all campaign map markers'
);
select lives_ok(
  $$
    insert into public.campaign_map_markers
      (campaign_id, map_id, name, marker_type, x, y)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'New Marker',
      'landmark',
      0.1,
      0.9
    )
  $$,
  'GM can add a marker at normalized map coordinates'
);
select lives_ok(
  $$
    update public.campaign_map_markers
    set x = 0.3, y = 0.6
    where id = '50000000-0000-4000-8000-000000000001'
  $$,
  'GM can move an existing map marker'
);
select throws_ok(
  $$
    insert into public.campaign_map_markers
      (campaign_id, map_id, name, marker_type, x, y)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Out of bounds',
      'city',
      1.5,
      0.5
    )
  $$,
  '23514',
  null,
  'marker coordinates must stay within the artwork'
);
select lives_ok(
  $$
    delete from public.campaign_map_markers
    where id = '50000000-0000-4000-8000-000000000004'
  $$,
  'GM can delete a campaign map marker'
);
select throws_ok(
  $$
    insert into public.campaign_map_markers
      (campaign_id, map_id, name, marker_type, x, y, created_by)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Spoofed creator',
      'landmark',
      0.4,
      0.4,
      '10000000-0000-4000-8000-000000000002'
    )
  $$,
  '42501',
  null,
  'GM cannot assign a marker to another user as its creator'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_map_markers),
  1,
  'player can read only markers for shared maps and visible locations'
);
select is(
  (select count(*)::integer
   from public.campaign_map_markers
   where name = 'Hidden Location Marker'),
  0,
  'player cannot discover a marker linked to a hidden location'
);
select is(
  (select count(*)::integer
   from public.campaign_map_markers
   where name = 'Marker on Hidden Map'),
  0,
  'player cannot discover markers on hidden maps'
);
select throws_ok(
  $$
    insert into public.campaign_map_markers
      (campaign_id, map_id, name, marker_type, x, y, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Player Marker',
      'city',
      0.5,
      0.5,
      true
    )
  $$,
  '42501',
  null,
  'player cannot create campaign markers'
);

select * from finish();
rollback;
