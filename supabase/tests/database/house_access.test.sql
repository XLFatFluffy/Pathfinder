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
  (id, campaign_id, name, location_type, player_visible)
values (
  '20000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Alderhold',
  'city',
  true
);

insert into public.campaign_npcs
  (id, campaign_id, name, status, player_visible)
values (
  '50000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Lady Rowan',
  'Alive',
  true
);

insert into public.campaign_houses
  (id, campaign_id, name, motto, description, player_visible)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'House Rowan',
    'Stand fast',
    'A respected old family.',
    true
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'House Ash',
    '',
    '',
    false
  );

insert into public.campaign_house_gm_details
  (campaign_id, house_id, secrets)
values (
  '00000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  'The family is hiding its true heir.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_houses),
  2,
  'GM can read visible and hidden noble houses'
);
select is(
  (select count(*)::integer from public.campaign_house_gm_details),
  1,
  'GM can read noble-house secrets'
);
select lives_ok(
  $$
    select public.save_campaign_house(
      '00000000-0000-4000-8000-000000000001',
      null,
      'House Vale',
      'A silver tower on blue',
      'Above the storm',
      'A family of renowned navigators.',
      false,
      'Founded after the first great crossing.',
      '50000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      'Three coastal estates.',
      'The eldest child inherits.',
      'A small but disciplined guard.',
      'Comfortable',
      'Ships and salt',
      'Strong in the western ports.',
      'Keeps the old sea rites.',
      'Secure the eastern trade route.',
      'The heir has secretly made a pact.'
    )
  $$,
  'GM can create a house profile and private details atomically'
);
select ok(
  exists (
    select 1
    from public.campaign_houses as house
    join public.campaign_house_gm_details as details
      on details.campaign_id = house.campaign_id
      and details.house_id = house.id
    where house.name = 'House Vale'
      and details.current_ruler_id = '50000000-0000-4000-8000-000000000001'
      and details.ancestral_seat_location_id = '20000000-0000-4000-8000-000000000001'
      and details.secrets = 'The heir has secretly made a pact.'
  ),
  'house links and GM-only details are stored with the profile'
);
select lives_ok(
  $$
    select public.save_campaign_house(
      '00000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000001',
      'House Rowan',
      'A red branch on white',
      'Stand together',
      'A respected family of wardens.',
      true,
      'The first Rowan was a border captain.',
      '50000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      'The northern marches.',
      'The crown chooses the heir.',
      'A veteran patrol.',
      'Modest',
      'Timber and iron',
      'Trusted by the northern towns.',
      'Honors the hearth saints.',
      'Protect the border.',
      'The heir has an unknown sibling.'
    )
  $$,
  'GM can update a house and its private details'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_houses),
  1,
  'player can read only houses the GM has shared'
);
select is(
  (select count(*)::integer from public.campaign_house_gm_details),
  0,
  'player cannot read ruler links, holdings, objectives, or house secrets'
);
select throws_ok(
  $$
    insert into public.campaign_houses (campaign_id, name, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      'Player-created house',
      true
    )
  $$,
  '42501',
  null,
  'player cannot create noble houses'
);
update public.campaign_houses
set description = 'Player changed canon.'
where id = '60000000-0000-4000-8000-000000000001';
select is(
  (select description
   from public.campaign_houses
   where id = '60000000-0000-4000-8000-000000000001'),
  'A respected family of wardens.',
  'player cannot change a shared noble-house profile'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
delete from public.campaign_houses
where id = '60000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer
   from public.campaign_houses
   where id = '60000000-0000-4000-8000-000000000001'),
  0,
  'GM can delete a noble house'
);
select is(
  (select count(*)::integer
   from public.campaign_house_gm_details
   where house_id = '60000000-0000-4000-8000-000000000001'),
  0,
  'deleting a house also removes its private details'
);

select * from finish();
rollback;
