create table public.campaign_characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  ancestry text not null default '' check (length(ancestry) <= 120),
  class_name text not null default '' check (length(class_name) <= 120),
  level integer not null default 1 check (level between 1 and 20),
  alignment text not null default '' check (length(alignment) <= 40),
  background text not null default '' check (length(background) <= 10000),
  strength smallint check (strength between 1 and 100),
  dexterity smallint check (dexterity between 1 and 100),
  constitution smallint check (constitution between 1 and 100),
  intelligence smallint check (intelligence between 1 and 100),
  wisdom smallint check (wisdom between 1 and 100),
  charisma smallint check (charisma between 1 and 100),
  current_hp integer not null default 0 check (current_hp between -9999 and 999999),
  max_hp integer not null default 0 check (max_hp between 0 and 999999),
  armor_class integer not null default 10 check (armor_class between -100 and 999),
  speed text not null default '' check (length(speed) <= 120),
  saving_throws text not null default '' check (length(saving_throws) <= 4000),
  skills text not null default '' check (length(skills) <= 10000),
  attacks text not null default '' check (length(attacks) <= 10000),
  features text not null default '' check (length(features) <= 12000),
  equipment text not null default '' check (length(equipment) <= 20000),
  spells text not null default '' check (length(spells) <= 20000),
  appearance text not null default '' check (length(appearance) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id),
  constraint campaign_characters_campaign_owner_id_unique
    unique (campaign_id, owner_user_id, id)
);

create index campaign_characters_owner
on public.campaign_characters (campaign_id, owner_user_id, name);

create table public.campaign_character_gm_notes (
  campaign_id uuid not null,
  owner_user_id uuid not null,
  character_id uuid not null,
  notes text not null default '' check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, character_id),
  foreign key (campaign_id, owner_user_id, character_id)
    references public.campaign_characters(campaign_id, owner_user_id, id)
    on delete cascade
);

alter table public.campaign_characters enable row level security;
alter table public.campaign_character_gm_notes enable row level security;

create policy campaign_characters_owner_and_gm_read
on public.campaign_characters for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    owner_user_id = (select auth.uid())
    and exists (
      select 1
      from public.campaign_members as member
      where member.campaign_id = campaign_characters.campaign_id
        and member.user_id = (select auth.uid())
        and member.role = 'player'
    )
  )
);

create policy campaign_characters_owner_insert
on public.campaign_characters for insert
to authenticated
with check (
  owner_user_id = (select auth.uid())
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_characters.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
);

create policy campaign_characters_owner_update
on public.campaign_characters for update
to authenticated
using (
  owner_user_id = (select auth.uid())
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_characters.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
)
with check (
  owner_user_id = (select auth.uid())
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_characters.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
);

create policy campaign_characters_owner_delete
on public.campaign_characters for delete
to authenticated
using (
  owner_user_id = (select auth.uid())
  and exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = campaign_characters.campaign_id
      and member.user_id = (select auth.uid())
      and member.role = 'player'
  )
);

create policy campaign_character_gm_notes_gm_manage
on public.campaign_character_gm_notes for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create function public.save_campaign_character(
  target_campaign_id uuid,
  target_character_id uuid,
  target_name text,
  target_ancestry text,
  target_class_name text,
  target_level integer,
  target_alignment text,
  target_background text,
  target_strength smallint,
  target_dexterity smallint,
  target_constitution smallint,
  target_intelligence smallint,
  target_wisdom smallint,
  target_charisma smallint,
  target_current_hp integer,
  target_max_hp integer,
  target_armor_class integer,
  target_speed text,
  target_saving_throws text,
  target_skills text,
  target_attacks text,
  target_features text,
  target_equipment text,
  target_spells text,
  target_appearance text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_character_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if not exists (
    select 1
    from public.campaign_members as member
    where member.campaign_id = target_campaign_id
      and member.user_id = current_user_id
      and member.role = 'player'
  ) then
    raise exception 'Only a campaign player can manage their own character sheets.'
      using errcode = '42501';
  end if;

  if target_character_id is null then
    insert into public.campaign_characters (
      campaign_id,
      owner_user_id,
      name,
      ancestry,
      class_name,
      level,
      alignment,
      background,
      strength,
      dexterity,
      constitution,
      intelligence,
      wisdom,
      charisma,
      current_hp,
      max_hp,
      armor_class,
      speed,
      saving_throws,
      skills,
      attacks,
      features,
      equipment,
      spells,
      appearance
    )
    values (
      target_campaign_id,
      current_user_id,
      trim(target_name),
      trim(target_ancestry),
      trim(target_class_name),
      target_level,
      trim(target_alignment),
      trim(target_background),
      target_strength,
      target_dexterity,
      target_constitution,
      target_intelligence,
      target_wisdom,
      target_charisma,
      target_current_hp,
      target_max_hp,
      target_armor_class,
      trim(target_speed),
      trim(target_saving_throws),
      trim(target_skills),
      trim(target_attacks),
      trim(target_features),
      trim(target_equipment),
      trim(target_spells),
      trim(target_appearance)
    )
    returning id into saved_character_id;
  else
    update public.campaign_characters
    set
      name = trim(target_name),
      ancestry = trim(target_ancestry),
      class_name = trim(target_class_name),
      level = target_level,
      alignment = trim(target_alignment),
      background = trim(target_background),
      strength = target_strength,
      dexterity = target_dexterity,
      constitution = target_constitution,
      intelligence = target_intelligence,
      wisdom = target_wisdom,
      charisma = target_charisma,
      current_hp = target_current_hp,
      max_hp = target_max_hp,
      armor_class = target_armor_class,
      speed = trim(target_speed),
      saving_throws = trim(target_saving_throws),
      skills = trim(target_skills),
      attacks = trim(target_attacks),
      features = trim(target_features),
      equipment = trim(target_equipment),
      spells = trim(target_spells),
      appearance = trim(target_appearance),
      updated_at = now()
    where campaign_id = target_campaign_id
      and owner_user_id = current_user_id
      and id = target_character_id
    returning id into saved_character_id;

    if not found then
      raise exception 'The character sheet was not found in your account.'
        using errcode = 'P0002';
    end if;
  end if;

  return saved_character_id;
end;
$$;

create function public.save_campaign_character_gm_notes(
  target_campaign_id uuid,
  target_character_id uuid,
  target_notes text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  character_owner_id uuid;
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage character notes.'
      using errcode = '42501';
  end if;

  select character.owner_user_id
  into character_owner_id
  from public.campaign_characters as character
  where character.campaign_id = target_campaign_id
    and character.id = target_character_id;

  if not found then
    raise exception 'The character sheet was not found in this campaign.'
      using errcode = 'P0002';
  end if;

  insert into public.campaign_character_gm_notes (
    campaign_id,
    owner_user_id,
    character_id,
    notes,
    updated_at
  )
  values (
    target_campaign_id,
    character_owner_id,
    target_character_id,
    trim(target_notes),
    now()
  )
  on conflict (campaign_id, character_id)
  do update set
    notes = excluded.notes,
    updated_at = now();
end;
$$;

revoke all on function public.save_campaign_character(
  uuid, uuid, text, text, text, integer, text, text,
  smallint, smallint, smallint, smallint, smallint, smallint,
  integer, integer, integer, text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.save_campaign_character(
  uuid, uuid, text, text, text, integer, text, text,
  smallint, smallint, smallint, smallint, smallint, smallint,
  integer, integer, integer, text, text, text, text, text, text, text, text
) to authenticated;

revoke all on function public.save_campaign_character_gm_notes(uuid, uuid, text)
from public, anon;
grant execute on function public.save_campaign_character_gm_notes(uuid, uuid, text)
to authenticated;

revoke all on public.campaign_characters,
  public.campaign_character_gm_notes from anon, authenticated;
grant select, insert, update, delete on public.campaign_characters to authenticated;
grant select, insert, update, delete on public.campaign_character_gm_notes
to authenticated;
