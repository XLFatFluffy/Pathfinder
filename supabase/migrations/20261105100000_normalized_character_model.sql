alter table public.campaign_characters
  add column character_status text not null default 'active'
    check (character_status in ('active', 'dead', 'retired', 'missing', 'inactive')),
  add column portrait_path text not null default '' check (length(portrait_path) <= 1000);

create function public.is_campaign_character_owner(
  target_campaign_id uuid,
  target_character_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_characters as character
    join public.campaign_members as member
      on member.campaign_id = character.campaign_id
     and member.user_id = character.owner_user_id
     and member.role = 'player'
    where character.campaign_id = target_campaign_id
      and character.id = target_character_id
      and character.owner_user_id = (select auth.uid())
  );
$$;

create function public.can_view_campaign_character(
  target_campaign_id uuid,
  target_character_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_campaign_gm(target_campaign_id)
    or public.is_campaign_character_owner(
      target_campaign_id,
      target_character_id
    );
$$;

revoke all on function public.is_campaign_character_owner(uuid, uuid)
from public, anon;
revoke all on function public.can_view_campaign_character(uuid, uuid)
from public, anon;
grant execute on function public.is_campaign_character_owner(uuid, uuid)
to authenticated;
grant execute on function public.can_view_campaign_character(uuid, uuid)
to authenticated;

create table public.campaign_character_identity (
  campaign_id uuid not null,
  character_id uuid not null,
  age text not null default '' check (length(age) <= 80),
  gender text not null default '' check (length(gender) <= 80),
  height text not null default '' check (length(height) <= 80),
  weight text not null default '' check (length(weight) <= 80),
  eyes text not null default '' check (length(eyes) <= 80),
  hair text not null default '' check (length(hair) <= 80),
  skin text not null default '' check (length(skin) <= 80),
  homeland text not null default '' check (length(homeland) <= 2000),
  deity text not null default '' check (length(deity) <= 200),
  religion text not null default '' check (length(religion) <= 2000),
  languages text not null default '' check (length(languages) <= 4000),
  appearance text not null default '' check (length(appearance) <= 4000),
  biography text not null default '' check (length(biography) <= 20000),
  personality text not null default '' check (length(personality) <= 10000),
  goals text not null default '' check (length(goals) <= 10000),
  bonds text not null default '' check (length(bonds) <= 10000),
  fears text not null default '' check (length(fears) <= 10000),
  secrets text not null default '' check (length(secrets) <= 20000),
  source text not null default 'player' check (source in ('legacy', 'player', 'imported_pdf')),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, character_id),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create table public.campaign_character_ability_scores (
  campaign_id uuid not null,
  character_id uuid not null,
  ability text not null check (ability in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
  base_score smallint check (base_score between 1 and 100),
  permanent_modifier smallint not null default 0
    check (permanent_modifier between -100 and 100),
  temporary_modifier smallint not null default 0
    check (temporary_modifier between -100 and 100),
  notes text not null default '' check (length(notes) <= 2000),
  source text not null default 'player' check (source in ('legacy', 'player', 'imported_pdf')),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, character_id, ability),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create table public.campaign_character_classes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  class_name text not null check (length(trim(class_name)) between 1 and 120),
  class_type text not null default 'base' check (class_type in ('base', 'prestige', 'racial')),
  archetype text not null default '' check (length(archetype) <= 160),
  level smallint not null default 1 check (level between 1 and 20),
  favored_class boolean not null default false,
  notes text not null default '' check (length(notes) <= 5000),
  source text not null default 'player' check (source in ('legacy', 'player', 'imported_pdf')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, character_id, id),
  unique (campaign_id, character_id, class_name),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create table public.campaign_character_level_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  class_id uuid not null,
  level smallint not null check (level between 1 and 20),
  campaign_date text not null default '' check (length(campaign_date) <= 120),
  session_id uuid,
  description text not null default '' check (length(description) <= 4000),
  source text not null default 'player' check (source in ('legacy', 'player', 'imported_pdf')),
  created_at timestamptz not null default now(),
  unique (campaign_id, character_id, id),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade,
  foreign key (campaign_id, character_id, class_id)
    references public.campaign_character_classes(campaign_id, character_id, id)
    on delete cascade,
  foreign key (campaign_id, session_id)
    references public.campaign_sessions(campaign_id, id)
);

create index campaign_character_level_history_order
on public.campaign_character_level_history (campaign_id, character_id, created_at);

create table public.campaign_character_skills (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 120),
  key_ability text not null default 'str'
    check (key_ability in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
  ranks smallint not null default 0 check (ranks between 0 and 100),
  class_skill boolean not null default false,
  armor_check_penalty boolean not null default false,
  misc_modifier smallint not null default 0 check (misc_modifier between -100 and 100),
  notes text not null default '' check (length(notes) <= 4000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, character_id, id),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create index campaign_character_skills_order
on public.campaign_character_skills (campaign_id, character_id, sort_order, name);

create table public.campaign_character_saving_throws (
  campaign_id uuid not null,
  character_id uuid not null,
  save_type text not null check (save_type in ('fortitude', 'reflex', 'will')),
  base_bonus smallint not null default 0 check (base_bonus between -100 and 100),
  resistance_bonus smallint not null default 0 check (resistance_bonus between -100 and 100),
  misc_modifier smallint not null default 0 check (misc_modifier between -100 and 100),
  notes text not null default '' check (length(notes) <= 4000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, character_id, save_type),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create table public.campaign_character_combat (
  campaign_id uuid not null,
  character_id uuid not null,
  current_hp integer not null default 0 check (current_hp between -9999 and 999999),
  max_hp integer not null default 0 check (max_hp between 0 and 999999),
  temporary_hp integer not null default 0 check (temporary_hp between 0 and 999999),
  nonlethal_damage integer not null default 0 check (nonlethal_damage between 0 and 999999),
  armor_bonus smallint not null default 0 check (armor_bonus between -100 and 100),
  shield_bonus smallint not null default 0 check (shield_bonus between -100 and 100),
  natural_armor_bonus smallint not null default 0 check (natural_armor_bonus between -100 and 100),
  deflection_bonus smallint not null default 0 check (deflection_bonus between -100 and 100),
  dodge_bonus smallint not null default 0 check (dodge_bonus between -100 and 100),
  misc_ac_bonus smallint not null default 0 check (misc_ac_bonus between -100 and 100),
  base_attack_bonus smallint not null default 0 check (base_attack_bonus between -100 and 100),
  initiative_misc smallint not null default 0 check (initiative_misc between -100 and 100),
  cmb_misc smallint not null default 0 check (cmb_misc between -100 and 100),
  cmd_misc smallint not null default 0 check (cmd_misc between -100 and 100),
  speed text not null default '' check (length(speed) <= 120),
  notes text not null default '' check (length(notes) <= 5000),
  source text not null default 'player' check (source in ('legacy', 'player', 'imported_pdf')),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, character_id),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create table public.campaign_character_attacks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 160),
  attack_type text not null default '' check (length(attack_type) <= 80),
  attack_bonus smallint not null default 0 check (attack_bonus between -100 and 100),
  damage text not null default '' check (length(damage) <= 500),
  damage_bonus smallint not null default 0 check (damage_bonus between -100 and 100),
  critical text not null default '' check (length(critical) <= 120),
  range text not null default '' check (length(range) <= 120),
  damage_type text not null default '' check (length(damage_type) <= 120),
  size text not null default '' check (length(size) <= 80),
  enhancement smallint not null default 0 check (enhancement between -100 and 100),
  special_properties text not null default '' check (length(special_properties) <= 4000),
  ammunition text not null default '' check (length(ammunition) <= 4000),
  notes text not null default '' check (length(notes) <= 4000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create table public.campaign_character_features (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  feature_type text not null check (
    feature_type in ('feat', 'class_feature', 'special_ability', 'custom')
  ),
  name text not null check (length(trim(name)) between 1 and 160),
  source text not null default '' check (length(source) <= 160),
  source_class_id uuid,
  level_acquired smallint check (level_acquired between 1 and 20),
  prerequisites text not null default '' check (length(prerequisites) <= 4000),
  description text not null default '' check (length(description) <= 10000),
  uses text not null default '' check (length(uses) <= 1000),
  current_uses text not null default '' check (length(current_uses) <= 1000),
  notes text not null default '' check (length(notes) <= 5000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade,
  foreign key (campaign_id, character_id, source_class_id)
    references public.campaign_character_classes(campaign_id, character_id, id)
);

create table public.campaign_character_equipment (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  item_type text not null default 'general'
    check (item_type in ('general', 'weapon', 'armor', 'shield', 'magic_item')),
  name text not null check (length(trim(name)) between 1 and 160),
  quantity integer not null default 1 check (quantity between 0 and 999999),
  weight numeric(10, 2) not null default 0 check (weight >= 0),
  value_gp numeric(12, 2) not null default 0 check (value_gp >= 0),
  equipped boolean not null default false,
  magical boolean not null default false,
  identified boolean not null default true,
  container text not null default '' check (length(container) <= 160),
  description text not null default '' check (length(description) <= 10000),
  notes text not null default '' check (length(notes) <= 5000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, character_id, id),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create index campaign_character_equipment_order
on public.campaign_character_equipment (campaign_id, character_id, sort_order, name);

create table public.campaign_character_weapon_details (
  campaign_id uuid not null,
  character_id uuid not null,
  equipment_id uuid not null,
  attack_bonus smallint not null default 0,
  damage text not null default '' check (length(damage) <= 500),
  critical text not null default '' check (length(critical) <= 120),
  range text not null default '' check (length(range) <= 120),
  weapon_type text not null default '' check (length(weapon_type) <= 120),
  enhancement smallint not null default 0,
  special_abilities text not null default '' check (length(special_abilities) <= 4000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, equipment_id),
  foreign key (campaign_id, character_id, equipment_id)
    references public.campaign_character_equipment(campaign_id, character_id, id)
    on delete cascade
);

create table public.campaign_character_armor_details (
  campaign_id uuid not null,
  character_id uuid not null,
  equipment_id uuid not null,
  armor_bonus smallint not null default 0,
  max_dexterity_bonus smallint,
  armor_check_penalty smallint not null default 0,
  arcane_spell_failure smallint not null default 0
    check (arcane_spell_failure between 0 and 100),
  speed text not null default '' check (length(speed) <= 120),
  enhancement smallint not null default 0,
  special_properties text not null default '' check (length(special_properties) <= 4000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, equipment_id),
  foreign key (campaign_id, character_id, equipment_id)
    references public.campaign_character_equipment(campaign_id, character_id, id)
    on delete cascade
);

create table public.campaign_character_magic_item_details (
  campaign_id uuid not null,
  character_id uuid not null,
  equipment_id uuid not null,
  caster_level smallint,
  aura text not null default '' check (length(aura) <= 2000),
  charges text not null default '' check (length(charges) <= 1000),
  activation text not null default '' check (length(activation) <= 1000),
  effects text not null default '' check (length(effects) <= 10000),
  slot text not null default '' check (length(slot) <= 120),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, equipment_id),
  foreign key (campaign_id, character_id, equipment_id)
    references public.campaign_character_equipment(campaign_id, character_id, id)
    on delete cascade
);

create table public.campaign_character_spellcasting (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  class_name text not null check (length(trim(class_name)) between 1 and 120),
  caster_level smallint not null default 1 check (caster_level between 1 and 40),
  casting_ability text not null default 'int'
    check (casting_ability in ('str', 'dex', 'con', 'int', 'wis', 'cha')),
  spell_dc_misc smallint not null default 0,
  spell_attack_misc smallint not null default 0,
  casting_model text not null default 'prepared'
    check (casting_model in ('prepared', 'spontaneous', 'other')),
  special_rules text not null default '' check (length(special_rules) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, character_id, id),
  unique (campaign_id, character_id, class_name),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade
);

create table public.campaign_character_spell_slots (
  campaign_id uuid not null,
  character_id uuid not null,
  spellcasting_id uuid not null,
  spell_level smallint not null check (spell_level between 0 and 9),
  total_slots smallint not null default 0 check (total_slots between 0 and 100),
  used_slots smallint not null default 0 check (used_slots between 0 and 100),
  notes text not null default '' check (length(notes) <= 2000),
  primary key (campaign_id, spellcasting_id, spell_level),
  check (used_slots <= total_slots),
  foreign key (campaign_id, character_id, spellcasting_id)
    references public.campaign_character_spellcasting(campaign_id, character_id, id)
    on delete cascade
);

create table public.campaign_character_spells (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  spellcasting_id uuid not null,
  name text not null check (length(trim(name)) between 1 and 160),
  spell_level smallint not null check (spell_level between 0 and 9),
  school text not null default '' check (length(school) <= 120),
  casting_time text not null default '' check (length(casting_time) <= 200),
  range text not null default '' check (length(range) <= 200),
  components text not null default '' check (length(components) <= 500),
  duration text not null default '' check (length(duration) <= 200),
  description text not null default '' check (length(description) <= 10000),
  prepared boolean not null default false,
  known boolean not null default false,
  notes text not null default '' check (length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade,
  foreign key (campaign_id, character_id, spellcasting_id)
    references public.campaign_character_spellcasting(campaign_id, character_id, id)
    on delete cascade
);

create table public.campaign_character_relationships (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  entity_type text not null
    check (entity_type in ('npc', 'faction', 'house', 'location', 'quest')),
  relationship_type text not null check (length(trim(relationship_type)) between 1 and 120),
  npc_id uuid,
  faction_id uuid,
  house_id uuid,
  location_id uuid,
  quest_id uuid,
  notes text not null default '' check (length(notes) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    num_nonnulls(npc_id, faction_id, house_id, location_id, quest_id) = 1
    and (
      (entity_type = 'npc' and npc_id is not null)
      or (entity_type = 'faction' and faction_id is not null)
      or (entity_type = 'house' and house_id is not null)
      or (entity_type = 'location' and location_id is not null)
      or (entity_type = 'quest' and quest_id is not null)
    )
  ),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade,
  foreign key (campaign_id, npc_id)
    references public.campaign_npcs(campaign_id, id),
  foreign key (campaign_id, faction_id)
    references public.campaign_factions(campaign_id, id),
  foreign key (campaign_id, house_id)
    references public.campaign_houses(campaign_id, id),
  foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id),
  foreign key (campaign_id, quest_id)
    references public.campaign_quests(campaign_id, id)
);

create table public.campaign_character_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  character_id uuid not null,
  event_type text not null check (length(trim(event_type)) between 1 and 80),
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '' check (length(description) <= 10000),
  campaign_date text not null default '' check (length(campaign_date) <= 120),
  session_id uuid,
  player_visible boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (campaign_id, character_id)
    references public.campaign_characters(campaign_id, id)
    on delete cascade,
  foreign key (campaign_id, session_id)
    references public.campaign_sessions(campaign_id, id)
);

create index campaign_character_history_order
on public.campaign_character_history (campaign_id, character_id, created_at desc);

insert into public.campaign_character_identity (
  campaign_id, character_id, biography, appearance, updated_at
)
select campaign_id, id, background, appearance, updated_at
from public.campaign_characters
on conflict (campaign_id, character_id) do nothing;

insert into public.campaign_character_ability_scores (
  campaign_id, character_id, ability, base_score, source
)
select character.campaign_id, character.id, score.ability, score.base_score, 'legacy'
from public.campaign_characters as character
cross join lateral (
  values
    ('str', character.strength),
    ('dex', character.dexterity),
    ('con', character.constitution),
    ('int', character.intelligence),
    ('wis', character.wisdom),
    ('cha', character.charisma)
) as score(ability, base_score)
where score.base_score is not null
on conflict (campaign_id, character_id, ability) do nothing;

insert into public.campaign_character_classes (
  campaign_id, character_id, class_name, level, source
)
select campaign_id, id, trim(class_name), level, 'legacy'
from public.campaign_characters
where length(trim(class_name)) > 0
on conflict (campaign_id, character_id, class_name) do nothing;

insert into public.campaign_character_level_history (
  campaign_id, character_id, class_id, level, description, source
)
select
  class_record.campaign_id,
  class_record.character_id,
  class_record.id,
  class_record.level,
  'Baseline migrated from the legacy sheet; earlier level dates were not recorded.',
  'legacy'
from public.campaign_character_classes as class_record
where class_record.source = 'legacy'
  and not exists (
    select 1
    from public.campaign_character_level_history as history
    where history.campaign_id = class_record.campaign_id
      and history.character_id = class_record.character_id
      and history.class_id = class_record.id
      and history.source = 'legacy'
  );

insert into public.campaign_character_combat (
  campaign_id, character_id, current_hp, max_hp, misc_ac_bonus, speed, source
)
select
  campaign_id,
  id,
  current_hp,
  max_hp,
  armor_class - 10,
  speed,
  'legacy'
from public.campaign_characters
on conflict (campaign_id, character_id) do nothing;

create function public.sync_legacy_campaign_character()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.campaign_character_identity (
    campaign_id, character_id, biography, appearance, source, updated_at
  )
  values (
    new.campaign_id, new.id, new.background, new.appearance, 'legacy', now()
  )
  on conflict (campaign_id, character_id)
  do update set
    biography = excluded.biography,
    appearance = excluded.appearance,
    updated_at = now()
  where public.campaign_character_identity.source = 'legacy';

  insert into public.campaign_character_ability_scores (
    campaign_id, character_id, ability, base_score, source, updated_at
  )
  select new.campaign_id, new.id, score.ability, score.base_score, 'legacy', now()
  from (
    values
      ('str', new.strength),
      ('dex', new.dexterity),
      ('con', new.constitution),
      ('int', new.intelligence),
      ('wis', new.wisdom),
      ('cha', new.charisma)
  ) as score(ability, base_score)
  where score.base_score is not null
  on conflict (campaign_id, character_id, ability)
  do update set
    base_score = excluded.base_score,
    source = 'legacy',
    updated_at = now()
  where public.campaign_character_ability_scores.source = 'legacy';

  insert into public.campaign_character_combat (
    campaign_id, character_id, current_hp, max_hp, misc_ac_bonus, speed, source, updated_at
  )
  values (
    new.campaign_id, new.id, new.current_hp, new.max_hp,
    new.armor_class - 10, new.speed, 'legacy', now()
  )
  on conflict (campaign_id, character_id)
  do update set
    current_hp = excluded.current_hp,
    max_hp = excluded.max_hp,
    misc_ac_bonus = excluded.misc_ac_bonus,
    speed = excluded.speed,
    updated_at = now()
  where public.campaign_character_combat.source = 'legacy';

  if length(trim(new.class_name)) > 0 then
    insert into public.campaign_character_classes (
      campaign_id, character_id, class_name, level, source, updated_at
    )
    values (
      new.campaign_id, new.id, trim(new.class_name), new.level, 'legacy', now()
    )
    on conflict (campaign_id, character_id, class_name)
    do update set
      level = excluded.level,
      updated_at = now()
    where public.campaign_character_classes.source = 'legacy';
  end if;

  if tg_op = 'INSERT' and length(trim(new.class_name)) > 0 then
    insert into public.campaign_character_level_history (
      campaign_id, character_id, class_id, level, description, source
    )
    select
      new.campaign_id,
      new.id,
      class_record.id,
      new.level,
      'Baseline migrated from the legacy sheet; earlier level dates were not recorded.',
      'legacy'
    from public.campaign_character_classes as class_record
    where class_record.campaign_id = new.campaign_id
      and class_record.character_id = new.id
      and class_record.class_name = trim(new.class_name)
      and class_record.source = 'legacy';
  elsif tg_op = 'UPDATE'
    and (old.level is distinct from new.level or old.class_name is distinct from new.class_name)
    and length(trim(new.class_name)) > 0
  then
    insert into public.campaign_character_level_history (
      campaign_id, character_id, class_id, level, description, source
    )
    select
      new.campaign_id,
      new.id,
      class_record.id,
      new.level,
      'Level/class value changed in the legacy sheet; prior history was not available.',
      'legacy'
    from public.campaign_character_classes as class_record
    where class_record.campaign_id = new.campaign_id
      and class_record.character_id = new.id
      and class_record.class_name = trim(new.class_name)
      and class_record.source = 'legacy';
  end if;

  return new;
end;
$$;

create trigger campaign_characters_sync_legacy
after insert or update of
  background, appearance, strength, dexterity, constitution,
  intelligence, wisdom, charisma, current_hp, max_hp, armor_class,
  speed, class_name, level
on public.campaign_characters
for each row
execute function public.sync_legacy_campaign_character();

do $$
declare
  child_table text;
  child_tables text[] := array[
    'campaign_character_identity',
    'campaign_character_ability_scores',
    'campaign_character_classes',
    'campaign_character_level_history',
    'campaign_character_skills',
    'campaign_character_saving_throws',
    'campaign_character_combat',
    'campaign_character_attacks',
    'campaign_character_features',
    'campaign_character_equipment',
    'campaign_character_weapon_details',
    'campaign_character_armor_details',
    'campaign_character_magic_item_details',
    'campaign_character_spellcasting',
    'campaign_character_spell_slots',
    'campaign_character_spells',
    'campaign_character_relationships',
    'campaign_character_history'
  ];
begin
  foreach child_table in array child_tables loop
    execute format('alter table public.%I enable row level security', child_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.can_view_campaign_character(campaign_id, character_id))',
      child_table || '_owner_gm_read',
      child_table
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_campaign_character_owner(campaign_id, character_id))',
      child_table || '_owner_insert',
      child_table
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_campaign_character_owner(campaign_id, character_id)) with check (public.is_campaign_character_owner(campaign_id, character_id))',
      child_table || '_owner_update',
      child_table
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_campaign_character_owner(campaign_id, character_id))',
      child_table || '_owner_delete',
      child_table
    );
    execute format(
      'revoke all on public.%I from anon, authenticated',
      child_table
    );
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated',
      child_table
    );
  end loop;
end;
$$;

create policy campaign_character_history_owner_visibility
on public.campaign_character_history for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_character_owner(campaign_id, character_id)
  )
);

drop policy campaign_character_history_owner_gm_read
on public.campaign_character_history;
