begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(4);

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

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
insert into public.campaign_import_sources (
  campaign_id, record_type, source_key, entity_id, record_name,
  canon_status, visibility, knowledge_type, provenance
)
values (
  '00000000-0000-4000-8000-000000000001',
  'locations',
  'tallowmere',
  'a0000000-0000-4000-8000-000000000001',
  'Tallowmere',
  'ESTABLISHED',
  'PLAYER_SHARED',
  'fact',
  'campaign/locations/starting_city/City_Overview.md'
);
select is(
  (select count(*)::integer from public.campaign_import_sources),
  1,
  'GM can read import provenance'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_import_sources),
  0,
  'player cannot read GM import provenance'
);
select throws_ok(
  $$
    insert into public.campaign_import_sources (
      campaign_id, record_type, source_key, entity_id, record_name,
      canon_status, visibility, knowledge_type, provenance
    )
    values (
      '00000000-0000-4000-8000-000000000001',
      'locations',
      'player-injected',
      'a0000000-0000-4000-8000-000000000002',
      'Injected',
      'ESTABLISHED',
      'PLAYER_SHARED',
      'fact',
      'player'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "campaign_import_sources"',
  'player cannot write import provenance'
);

reset role;
select throws_ok(
  $$
    insert into public.campaign_import_sources (
      campaign_id, record_type, source_key, entity_id, record_name,
      canon_status, visibility, knowledge_type, provenance
    )
    values (
      '00000000-0000-4000-8000-000000000001',
      'locations',
      'invalid-shared-secret',
      'a0000000-0000-4000-8000-000000000003',
      'Invalid',
      'UNRESOLVED',
      'PLAYER_SHARED',
      'gm_truth',
      'test'
    )
  $$,
  '23514',
  'new row for relation "campaign_import_sources" violates check constraint "campaign_import_sources_visibility_canon_check"',
  'unresolved GM truth cannot be marked player-shared'
);

select * from finish();
rollback;
