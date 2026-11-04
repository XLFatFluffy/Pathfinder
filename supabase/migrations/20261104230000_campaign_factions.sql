create table public.campaign_factions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  faction_type text not null default '' check (length(faction_type) <= 120),
  description text not null default '' check (length(description) <= 20000),
  leader_npc_id uuid,
  headquarters_location_id uuid,
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id),
  constraint campaign_factions_leader_same_campaign
    foreign key (campaign_id, leader_npc_id)
    references public.campaign_npcs(campaign_id, id),
  constraint campaign_factions_headquarters_same_campaign
    foreign key (campaign_id, headquarters_location_id)
    references public.campaign_locations(campaign_id, id)
);

create index campaign_factions_campaign_name
on public.campaign_factions (campaign_id, name);

create table public.campaign_faction_gm_details (
  campaign_id uuid not null,
  faction_id uuid not null,
  objectives text not null default '' check (length(objectives) <= 10000),
  resources text not null default '' check (length(resources) <= 10000),
  influence text not null default '' check (length(influence) <= 4000),
  membership text not null default '' check (length(membership) <= 10000),
  allies_and_rivals text not null default '' check (length(allies_and_rivals) <= 10000),
  current_activities text not null default '' check (length(current_activities) <= 10000),
  history text not null default '' check (length(history) <= 20000),
  secrets text not null default '' check (length(secrets) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, faction_id),
  foreign key (campaign_id, faction_id)
    references public.campaign_factions(campaign_id, id)
    on delete cascade
);

alter table public.campaign_factions enable row level security;
alter table public.campaign_faction_gm_details enable row level security;

create policy campaign_factions_member_read
on public.campaign_factions for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_factions_gm_insert
on public.campaign_factions for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_factions_gm_update
on public.campaign_factions for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_factions_gm_delete
on public.campaign_factions for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_faction_gm_details_gm_manage
on public.campaign_faction_gm_details for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create function public.save_campaign_faction(
  target_campaign_id uuid,
  target_faction_id uuid,
  target_name text,
  target_faction_type text,
  target_description text,
  target_leader_npc_id uuid,
  target_headquarters_location_id uuid,
  target_player_visible boolean,
  target_objectives text,
  target_resources text,
  target_influence text,
  target_membership text,
  target_allies_and_rivals text,
  target_current_activities text,
  target_history text,
  target_secrets text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_faction_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage factions.'
      using errcode = '42501';
  end if;

  if target_faction_id is null then
    insert into public.campaign_factions (
      campaign_id,
      name,
      faction_type,
      description,
      leader_npc_id,
      headquarters_location_id,
      player_visible,
      created_by
    )
    values (
      target_campaign_id,
      trim(target_name),
      trim(target_faction_type),
      trim(target_description),
      target_leader_npc_id,
      target_headquarters_location_id,
      target_player_visible,
      current_user_id
    )
    returning id into saved_faction_id;
  else
    update public.campaign_factions
    set
      name = trim(target_name),
      faction_type = trim(target_faction_type),
      description = trim(target_description),
      leader_npc_id = target_leader_npc_id,
      headquarters_location_id = target_headquarters_location_id,
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_faction_id
    returning id into saved_faction_id;

    if not found then
      raise exception 'The faction was not found in this campaign.'
        using errcode = 'P0002';
    end if;
  end if;

  insert into public.campaign_faction_gm_details (
    campaign_id,
    faction_id,
    objectives,
    resources,
    influence,
    membership,
    allies_and_rivals,
    current_activities,
    history,
    secrets,
    updated_at
  )
  values (
    target_campaign_id,
    saved_faction_id,
    trim(target_objectives),
    trim(target_resources),
    trim(target_influence),
    trim(target_membership),
    trim(target_allies_and_rivals),
    trim(target_current_activities),
    trim(target_history),
    trim(target_secrets),
    now()
  )
  on conflict (campaign_id, faction_id)
  do update set
    objectives = excluded.objectives,
    resources = excluded.resources,
    influence = excluded.influence,
    membership = excluded.membership,
    allies_and_rivals = excluded.allies_and_rivals,
    current_activities = excluded.current_activities,
    history = excluded.history,
    secrets = excluded.secrets,
    updated_at = now();

  return saved_faction_id;
end;
$$;

revoke all on function public.save_campaign_faction(
  uuid, uuid, text, text, text, uuid, uuid, boolean,
  text, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.save_campaign_faction(
  uuid, uuid, text, text, text, uuid, uuid, boolean,
  text, text, text, text, text, text, text, text
) to authenticated;

revoke all on public.campaign_factions,
  public.campaign_faction_gm_details from anon, authenticated;
grant select, insert, update, delete on public.campaign_factions to authenticated;
grant select, insert, update, delete on public.campaign_faction_gm_details
to authenticated;
