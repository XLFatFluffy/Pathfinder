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
), (
  '20000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'Lantern Guild Vault',
  'secret',
  false
);

insert into public.campaign_journal_entries
  (id, campaign_id, title, content, player_visible)
values
  (
    'b0000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'Shared harbor clue',
    'The bell rings below the harbor.',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'Private guild lead',
    'The Lantern Guild arranged the thefts.',
    false
  );

insert into public.campaign_journal_entry_links
  (campaign_id, entry_id, location_id)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001'
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_journal_entries),
  2,
  'GM can read existing shared and private notes'
);
select is(
  (select count(*)::integer from public.campaign_journal_entry_links),
  2,
  'GM can read private note links'
);
select lives_ok(
  $$
    select public.save_campaign_note(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Alderhold session prep',
      '## Leads\n- Check the sealed passage',
      '1 Harvestfall, 243 AC',
      'session_prep',
      array['harbor', 'session 1'],
      true,
      true,
      '[{"type":"location","id":"20000000-0000-4000-8000-000000000001"}]'::jsonb
    )
  $$,
  'GM can create a categorized Markdown note with tags and record links'
);
select ok(
  exists (
    select 1
    from public.campaign_journal_entries as entry
    join public.campaign_journal_entry_links as link
      on link.campaign_id = entry.campaign_id
      and link.entry_id = entry.id
    where entry.title = 'Alderhold session prep'
      and entry.category = 'session_prep'
      and entry.tags = array['harbor', 'session 1']
      and entry.pinned
      and entry.player_visible
      and link.location_id = '20000000-0000-4000-8000-000000000001'
  ),
  'note metadata, visibility, Markdown, and linked location are saved'
);
select lives_ok(
  $$
    select public.save_campaign_note(
      '00000000-0000-4000-8000-000000000001',
      (select id from public.campaign_journal_entries where title = 'Alderhold session prep'),
      'Alderhold session prep',
      'Updated prep.',
      '1 Harvestfall, 243 AC',
      'session_prep',
      array['harbor'],
      true,
      true,
      '[]'::jsonb
    )
  $$,
  'GM can update a note and clear obsolete links atomically'
);
select is(
  (select count(*)::integer from public.campaign_journal_entry_links),
  2,
  'note links are replaced while unrelated private links remain intact'
);
select lives_ok(
  $$
    select public.save_campaign_note(
      '00000000-0000-4000-8000-000000000001',
      (select id from public.campaign_journal_entries where title = 'Alderhold session prep'),
      'Alderhold session prep',
      'Updated prep.',
      '1 Harvestfall, 243 AC',
      'session_prep',
      array['harbor'],
      true,
      true,
      '[{"type":"location","id":"20000000-0000-4000-8000-000000000001"}]'::jsonb
    )
  $$,
  'GM can share notes linked to player-visible campaign records'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_journal_entries),
  2,
  'player can read only notes deliberately shared by the GM'
);
select is(
  (select count(*)::integer from public.campaign_journal_entry_links),
  1,
  'players see links only when both the note and linked record are visible'
);
select throws_ok(
  $$
    insert into public.campaign_journal_entry_links
      (campaign_id, entry_id, location_id)
    values (
      '00000000-0000-4000-8000-000000000001',
      'b0000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  null,
  'player cannot create campaign note links'
);
select throws_ok(
  $$
    select public.save_campaign_note(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Player note',
      '',
      '',
      'unsorted',
      '{}',
      false,
      true,
      '[]'::jsonb
    )
  $$,
  '42501',
  'Only a campaign GM can manage campaign notes.',
  'player cannot manage notes through the RPC'
);

select * from finish();
rollback;
