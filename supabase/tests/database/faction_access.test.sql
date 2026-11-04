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
  'Sera Vint',
  'Alive',
  true
);

insert into public.campaign_factions
  (id, campaign_id, name, faction_type, description, player_visible)
values
  (
    '70000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Harbor Guild',
    'Merchant guild',
    'A cooperative of the city’s traders.',
    true
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'The Veiled Choir',
    'Secret society',
    'A group rumored to meet after dark.',
    false
  );

insert into public.campaign_faction_gm_details
  (campaign_id, faction_id, objectives, secrets)
values (
  '00000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000001',
  'Control the eastern shipping lanes.',
  'The guildmaster is secretly bankrupt.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_factions),
  2,
  'GM can read both known and hidden factions'
);
select is(
  (select count(*)::integer from public.campaign_faction_gm_details),
  1,
  'GM can read hidden faction objectives and details'
);
select lives_ok(
  $$
    select public.save_campaign_faction(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Lantern Wardens',
      'Civic order',
      'A volunteer organization that keeps the old quarter safe.',
      '50000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      true,
      'Protect the old quarter from political interference.',
      'A network of safehouses and retired guards.',
      'Well regarded among neighborhood merchants.',
      'Local volunteers and former watch members.',
      'Cooperates with the Harbor Guild.',
      'Investigating a string of missing lanterns.',
      'Formed after the winter fires.',
      'Their founder still directs them anonymously.'
    )
  $$,
  'GM can create a faction with relational links and private details atomically'
);
select ok(
  exists (
    select 1
    from public.campaign_factions as faction
    join public.campaign_faction_gm_details as details
      on details.campaign_id = faction.campaign_id
      and details.faction_id = faction.id
    where faction.name = 'Lantern Wardens'
      and faction.leader_npc_id = '50000000-0000-4000-8000-000000000001'
      and faction.headquarters_location_id = '20000000-0000-4000-8000-000000000001'
      and details.secrets = 'Their founder still directs them anonymously.'
  ),
  'faction leader, headquarters, and private information are linked'
);
select lives_ok(
  $$
    select public.save_campaign_faction(
      '00000000-0000-4000-8000-000000000001',
      '70000000-0000-4000-8000-000000000001',
      'Harbor Guild',
      'Merchant guild',
      'A cooperative of the city’s traders.',
      null,
      null,
      true,
      'Regulate the eastern shipping lanes.',
      'Ships and warehouses.',
      'Strong among the port merchants.',
      'Shopkeepers and captains.',
      'Rivalry with the inland brokers.',
      'Negotiating a new harbor tariff.',
      'Established by the first dockmasters.',
      'Their books conceal a private militia.'
    )
  $$,
  'GM can update a faction and its private information'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_factions),
  2,
  'player can read only factions shared by the GM'
);
select is(
  (select count(*)::integer from public.campaign_faction_gm_details),
  0,
  'player cannot read faction objectives, membership, or secrets'
);
select throws_ok(
  $$
    insert into public.campaign_factions (campaign_id, name, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      'Player-created faction',
      true
    )
  $$,
  '42501',
  null,
  'player cannot create campaign factions'
);
select throws_ok(
  $$
    select public.save_campaign_faction(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Player-created through RPC',
      '',
      '',
      null,
      null,
      true,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    )
  $$,
  '42501',
  'Only a campaign GM can manage factions.',
  'player cannot manage factions through the RPC'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
delete from public.campaign_factions
where id = '70000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer
   from public.campaign_faction_gm_details
   where faction_id = '70000000-0000-4000-8000-000000000001'),
  0,
  'deleting a faction removes its private details'
);

select * from finish();
rollback;
