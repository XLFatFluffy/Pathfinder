create table public.campaign_quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  status text not null default 'undiscovered'
    check (status in ('undiscovered', 'active', 'completed', 'failed', 'rewarded', 'cancelled')),
  summary text not null default '' check (length(summary) <= 4000),
  giver text not null default '' check (length(giver) <= 4000),
  location_id uuid,
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id),
  constraint campaign_quests_location_same_campaign
    foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id)
);

create index campaign_quests_campaign_status
on public.campaign_quests (campaign_id, status, name);

create table public.campaign_quest_gm_notes (
  campaign_id uuid not null,
  quest_id uuid not null,
  notes text not null default '' check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, quest_id),
  foreign key (campaign_id, quest_id)
    references public.campaign_quests(campaign_id, id)
    on delete cascade
);

alter table public.campaign_quests enable row level security;
alter table public.campaign_quest_gm_notes enable row level security;

create policy campaign_quests_member_read
on public.campaign_quests for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_quests_gm_insert
on public.campaign_quests for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_quests_gm_update
on public.campaign_quests for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_quests_gm_delete
on public.campaign_quests for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_quest_gm_notes_gm_manage
on public.campaign_quest_gm_notes for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create function public.save_campaign_quest(
  target_campaign_id uuid,
  target_quest_id uuid,
  target_name text,
  target_status text,
  target_summary text,
  target_giver text,
  target_location_id uuid,
  target_player_visible boolean,
  target_gm_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_quest_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage quests.'
      using errcode = '42501';
  end if;

  if target_quest_id is null then
    insert into public.campaign_quests (
      campaign_id,
      name,
      status,
      summary,
      giver,
      location_id,
      player_visible,
      created_by
    )
    values (
      target_campaign_id,
      trim(target_name),
      target_status,
      trim(target_summary),
      trim(target_giver),
      target_location_id,
      target_player_visible,
      current_user_id
    )
    returning id into saved_quest_id;
  else
    update public.campaign_quests
    set
      name = trim(target_name),
      status = target_status,
      summary = trim(target_summary),
      giver = trim(target_giver),
      location_id = target_location_id,
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_quest_id
    returning id into saved_quest_id;

    if not found then
      raise exception 'The quest was not found in this campaign.'
        using errcode = 'P0002';
    end if;
  end if;

  insert into public.campaign_quest_gm_notes (
    campaign_id,
    quest_id,
    notes,
    updated_at
  )
  values (
    target_campaign_id,
    saved_quest_id,
    trim(target_gm_notes),
    now()
  )
  on conflict (campaign_id, quest_id)
  do update set
    notes = excluded.notes,
    updated_at = now();

  return saved_quest_id;
end;
$$;

revoke all on function public.save_campaign_quest(
  uuid, uuid, text, text, text, text, uuid, boolean, text
) from public, anon;
grant execute on function public.save_campaign_quest(
  uuid, uuid, text, text, text, text, uuid, boolean, text
) to authenticated;

revoke all on public.campaign_quests,
  public.campaign_quest_gm_notes from anon, authenticated;
grant select, insert, update, delete on public.campaign_quests to authenticated;
grant select, insert, update, delete on public.campaign_quest_gm_notes
to authenticated;
