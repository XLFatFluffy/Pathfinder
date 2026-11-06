create table public.campaign_encounters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 200),
  description text not null default '' check (length(description) <= 20000),
  campaign_date text not null default '' check (length(campaign_date) <= 120),
  location_id uuid,
  quest_id uuid,
  session_id uuid,
  map_id uuid,
  difficulty text not null default '' check (length(difficulty) <= 80),
  status text not null default 'planned'
    check (status in ('planned', 'ready', 'played', 'cancelled')),
  outcome text not null default '' check (length(outcome) <= 10000),
  aftermath text not null default '' check (length(aftermath) <= 10000),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id),
  foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id),
  foreign key (campaign_id, quest_id)
    references public.campaign_quests(campaign_id, id),
  foreign key (campaign_id, session_id)
    references public.campaign_sessions(campaign_id, id),
  foreign key (campaign_id, map_id)
    references public.campaign_maps(campaign_id, id)
);

create index campaign_encounters_campaign_status
on public.campaign_encounters (campaign_id, status, updated_at desc);

create table public.campaign_encounter_npcs (
  campaign_id uuid not null,
  encounter_id uuid not null,
  npc_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (campaign_id, encounter_id, npc_id),
  foreign key (campaign_id, encounter_id)
    references public.campaign_encounters(campaign_id, id)
    on delete cascade,
  foreign key (campaign_id, npc_id)
    references public.campaign_npcs(campaign_id, id)
    on delete cascade
);

create table public.campaign_encounter_gm_notes (
  campaign_id uuid not null,
  encounter_id uuid not null,
  notes text not null default '' check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, encounter_id),
  foreign key (campaign_id, encounter_id)
    references public.campaign_encounters(campaign_id, id)
    on delete cascade
);

alter table public.campaign_encounters enable row level security;
alter table public.campaign_encounter_npcs enable row level security;
alter table public.campaign_encounter_gm_notes enable row level security;

create policy campaign_encounters_member_read
on public.campaign_encounters for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
    and (
      location_id is null
      or exists (
        select 1 from public.campaign_locations as location
        where location.campaign_id = campaign_encounters.campaign_id
          and location.id = campaign_encounters.location_id
          and location.player_visible
      )
    )
    and (
      quest_id is null
      or exists (
        select 1 from public.campaign_quests as quest
        where quest.campaign_id = campaign_encounters.campaign_id
          and quest.id = campaign_encounters.quest_id
          and quest.player_visible
      )
    )
    and (
      session_id is null
      or exists (
        select 1 from public.campaign_sessions as session
        where session.campaign_id = campaign_encounters.campaign_id
          and session.id = campaign_encounters.session_id
          and session.player_visible
      )
    )
    and (
      map_id is null
      or exists (
        select 1 from public.campaign_maps as map
        where map.campaign_id = campaign_encounters.campaign_id
          and map.id = campaign_encounters.map_id
          and map.player_visible
      )
    )
  )
);

create policy campaign_encounters_gm_insert
on public.campaign_encounters for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_encounters_gm_update
on public.campaign_encounters for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_encounters_gm_delete
on public.campaign_encounters for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_encounter_npcs_member_read
on public.campaign_encounter_npcs for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    public.is_campaign_member(campaign_id)
    and exists (
      select 1
      from public.campaign_encounters as encounter
      join public.campaign_npcs as npc
        on npc.campaign_id = encounter.campaign_id
        and npc.id = campaign_encounter_npcs.npc_id
      where encounter.campaign_id = campaign_encounter_npcs.campaign_id
        and encounter.id = campaign_encounter_npcs.encounter_id
        and encounter.player_visible
        and npc.player_visible
    )
  )
);

create policy campaign_encounter_npcs_gm_manage
on public.campaign_encounter_npcs for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_encounter_gm_notes_gm_manage
on public.campaign_encounter_gm_notes for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create function public.save_campaign_encounter(
  target_campaign_id uuid,
  target_encounter_id uuid,
  target_name text,
  target_description text,
  target_campaign_date text,
  target_location_id uuid,
  target_quest_id uuid,
  target_session_id uuid,
  target_map_id uuid,
  target_difficulty text,
  target_status text,
  target_outcome text,
  target_aftermath text,
  target_player_visible boolean,
  target_npc_ids uuid[],
  target_gm_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_encounter_id uuid;
  npc_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage encounters.'
      using errcode = '42501';
  end if;

  if target_encounter_id is null then
    insert into public.campaign_encounters (
      campaign_id, name, description, campaign_date, location_id, quest_id,
      session_id, map_id, difficulty, status, outcome, aftermath,
      player_visible, created_by
    )
    values (
      target_campaign_id, trim(target_name), trim(target_description),
      trim(target_campaign_date), target_location_id, target_quest_id,
      target_session_id, target_map_id, trim(target_difficulty),
      target_status, trim(target_outcome), trim(target_aftermath),
      target_player_visible, current_user_id
    )
    returning id into saved_encounter_id;
  else
    update public.campaign_encounters
    set
      name = trim(target_name),
      description = trim(target_description),
      campaign_date = trim(target_campaign_date),
      location_id = target_location_id,
      quest_id = target_quest_id,
      session_id = target_session_id,
      map_id = target_map_id,
      difficulty = trim(target_difficulty),
      status = target_status,
      outcome = trim(target_outcome),
      aftermath = trim(target_aftermath),
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_encounter_id
    returning id into saved_encounter_id;

    if not found then
      raise exception 'The encounter was not found in this campaign.'
        using errcode = 'P0002';
    end if;
  end if;

  delete from public.campaign_encounter_npcs
  where campaign_id = target_campaign_id
    and encounter_id = saved_encounter_id;

  foreach npc_id in array coalesce(target_npc_ids, '{}')
  loop
    insert into public.campaign_encounter_npcs (
      campaign_id, encounter_id, npc_id
    )
    values (target_campaign_id, saved_encounter_id, npc_id)
    on conflict do nothing;
  end loop;

  insert into public.campaign_encounter_gm_notes (
    campaign_id, encounter_id, notes, updated_at
  )
  values (
    target_campaign_id, saved_encounter_id, trim(target_gm_notes), now()
  )
  on conflict (campaign_id, encounter_id)
  do update set notes = excluded.notes, updated_at = now();

  return saved_encounter_id;
end;
$$;

revoke all on function public.save_campaign_encounter(
  uuid, uuid, text, text, text, uuid, uuid, uuid, uuid, text, text,
  text, text, boolean, uuid[], text
) from public, anon;
grant execute on function public.save_campaign_encounter(
  uuid, uuid, text, text, text, uuid, uuid, uuid, uuid, text, text,
  text, text, boolean, uuid[], text
) to authenticated;

revoke all on public.campaign_encounters, public.campaign_encounter_npcs,
  public.campaign_encounter_gm_notes from anon, authenticated;
grant select, insert, update, delete on public.campaign_encounters
to authenticated;
grant select, insert, update, delete on public.campaign_encounter_npcs
to authenticated;
grant select, insert, update, delete on public.campaign_encounter_gm_notes
to authenticated;
