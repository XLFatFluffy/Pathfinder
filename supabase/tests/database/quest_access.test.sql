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

insert into public.campaign_quests
  (id, campaign_id, name, status, summary, giver, location_id, player_visible)
values
  (
    '80000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'The Missing Lanterns',
    'active',
    'Find the source of the lights disappearing from Alderhold.',
    'Warden Sera',
    '20000000-0000-4000-8000-000000000001',
    true
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'The Choir Beneath',
    'undiscovered',
    'An unseen organization gathers below the city.',
    '',
    null,
    false
  );

insert into public.campaign_quest_gm_notes
  (campaign_id, quest_id, notes)
values (
  '00000000-0000-4000-8000-000000000001',
  '80000000-0000-4000-8000-000000000001',
  'The guildmaster ordered the thefts to hide a smuggling route.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_quests),
  2,
  'GM can read visible and hidden quests'
);
select is(
  (select count(*)::integer from public.campaign_quest_gm_notes),
  1,
  'GM can read private quest notes'
);
select lives_ok(
  $$
    select public.save_campaign_quest(
      '00000000-0000-4000-8000-000000000001',
      null,
      'The Bell at Low Tide',
      'undiscovered',
      'Investigate the bell that rings beneath the harbor.',
      'Harbor Guild',
      '20000000-0000-4000-8000-000000000001',
      true,
      'The bell is connected to the smugglers’ flooded tunnel.'
    )
  $$,
  'GM can create a linked quest and private notes atomically'
);
select ok(
  exists (
    select 1
    from public.campaign_quests as quest
    join public.campaign_quest_gm_notes as notes
      on notes.campaign_id = quest.campaign_id
      and notes.quest_id = quest.id
    where quest.name = 'The Bell at Low Tide'
      and quest.location_id = '20000000-0000-4000-8000-000000000001'
      and notes.notes = 'The bell is connected to the smugglers’ flooded tunnel.'
  ),
  'quest location and GM notes are saved'
);
select lives_ok(
  $$
    select public.save_campaign_quest(
      '00000000-0000-4000-8000-000000000001',
      '80000000-0000-4000-8000-000000000001',
      'The Missing Lanterns',
      'completed',
      'The party uncovered the smuggling route.',
      'Warden Sera',
      '20000000-0000-4000-8000-000000000001',
      true,
      'The party knows the guildmaster arranged the thefts.'
    )
  $$,
  'GM can update quest status, details, and private notes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_quests),
  2,
  'player can read only quests shared by the GM'
);
select is(
  (select count(*)::integer from public.campaign_quest_gm_notes),
  0,
  'player cannot read private quest notes'
);
select throws_ok(
  $$
    insert into public.campaign_quests (campaign_id, name, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      'Player-created quest',
      true
    )
  $$,
  '42501',
  null,
  'player cannot create campaign quests'
);
select throws_ok(
  $$
    select public.save_campaign_quest(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Player-created through RPC',
      'active',
      '',
      '',
      null,
      true,
      ''
    )
  $$,
  '42501',
  'Only a campaign GM can manage quests.',
  'player cannot manage quests through the RPC'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
delete from public.campaign_quests
where id = '80000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer
   from public.campaign_quest_gm_notes
   where quest_id = '80000000-0000-4000-8000-000000000001'),
  0,
  'deleting a quest removes its private notes'
);

select * from finish();
rollback;
