begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(14);

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
  (id, campaign_id, name, player_visible, created_by)
values (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Greyhaven',
  true,
  '10000000-0000-4000-8000-000000000001'
);

insert into public.campaign_maps
  (id, campaign_id, parent_map_id, location_id, name, map_type,
   player_visible, artwork_path, mime_type, file_size, created_by)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    null,
    null,
    'Known World',
    'world',
    true,
    '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001/artwork',
    'image/png',
    32,
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    null,
    null,
    'Secret Cavern',
    'dungeon',
    false,
    '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000002/artwork',
    'image/png',
    32,
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Greyhaven Streets',
    'city',
    true,
    '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000003/artwork',
    'image/png',
    32,
    '10000000-0000-4000-8000-000000000001'
  );

insert into storage.objects (bucket_id, name, owner, metadata)
values
  (
    'campaign-maps',
    '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001/artwork',
    '10000000-0000-4000-8000-000000000001',
    '{"mimetype":"image/png","size":32}'::jsonb
  ),
  (
    'campaign-maps',
    '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000002/artwork',
    '10000000-0000-4000-8000-000000000001',
    '{"mimetype":"image/png","size":32}'::jsonb
  ),
  (
    'campaign-maps',
    '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000003/artwork',
    '10000000-0000-4000-8000-000000000001',
    '{"mimetype":"image/png","size":32}'::jsonb
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_maps),
  3,
  'GM can read maps regardless of player visibility'
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'campaign-maps'),
  3,
  'GM can read all map artwork'
);
select lives_ok(
  $$
    update storage.objects
    set metadata = '{"mimetype":"image/png","size":64}'::jsonb
    where bucket_id = 'campaign-maps'
      and name = '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001/artwork'
  $$,
  'GM can replace an existing map artwork object in place'
);
select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner, metadata)
    values (
      'campaign-maps',
      '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001/artwork-50000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001',
      '{"mimetype":"image/webp","size":64}'::jsonb
    )
  $$,
  'GM can upload staged map artwork before changing the map record'
);
select lives_ok(
  $$
    update public.campaign_maps
    set artwork_path = '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001/artwork-50000000-0000-4000-8000-000000000001',
        mime_type = 'image/webp',
        file_size = 64
    where id = '40000000-0000-4000-8000-000000000001'
  $$,
  'GM can switch the map to staged artwork after upload'
);
select throws_ok(
  $$
    update public.campaign_maps
    set player_visible = false
    where id = '40000000-0000-4000-8000-000000000001'
  $$,
  '23514',
  'A map with player-visible child maps cannot be hidden.',
  'a visible parent map cannot be hidden while a child remains visible'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_maps),
  2,
  'player can read only shared maps'
);
select is(
  (select count(*)::integer
   from public.campaign_maps
   where name = 'Secret Cavern'),
  0,
  'player cannot read hidden map records'
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'campaign-maps'),
  2,
  'player can read artwork only for shared maps'
);
select is(
  (select count(*)::integer
   from storage.objects
   where name = '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000002/artwork'),
  0,
  'player cannot read the stored artwork of a hidden map'
);
select is(
  (select count(*)::integer
   from storage.objects
   where bucket_id = 'campaign-maps'
     and name = '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001/artwork-50000000-0000-4000-8000-000000000001'),
  1,
  'player can read staged artwork only after the map points to it'
);
select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner, metadata)
    values (
      'campaign-maps',
      '00000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001/artwork',
      '10000000-0000-4000-8000-000000000002',
      '{"mimetype":"image/png","size":64}'::jsonb
    )
  $$,
  '42501',
  null,
  'player cannot upload or replace map artwork'
);
select throws_ok(
  $$
    insert into public.campaign_maps
      (campaign_id, parent_map_id, name, map_type, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000002',
      'Secret Child Map',
      'interior',
      true
    )
  $$,
  '23514',
  'A player-visible map must have a player-visible parent map.',
  'a visible child map cannot expose a hidden parent'
);
select is(
  (select count(*)::integer
   from public.campaign_maps
   where name = 'Secret Cavern'
     and player_visible = false),
  0,
  'private map hierarchy is not exposed after rejected visibility changes'
);

select * from finish();
rollback;
