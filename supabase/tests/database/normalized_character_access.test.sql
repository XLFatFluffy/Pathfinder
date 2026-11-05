begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(14);

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'gm@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'player@example.test'),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'other-player@example.test')
on conflict (id) do nothing;

insert into public.campaign_members (campaign_id, user_id, role)
values
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'gm'),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'player'),
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'player')
on conflict (campaign_id, user_id) do nothing;

insert into public.campaign_characters
  (id, campaign_id, owner_user_id, name, class_name, level, strength, dexterity, current_hp, max_hp, armor_class)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'Mira Ashford',
    'Ranger',
    3,
    14,
    16,
    22,
    28,
    17
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'Borin Stonehand',
    'Cleric',
    3,
    16,
    10,
    25,
    30,
    18
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_character_ability_scores),
  2,
  'player can read only their own normalized ability scores'
);
select is(
  (select count(*)::integer from public.campaign_character_combat),
  1,
  'legacy combat statistics are synchronized into the normalized model'
);
select is(
  (select misc_ac_bonus from public.campaign_character_combat
   where character_id = 'a0000000-0000-4000-8000-000000000001'),
  4::smallint,
  'legacy armor class is backfilled without double-counting Dexterity'
);
select is(
  (select count(*)::integer from public.campaign_character_level_history),
  1,
  'legacy level is preserved as an undated baseline history record'
);
update public.campaign_characters
set
  background = 'Updated through the legacy sheet',
  current_hp = 21
where id = 'a0000000-0000-4000-8000-000000000001';
select is(
  (select biography from public.campaign_character_identity
   where character_id = 'a0000000-0000-4000-8000-000000000001'),
  'Updated through the legacy sheet',
  'legacy biography updates continue to sync while the normalized record is legacy-sourced'
);
select is(
  (select current_hp from public.campaign_character_combat
   where character_id = 'a0000000-0000-4000-8000-000000000001'),
  21,
  'legacy combat updates continue to sync while the normalized record is legacy-sourced'
);
update public.campaign_character_ability_scores
set base_score = 18, source = 'player'
where character_id = 'a0000000-0000-4000-8000-000000000001'
  and ability = 'str';
select is(
  (select strength from public.campaign_characters
   where id = 'a0000000-0000-4000-8000-000000000001'),
  18::smallint,
  'structured ability changes stay visible on legacy campaign surfaces'
);
select lives_ok(
  $$
    select public.save_campaign_character_class(
      '00000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000001',
      'Ranger',
      'base',
      '',
      4,
      true,
      'Favored enemy: undead',
      'Day 14',
      'Advanced to Ranger 4'
    )
  $$,
  'player can update class level and record a level-history entry'
);
select is(
  (select count(*)::integer from public.campaign_character_level_history
   where character_id = 'a0000000-0000-4000-8000-000000000001'),
  2,
  'class level history is appended when level changes'
);
select lives_ok(
  $$
    insert into public.campaign_character_skills (
      campaign_id, character_id, name, key_ability, ranks, class_skill
    )
    values (
      '00000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000001',
      'Perception',
      'wis',
      3,
      true
    )
  $$,
  'player can add structured skills to their own character'
);
select lives_ok(
  $$
    insert into public.campaign_character_history (
      campaign_id, character_id, event_type, title, created_by
    )
    values (
      '00000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000001',
      'milestone',
      'The party reached the old road',
      '10000000-0000-4000-8000-000000000002'
    )
  $$,
  'player can append a character history event'
);
select throws_ok(
  $$
    delete from public.campaign_character_history
    where character_id = 'a0000000-0000-4000-8000-000000000001'
  $$,
  '42501',
  'permission denied for table campaign_character_history',
  'player cannot erase character history'
);
select throws_ok(
  $$
    insert into public.campaign_character_skills (
      campaign_id, character_id, name
    )
    values (
      '00000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002',
      'Unauthorized'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "campaign_character_skills"',
  'player cannot add structured records to another player character'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_character_skills),
  1,
  'GM can review a character skill from the campaign roster'
);

select * from finish();
rollback;
