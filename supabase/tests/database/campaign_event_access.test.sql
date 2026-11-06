begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(13);

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

insert into public.campaign_events
  (id, campaign_id, title, campaign_date, category, certainty, player_visible)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Winter''s End',
    '30 Frostwane, 242 AC',
    'festival',
    'confirmed',
    true
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'The Unseen Procession',
    'Approximately 12 Harvestfall, 243 AC',
    'regional',
    'rumored',
    false
  );

insert into public.campaign_event_gm_notes
  (campaign_id, event_id, notes)
values (
  '00000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'The report may have been planted by the Lantern Guild.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_events),
  2,
  'GM can read visible and private events'
);
select is(
  (select count(*)::integer from public.campaign_event_gm_notes),
  1,
  'GM can read event notes'
);
select lives_ok(
  $$
    select public.save_campaign_event(
      '00000000-0000-4000-8000-000000000001',
      null,
      'The Bell at Low Tide',
      'A bell rings beneath the harbor.',
      '1 Harvestfall, 243 AC',
      '',
      false,
      'political',
      'planned',
      'unresolved',
      'Harbor watch report',
      '20000000-0000-4000-8000-000000000001',
      null,
      null,
      null,
      null,
      null,
      true,
      'The sound comes from a sealed tunnel.'
    )
  $$,
  'GM can create a linked, player-visible event with GM notes'
);
select ok(
  exists (
    select 1
    from public.campaign_events as event
    join public.campaign_event_gm_notes as notes
      on notes.campaign_id = event.campaign_id
      and notes.event_id = event.id
    join public.campaign_event_history as history
      on history.campaign_id = event.campaign_id
      and history.event_id = event.id
    where event.title = 'The Bell at Low Tide'
      and event.location_id = '20000000-0000-4000-8000-000000000001'
      and event.campaign_date = '1 Harvestfall, 243 AC'
      and notes.notes = 'The sound comes from a sealed tunnel.'
      and history.action = 'created'
  ),
  'event date, relationship, GM notes, and creation audit are saved'
);
select lives_ok(
  $$
    select public.save_campaign_event(
      '00000000-0000-4000-8000-000000000001',
      (select id from public.campaign_events where title = 'The Bell at Low Tide'),
      'The Bell at Low Tide',
      'The party found a flooded passage.',
      '2 Harvestfall, 243 AC',
      '',
      false,
      'political',
      'active',
      'confirmed',
      'Party investigation',
      '20000000-0000-4000-8000-000000000001',
      null,
      null,
      null,
      null,
      null,
      true,
      'A watchman is guarding the entrance.'
    )
  $$,
  'GM can update an event and its evidence'
);
select is(
  (
    select count(*)::integer
    from public.campaign_event_history
    where event_title = 'The Bell at Low Tide'
  ),
  2,
  'event edits are retained in the audit history'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_events),
  2,
  'player can read only player-visible campaign events'
);
select is(
  (select count(*)::integer from public.campaign_event_gm_notes),
  0,
  'player cannot read event GM notes'
);
select is(
  (select count(*)::integer from public.campaign_event_history),
  0,
  'player cannot read event change history'
);
select throws_ok(
  $$
    insert into public.campaign_events (campaign_id, title, campaign_date, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      'Player-created event',
      '3 Harvestfall, 243 AC',
      true
    )
  $$,
  '42501',
  null,
  'player cannot create campaign events'
);
select throws_ok(
  $$
    select public.save_campaign_event(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Player-created through RPC',
      '',
      '3 Harvestfall, 243 AC',
      '',
      false,
      'personal',
      'planned',
      'confirmed',
      '',
      null,
      null,
      null,
      null,
      null,
      null,
      true,
      ''
    )
  $$,
  '42501',
  'Only a campaign GM can manage campaign events.',
  'player cannot manage events through the RPC'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$
    select public.delete_campaign_event(
      '00000000-0000-4000-8000-000000000001',
      (select id from public.campaign_events where title = 'The Bell at Low Tide')
    )
  $$,
  'GM can delete an event'
);
select is(
  (
    select count(*)::integer
    from public.campaign_event_history
    where event_title = 'The Bell at Low Tide'
      and action = 'deleted'
  ),
  1,
  'event deletion retains an audit record'
);

select * from finish();
rollback;
