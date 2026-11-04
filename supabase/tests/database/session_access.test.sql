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

insert into public.campaign_sessions
  (id, campaign_id, session_number, campaign_date, summary, player_visible)
values
  (
    '90000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    1,
    'Third of Lamashan, 4726 AR',
    'The party arrived in Alderhold and met Warden Sera.',
    true
  ),
  (
    '90000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    2,
    'Fourth of Lamashan, 4726 AR',
    'The party discovered a sealed passage.',
    false
  );

insert into public.campaign_session_gm_notes
  (campaign_id, session_id, notes)
values (
  '00000000-0000-4000-8000-000000000001',
  '90000000-0000-4000-8000-000000000001',
  'Sera recognized the party but hid her connection to the thieves.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_sessions),
  2,
  'GM can read shared and private session logs'
);
select is(
  (select count(*)::integer from public.campaign_session_gm_notes),
  1,
  'GM can read private session notes'
);
select lives_ok(
  $$
    select public.save_campaign_session(
      '00000000-0000-4000-8000-000000000001',
      null,
      3,
      'Fifth of Lamashan, 4726 AR',
      'The party followed the passage under the old city.',
      true,
      'The passage is watched by a creature from the Darklands.'
    )
  $$,
  'GM can create a session recap and private notes atomically'
);
select ok(
  exists (
    select 1
    from public.campaign_sessions as session
    join public.campaign_session_gm_notes as notes
      on notes.campaign_id = session.campaign_id
      and notes.session_id = session.id
    where session.session_number = 3
      and session.campaign_date = 'Fifth of Lamashan, 4726 AR'
      and notes.notes = 'The passage is watched by a creature from the Darklands.'
  ),
  'session date, recap, and GM notes are saved'
);
select lives_ok(
  $$
    select public.save_campaign_session(
      '00000000-0000-4000-8000-000000000001',
      '90000000-0000-4000-8000-000000000001',
      1,
      'Third of Lamashan, 4726 AR',
      'The party arrived and found the old watchtower.',
      true,
      'Sera has an unspoken debt to House Vint.'
    )
  $$,
  'GM can update session recap and private notes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_sessions),
  2,
  'player can read only session logs shared by the GM'
);
select is(
  (select count(*)::integer from public.campaign_session_gm_notes),
  0,
  'player cannot read GM session notes'
);
select throws_ok(
  $$
    insert into public.campaign_sessions (campaign_id, session_number)
    values ('00000000-0000-4000-8000-000000000001', 8)
  $$,
  '42501',
  null,
  'player cannot create session logs'
);
select throws_ok(
  $$
    select public.save_campaign_session(
      '00000000-0000-4000-8000-000000000001',
      null,
      9,
      '',
      '',
      true,
      ''
    )
  $$,
  '42501',
  'Only a campaign GM can manage session logs.',
  'player cannot manage sessions through the RPC'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
delete from public.campaign_sessions
where id = '90000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer
   from public.campaign_session_gm_notes
   where session_id = '90000000-0000-4000-8000-000000000001'),
  0,
  'deleting a session removes its private notes'
);

select * from finish();
rollback;
