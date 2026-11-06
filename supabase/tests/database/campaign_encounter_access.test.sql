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
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Shared Harbor',
    'city',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Hidden Vault',
    'dungeon',
    false
  );

insert into public.campaign_quests
  (id, campaign_id, name, player_visible)
values (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'The Harbor Signal',
  true
);

insert into public.campaign_sessions
  (id, campaign_id, session_number, player_visible)
values (
  '40000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  99001,
  true
);

insert into public.campaign_npcs
  (id, campaign_id, name, player_visible)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Harbor Guide',
    true
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Unknown Informant',
    false
  );

insert into public.campaign_maps
  (id, campaign_id, name, map_type, player_visible)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Shared Harbor Map',
    'city',
    true
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Hidden Vault Map',
    'dungeon',
    false
  );

insert into public.campaign_encounters
  (id, campaign_id, name, player_visible)
values (
  '70000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Private Ambush Plan',
  false
);

insert into public.campaign_encounter_gm_notes
  (campaign_id, encounter_id, notes)
values (
  '00000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000002',
  'Keep the hidden informant secret.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);

select is(
  (select count(*)::integer from public.campaign_encounters),
  1,
  'GM can read private encounter plans'
);
select is(
  (select count(*)::integer from public.campaign_encounter_gm_notes),
  1,
  'GM can read encounter preparation notes'
);
select lives_ok(
  $$
    select public.save_campaign_encounter(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Harbor Signal Intercept',
      'A meeting at the shared harbor.',
      '1 Harvestfall, 243 AC',
      '20000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000001',
      'Moderate',
      'planned',
      '',
      '',
      true,
      array[
        '50000000-0000-4000-8000-000000000001'::uuid,
        '50000000-0000-4000-8000-000000000002'::uuid
      ],
      'The informant is secretly working for the rival.'
    )
  $$,
  'GM can save an encounter with linked records and private notes'
);
select ok(
  exists (
    select 1
    from public.campaign_encounters as encounter
    join public.campaign_encounter_gm_notes as notes
      on notes.campaign_id = encounter.campaign_id
      and notes.encounter_id = encounter.id
    where encounter.name = 'Harbor Signal Intercept'
      and encounter.campaign_date = '1 Harvestfall, 243 AC'
      and encounter.location_id = '20000000-0000-4000-8000-000000000001'
      and encounter.quest_id = '30000000-0000-4000-8000-000000000001'
      and encounter.session_id = '40000000-0000-4000-8000-000000000001'
      and encounter.map_id = '60000000-0000-4000-8000-000000000001'
      and notes.notes = 'The informant is secretly working for the rival.'
  ),
  'encounter data, related campaign records, map, and private notes are saved'
);
select is(
  (
    select count(*)::integer
    from public.campaign_encounter_npcs
    where encounter_id = (
      select id
      from public.campaign_encounters
      where name = 'Harbor Signal Intercept'
    )
  ),
  2,
  'GM can link multiple NPCs to an encounter'
);
select lives_ok(
  $$
    select public.save_campaign_encounter(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Hidden Vault Skirmish',
      'A clash near an undiscovered site.',
      '',
      '20000000-0000-4000-8000-000000000002',
      null,
      null,
      '60000000-0000-4000-8000-000000000002',
      '',
      'planned',
      '',
      '',
      true,
      '{}',
      'This should remain hidden because its linked location is private.'
    )
  $$,
  'GM can prepare a shared encounter with private linked records'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.campaign_encounters),
  1,
  'player can read only shared encounters whose linked records are also shared'
);
select is(
  (select count(*)::integer from public.campaign_encounter_npcs),
  1,
  'player can see only NPC links to player-visible NPCs'
);
select is(
  (select count(*)::integer from public.campaign_encounter_gm_notes),
  0,
  'player cannot read encounter preparation notes'
);
select throws_ok(
  $$
    insert into public.campaign_encounters (campaign_id, name)
    values (
      '00000000-0000-4000-8000-000000000001',
      'Player-created encounter'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "campaign_encounters"',
  'player cannot create campaign encounters'
);
select throws_ok(
  $$
    select public.save_campaign_encounter(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Unauthorized',
      '',
      '',
      null,
      null,
      null,
      null,
      '',
      'planned',
      '',
      '',
      false,
      '{}',
      ''
    )
  $$,
  '42501',
  'Only a campaign GM can manage encounters.',
  'player cannot use the encounter save function'
);

select * from finish();
rollback;
