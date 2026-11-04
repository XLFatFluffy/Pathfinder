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

insert into public.campaign_npcs
  (id, campaign_id, name, race, occupation, description, status, player_visible)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Mira Vale',
    'Human',
    'Harbor master',
    'A watchful official.',
    'Alive',
    true
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'The Ashen Broker',
    'Unknown',
    'Information broker',
    'A masked figure.',
    'Unknown',
    false
  );

insert into public.campaign_npc_gm_notes (campaign_id, npc_id, notes)
values (
  '00000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'Mira is secretly working for the cult.'
);

insert into public.campaign_npc_status_history
  (campaign_id, npc_id, status, campaign_date, reason)
values (
  '00000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'Alive',
  '1 Frostwane 1024',
  'Initial status'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_npcs),
  2,
  'GM can read visible and hidden NPCs'
);
select is(
  (select count(*)::integer from public.campaign_npc_gm_notes),
  1,
  'GM can read private NPC notes'
);
select lives_ok(
  $$
    select public.save_campaign_npc(
      '00000000-0000-4000-8000-000000000001',
      null,
      null,
      'Tarin Ashford',
      'Dwarf',
      '94',
      '',
      'Smith',
      '',
      'A patient craftsperson.',
      'Alive',
      true,
      'Owes a dangerous debt.',
      '2 Frostwane 1024',
      'First recorded appearance'
    )
  $$,
  'GM can create an NPC, private notes, and initial status history atomically'
);
select lives_ok(
  $$
    select public.save_campaign_npc(
      '00000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000001',
      null,
      'Mira Vale',
      'Human',
      '42',
      '',
      'Harbor master',
      '',
      'A watchful official.',
      'Missing',
      true,
      'Mira disappeared after the storm.',
      '3 Frostwane 1024',
      'Failed to report for morning bell'
    )
  $$,
  'GM can edit an NPC and record a status transition'
);
select is(
  (select count(*)::integer
   from public.campaign_npc_status_history
   where npc_id = '50000000-0000-4000-8000-000000000001'
     and status = 'Missing'
     and campaign_date = '3 Frostwane 1024'),
  1,
  'NPC status changes are retained with their campaign date'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_npcs),
  2,
  'player can read only NPCs the GM has marked player-known'
);
select is(
  (select count(*)::integer from public.campaign_npc_gm_notes),
  0,
  'player cannot read NPC GM-only notes'
);
select is(
  (select count(*)::integer from public.campaign_npc_status_history),
  0,
  'player cannot read NPC status history'
);
select throws_ok(
  $$
    insert into public.campaign_npcs (campaign_id, name, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      'Player-created NPC',
      true
    )
  $$,
  '42501',
  null,
  'player cannot create campaign NPCs'
);
select throws_ok(
  $$
    select public.save_campaign_npc(
      '00000000-0000-4000-8000-000000000001',
      null,
      null,
      'Player-created through RPC',
      '',
      '',
      '',
      '',
      '',
      '',
      'Alive',
      true,
      '',
      '',
      ''
    )
  $$,
  '42501',
  'Only a campaign GM can manage NPCs.',
  'player cannot create NPCs through the RPC'
);

select * from finish();
rollback;
