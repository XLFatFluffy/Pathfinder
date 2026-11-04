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

insert into public.campaign_houses (id, campaign_id, name, player_visible)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'House Rowan',
    true
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'House Vale',
    true
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    'House Ash',
    false
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select lives_ok(
  $$
    select public.save_campaign_house_relationship(
      '00000000-0000-4000-8000-000000000001',
      null,
      '60000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000002',
      'allied',
      'The two houses maintain a formal alliance.',
      true,
      'The agreement is fragile; Rowan plans to betray Vale.',
      '1 Frostwane 1024',
      'Alliance ratified'
    )
  $$,
  'GM can create a relationship and its history and private notes atomically'
);
select is(
  (select count(*)::integer
   from public.campaign_house_relationship_history
   where new_type = 'allied' and previous_type is null),
  1,
  'initial relationship is recorded in its history'
);
select lives_ok(
  $$
    select public.save_campaign_house_relationship(
      '00000000-0000-4000-8000-000000000001',
      (
        select id
        from public.campaign_house_relationships
        where house_id = '60000000-0000-4000-8000-000000000001'
      ),
      '60000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000002',
      'at_war',
      'Open conflict has begun.',
      true,
      'The Rowan heir arranged the ambush.',
      '9 Frostwane 1024',
      'The Vale envoy was attacked'
    )
  $$,
  'GM can change the relationship while retaining its private notes'
);
select is(
  (select count(*)::integer
   from public.campaign_house_relationship_history
   where previous_type = 'allied'
     and new_type = 'at_war'
     and campaign_date = '9 Frostwane 1024'),
  1,
  'relationship type changes are retained with campaign date and reason'
);
select is(
  (select count(*)::integer from public.campaign_house_relationship_gm_notes),
  1,
  'GM can read relationship secrets'
);
select throws_ok(
  $$
    insert into public.campaign_house_relationships
      (campaign_id, house_id, related_house_id, relationship_type)
    values (
      '00000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000002',
      '60000000-0000-4000-8000-000000000001',
      'allied'
    )
  $$,
  '23505',
  null,
  'the same house pair cannot be recorded twice in opposite directions'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_house_relationships),
  1,
  'player can read only shared relationships between known houses'
);
select is(
  (select count(*)::integer from public.campaign_house_relationship_gm_notes),
  0,
  'player cannot read private relationship notes'
);
select is(
  (select count(*)::integer from public.campaign_house_relationship_history),
  0,
  'player cannot read political relationship history'
);
select throws_ok(
  $$
    insert into public.campaign_house_relationships
      (campaign_id, house_id, related_house_id, relationship_type, player_visible)
    values (
      '00000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000002',
      'enemy',
      true
    )
  $$,
  '42501',
  null,
  'player cannot create a political relationship'
);
select throws_ok(
  $$
    select public.save_campaign_house_relationship(
      '00000000-0000-4000-8000-000000000001',
      null,
      '60000000-0000-4000-8000-000000000001',
      '60000000-0000-4000-8000-000000000002',
      'enemy',
      '',
      true,
      '',
      '',
      ''
    )
  $$,
  '42501',
  'Only a campaign GM can manage house relationships.',
  'player cannot create relationships through the management function'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
delete from public.campaign_house_relationships
where house_id = '60000000-0000-4000-8000-000000000001'
  and related_house_id = '60000000-0000-4000-8000-000000000002';
select is(
  (select count(*)::integer
   from public.campaign_house_relationships
   where house_id = '60000000-0000-4000-8000-000000000001'
     and related_house_id = '60000000-0000-4000-8000-000000000002'),
  0,
  'GM can delete a house relationship'
);
select is(
  (select count(*)::integer
   from public.campaign_house_relationship_history
   where relationship_id = (
     select id
     from public.campaign_house_relationships
     where house_id = '60000000-0000-4000-8000-000000000001'
       and related_house_id = '60000000-0000-4000-8000-000000000002'
   )),
  0,
  'deleting a relationship removes its dependent history'
);
select is(
  (select count(*)::integer
   from public.campaign_house_relationship_gm_notes),
  0,
  'deleting a relationship removes its private notes'
);

select * from finish();
rollback;
