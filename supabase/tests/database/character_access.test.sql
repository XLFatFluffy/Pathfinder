begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(12);

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'gm@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'player@example.test'),
  ('10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'other-player@example.test')
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
  ),
  (
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000003',
    'player'
  )
on conflict (campaign_id, user_id) do nothing;

insert into public.campaign_characters
  (id, campaign_id, owner_user_id, name, ancestry, class_name, level, strength, dexterity, current_hp, max_hp, armor_class)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'Mira Ashford',
    'Human',
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
    'Dwarf',
    'Cleric',
    3,
    16,
    10,
    25,
    30,
    18
  );

insert into public.campaign_character_gm_notes
  (campaign_id, owner_user_id, character_id, notes)
values (
  '00000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001',
  'Mira has not told the party that she recognizes the sigil.'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.campaign_characters),
  2,
  'GM can review character sheets from campaign players'
);
select is(
  (select count(*)::integer from public.campaign_character_gm_notes),
  1,
  'GM can read private character notes'
);
select lives_ok(
  $$
    select public.save_campaign_character_gm_notes(
      '00000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002',
      'Borin hears the relic speaking in his dreams.'
    )
  $$,
  'GM can save notes separately from a player character sheet'
);
update public.campaign_characters
set name = 'GM changed player sheet'
where id = 'a0000000-0000-4000-8000-000000000001';
select is(
  (select name from public.campaign_characters
   where id = 'a0000000-0000-4000-8000-000000000001'),
  'Mira Ashford',
  'GM cannot edit a player-owned character sheet'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select is(
  (select count(*)::integer from public.campaign_characters),
  1,
  'player can read only their own character sheets'
);
select is(
  (select count(*)::integer from public.campaign_character_gm_notes),
  0,
  'player cannot read GM-only character notes'
);
select lives_ok(
  $$
    select public.save_campaign_character(
      '00000000-0000-4000-8000-000000000001',
      null,
      'Lio Quickfoot',
      'Halfling',
      'Bard',
      1,
      'Chaotic Good',
      'A traveling storyteller.',
      10::smallint,
      16::smallint,
      12::smallint,
      14::smallint,
      13::smallint,
      18::smallint,
      8,
      8,
      15,
      '25 ft.',
      'Fort +1, Ref +5, Will +3',
      'Perform, Diplomacy, Stealth',
      'Short sword +2 (1d6+0)',
      'Bardic performance, inspire courage',
      'Lute, leather armor',
      'Cantrips: detect magic, light',
      'A small halfling with a blue traveling cloak.'
    )
  $$,
  'player can create their own character sheet with game statistics'
);
select ok(
  exists (
    select 1
    from public.campaign_characters
    where owner_user_id = '10000000-0000-4000-8000-000000000002'
      and name = 'Lio Quickfoot'
      and class_name = 'Bard'
      and level = 1
      and strength = 10
      and charisma = 18
      and max_hp = 8
      and armor_class = 15
  ),
  'new character identity and statistics are saved'
);
select throws_ok(
  $$
    select public.save_campaign_character(
      '00000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000003',
      'Impersonated',
      '',
      '',
      1,
      '',
      '',
      null,
      null,
      null,
      null,
      null,
      null,
      0,
      0,
      10,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    )
  $$,
  'P0002',
  'The character sheet was not found in your account.',
  'player cannot edit another player’s character sheet'
);
select throws_ok(
  $$
    select public.save_campaign_character_gm_notes(
      '00000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000001',
      'Player attempt to write GM notes.'
    )
  $$,
  '42501',
  'Only a campaign GM can manage character notes.',
  'player cannot write GM-only character notes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000003', true);
select is(
  (select count(*)::integer from public.campaign_characters),
  1,
  'second player can read only their own character sheet'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
delete from public.campaign_characters
where id = 'a0000000-0000-4000-8000-000000000001';
select is(
  (select count(*)::integer from public.campaign_character_gm_notes
   where character_id = 'a0000000-0000-4000-8000-000000000001'),
  0,
  'deleting a character also deletes its GM-only notes'
);

select * from finish();
rollback;
