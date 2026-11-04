begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(11);

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

insert into public.campaign_map_overlays
  (id, campaign_id, map_id, name, overlay_type, points, color, player_visible)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Shared Region',
    'region',
    '[{"x":0.1,"y":0.1},{"x":0.8,"y":0.15},{"x":0.7,"y":0.8}]',
    '#22aa66',
    true
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Private Route',
    'route',
    '[{"x":0.1,"y":0.2},{"x":0.7,"y":0.9}]',
    '#cc3355',
    false
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    'Overlay on Hidden Map',
    'region',
    '[{"x":0.1,"y":0.1},{"x":0.8,"y":0.15},{"x":0.7,"y":0.8}]',
    '#22aa66',
    true
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_map_overlays),
  3,
  'GM can read all map overlays'
);
select lives_ok(
  $$
    insert into public.campaign_map_overlays
      (campaign_id, map_id, name, overlay_type, points, color)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'New Route',
      'route',
      '[{"x":0.2,"y":0.3},{"x":0.7,"y":0.8}]',
      '#abcdef'
    )
  $$,
  'GM can create a map overlay'
);
select lives_ok(
  $$
    update public.campaign_map_overlays
    set color = '#dd8844'
    where id = '60000000-0000-4000-8000-000000000002'
  $$,
  'GM can update an overlay style'
);
select throws_ok(
  $$
    insert into public.campaign_map_overlays
      (campaign_id, map_id, name, overlay_type, points)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Invalid Region',
      'region',
      '[{"x":0.1,"y":0.1},{"x":0.8,"y":0.15}]'
    )
  $$,
  '23514',
  null,
  'region overlays require at least three points'
);
select throws_ok(
  $$
    insert into public.campaign_map_overlays
      (campaign_id, map_id, name, overlay_type, points)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Out of bounds',
      'route',
      '[{"x":0.1,"y":0.1},{"x":1.5,"y":0.8}]'
    )
  $$,
  '23514',
  null,
  'overlay coordinates must remain within the map'
);
select throws_ok(
  $$
    insert into public.campaign_map_overlays
      (campaign_id, map_id, name, overlay_type, points)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Malformed Points',
      'route',
      '[{"x":0.1},{"x":0.8,"y":0.8}]'
    )
  $$,
  '23514',
  null,
  'every overlay point must contain numeric x and y coordinates'
);
select throws_ok(
  $$
    insert into public.campaign_map_overlays
      (campaign_id, map_id, name, overlay_type, points, color)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Invalid Color',
      'route',
      '[{"x":0.1,"y":0.1},{"x":0.8,"y":0.8}]',
      'red'
    )
  $$,
  '23514',
  null,
  'overlay colors must be six-digit hexadecimal values'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_map_overlays),
  1,
  'player can read only shared overlays on shared maps'
);
select is(
  (select count(*)::integer
   from public.campaign_map_overlays
   where name = 'Private Route'),
  0,
  'player cannot read GM-only overlays'
);
select is(
  (select count(*)::integer
   from public.campaign_map_overlays
   where name = 'Overlay on Hidden Map'),
  0,
  'player cannot read overlays from hidden maps'
);
select throws_ok(
  $$
    insert into public.campaign_map_overlays
      (campaign_id, map_id, name, overlay_type, points, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      'Player Region',
      'region',
      '[{"x":0.1,"y":0.1},{"x":0.8,"y":0.15},{"x":0.7,"y":0.8}]',
      true
    )
  $$,
  '42501',
  null,
  'player cannot create map overlays'
);
select * from finish();
rollback;
