create table public.campaign_npcs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  location_id uuid,
  name text not null check (length(trim(name)) between 1 and 160),
  race text not null default '' check (length(race) <= 80),
  age text not null default '' check (length(age) <= 80),
  gender text not null default '' check (length(gender) <= 80),
  occupation text not null default '' check (length(occupation) <= 120),
  titles text not null default '' check (length(titles) <= 2000),
  description text not null default '' check (length(description) <= 20000),
  status text not null default 'Alive' check (length(trim(status)) between 1 and 80),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id),
  constraint campaign_npcs_location_same_campaign
    foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id)
);

create index campaign_npcs_campaign_name
on public.campaign_npcs (campaign_id, name);

create table public.campaign_npc_gm_notes (
  campaign_id uuid not null,
  npc_id uuid not null,
  notes text not null check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, npc_id),
  foreign key (campaign_id, npc_id)
    references public.campaign_npcs(campaign_id, id)
    on delete cascade
);

create table public.campaign_npc_status_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  npc_id uuid not null,
  status text not null check (length(trim(status)) between 1 and 80),
  campaign_date text check (campaign_date is null or length(campaign_date) <= 120),
  reason text not null default '' check (length(reason) <= 2000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (campaign_id, npc_id)
    references public.campaign_npcs(campaign_id, id)
    on delete cascade
);

create index campaign_npc_status_history_npc
on public.campaign_npc_status_history (campaign_id, npc_id, created_at desc);

alter table public.campaign_npcs enable row level security;
alter table public.campaign_npc_gm_notes enable row level security;
alter table public.campaign_npc_status_history enable row level security;

create policy campaign_npcs_member_read
on public.campaign_npcs for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_npcs_gm_insert
on public.campaign_npcs for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_npcs_gm_update
on public.campaign_npcs for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_npcs_gm_delete
on public.campaign_npcs for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_npc_gm_notes_gm_manage
on public.campaign_npc_gm_notes for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_npc_status_history_gm_read
on public.campaign_npc_status_history for select
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_npc_status_history_gm_insert
on public.campaign_npc_status_history for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create function public.save_campaign_npc(
  target_campaign_id uuid,
  target_npc_id uuid,
  target_location_id uuid,
  target_name text,
  target_race text,
  target_age text,
  target_gender text,
  target_occupation text,
  target_titles text,
  target_description text,
  target_status text,
  target_player_visible boolean,
  target_gm_notes text,
  target_status_date text,
  target_status_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_npc_id uuid;
  previous_status text;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage NPCs.'
      using errcode = '42501';
  end if;

  if target_npc_id is null then
    insert into public.campaign_npcs (
      campaign_id,
      location_id,
      name,
      race,
      age,
      gender,
      occupation,
      titles,
      description,
      status,
      player_visible,
      created_by
    )
    values (
      target_campaign_id,
      target_location_id,
      trim(target_name),
      trim(target_race),
      trim(target_age),
      trim(target_gender),
      trim(target_occupation),
      trim(target_titles),
      trim(target_description),
      trim(target_status),
      target_player_visible,
      current_user_id
    )
    returning id into saved_npc_id;

    insert into public.campaign_npc_status_history (
      campaign_id,
      npc_id,
      status,
      campaign_date,
      reason,
      created_by
    )
    values (
      target_campaign_id,
      saved_npc_id,
      trim(target_status),
      nullif(trim(target_status_date), ''),
      trim(target_status_reason),
      current_user_id
    );
  else
    select npc.status
    into previous_status
    from public.campaign_npcs as npc
    where npc.campaign_id = target_campaign_id
      and npc.id = target_npc_id
    for update;

    if not found then
      raise exception 'The NPC was not found in this campaign.'
        using errcode = 'P0002';
    end if;

    update public.campaign_npcs
    set
      location_id = target_location_id,
      name = trim(target_name),
      race = trim(target_race),
      age = trim(target_age),
      gender = trim(target_gender),
      occupation = trim(target_occupation),
      titles = trim(target_titles),
      description = trim(target_description),
      status = trim(target_status),
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_npc_id;

    saved_npc_id := target_npc_id;

    if previous_status is distinct from trim(target_status) then
      insert into public.campaign_npc_status_history (
        campaign_id,
        npc_id,
        status,
        campaign_date,
        reason,
        created_by
      )
      values (
        target_campaign_id,
        saved_npc_id,
        trim(target_status),
        nullif(trim(target_status_date), ''),
        trim(target_status_reason),
        current_user_id
      );
    end if;
  end if;

  if length(trim(target_gm_notes)) > 0 then
    insert into public.campaign_npc_gm_notes (campaign_id, npc_id, notes)
    values (target_campaign_id, saved_npc_id, trim(target_gm_notes))
    on conflict (campaign_id, npc_id)
    do update set notes = excluded.notes, updated_at = now();
  else
    delete from public.campaign_npc_gm_notes
    where campaign_id = target_campaign_id
      and npc_id = saved_npc_id;
  end if;

  return saved_npc_id;
end;
$$;

revoke all on function public.save_campaign_npc(
  uuid, uuid, uuid, text, text, text, text, text, text, text,
  text, boolean, text, text, text
) from public, anon;
grant execute on function public.save_campaign_npc(
  uuid, uuid, uuid, text, text, text, text, text, text, text,
  text, boolean, text, text, text
) to authenticated;

revoke all on public.campaign_npcs,
  public.campaign_npc_gm_notes,
  public.campaign_npc_status_history from anon, authenticated;
grant select, insert, update, delete on public.campaign_npcs to authenticated;
grant select, insert, update, delete on public.campaign_npc_gm_notes to authenticated;
grant select, insert on public.campaign_npc_status_history to authenticated;
