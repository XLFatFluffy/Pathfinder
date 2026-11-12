begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(10);

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'gm-world-review@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'player-world-review@example.test')
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

select lives_ok(
  $$
    insert into public.campaign_world_reviews
      (campaign_id, from_campaign_date, to_campaign_date, trigger, summary, created_by)
    values
      (
        '00000000-0000-4000-8000-000000000001',
        '1 Harvestfall, 243 AC',
        '2 Harvestfall, 243 AC',
        'session_end',
        'A focused post-session world review.',
        '10000000-0000-4000-8000-000000000001'
      )
  $$,
  'GM can create a world review'
);

select is(
  (select count(*)::integer from public.campaign_world_reviews),
  1,
  'GM can read the world review'
);

select lives_ok(
  $$
    insert into public.campaign_world_review_items
      (campaign_id, review_id, subject_type, title, proposal, basis)
    values
      (
        '00000000-0000-4000-8000-000000000001',
        (select id from public.campaign_world_reviews limit 1),
        'npc',
        'Harbor Master responds',
        'Review whether the Harbor Master changes berth priorities.',
        'Established harbor pressure and the NPC''s recorded responsibilities.'
      )
  $$,
  'GM can create a consequence proposal'
);

select lives_ok(
  $$
    update public.campaign_world_review_items
    set disposition = 'approved',
        gm_notes = 'Approved after reviewing the established harbor records.',
        reviewed_at = now()
    where campaign_id = '00000000-0000-4000-8000-000000000001'
  $$,
  'GM can review and approve a consequence proposal'
);

select is(
  (select disposition from public.campaign_world_review_items limit 1),
  'approved',
  'proposal disposition is persisted'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);

select is(
  (select count(*)::integer from public.campaign_world_reviews),
  0,
  'player cannot read GM world reviews'
);

select is(
  (select count(*)::integer from public.campaign_world_review_items),
  0,
  'player cannot read GM consequence proposals'
);

select throws_ok(
  $$
    insert into public.campaign_world_reviews
      (campaign_id, from_campaign_date, to_campaign_date, trigger, summary)
    values
      (
        '00000000-0000-4000-8000-000000000001',
        '2 Harvestfall, 243 AC',
        '3 Harvestfall, 243 AC',
        'pc_action',
        'Player attempt to write GM state.'
      )
  $$,
  '42501',
  null,
  'player cannot create a world review'
);

select is(
  (
    select count(*)::integer
    from public.campaign_world_review_items
    where disposition = 'rejected'
  ),
  0,
  'player cannot alter a GM consequence proposal'
);

select * from finish();
rollback;
