create table public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '' check (length(description) <= 20000),
  campaign_date text not null check (length(trim(campaign_date)) between 1 and 120),
  end_date text check (end_date is null or length(end_date) <= 120),
  date_is_approximate boolean not null default false,
  category text not null default 'personal'
    check (category in (
      'historical', 'political', 'festival', 'religious', 'faction',
      'quest_deadline', 'session', 'personal', 'regional'
    )),
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed', 'cancelled')),
  certainty text not null default 'confirmed'
    check (certainty in ('confirmed', 'planned', 'rumored', 'unresolved')),
  source text not null default '' check (length(source) <= 2000),
  location_id uuid,
  npc_id uuid,
  house_id uuid,
  faction_id uuid,
  quest_id uuid,
  session_id uuid,
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id),
  constraint campaign_events_location_same_campaign
    foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id),
  constraint campaign_events_npc_same_campaign
    foreign key (campaign_id, npc_id)
    references public.campaign_npcs(campaign_id, id),
  constraint campaign_events_house_same_campaign
    foreign key (campaign_id, house_id)
    references public.campaign_houses(campaign_id, id),
  constraint campaign_events_faction_same_campaign
    foreign key (campaign_id, faction_id)
    references public.campaign_factions(campaign_id, id),
  constraint campaign_events_quest_same_campaign
    foreign key (campaign_id, quest_id)
    references public.campaign_quests(campaign_id, id),
  constraint campaign_events_session_same_campaign
    foreign key (campaign_id, session_id)
    references public.campaign_sessions(campaign_id, id)
);

create index campaign_events_campaign_date
on public.campaign_events (campaign_id, campaign_date, id);

create table public.campaign_event_gm_notes (
  campaign_id uuid not null,
  event_id uuid not null,
  notes text not null default '' check (length(notes) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, event_id),
  foreign key (campaign_id, event_id)
    references public.campaign_events(campaign_id, id)
    on delete cascade
);

create table public.campaign_event_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  event_id uuid not null,
  event_title text not null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  before_state jsonb,
  after_state jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index campaign_event_history_event_created
on public.campaign_event_history (campaign_id, event_id, created_at desc);

alter table public.campaign_events enable row level security;
alter table public.campaign_event_gm_notes enable row level security;
alter table public.campaign_event_history enable row level security;

create policy campaign_events_member_read
on public.campaign_events for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_events_gm_insert
on public.campaign_events for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_events_gm_update
on public.campaign_events for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_events_gm_delete
on public.campaign_events for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_event_gm_notes_gm_manage
on public.campaign_event_gm_notes for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_event_history_gm_read
on public.campaign_event_history for select
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_event_history_gm_insert
on public.campaign_event_history for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create function public.save_campaign_event(
  target_campaign_id uuid,
  target_event_id uuid,
  target_title text,
  target_description text,
  target_campaign_date text,
  target_end_date text,
  target_date_is_approximate boolean,
  target_category text,
  target_status text,
  target_certainty text,
  target_source text,
  target_location_id uuid,
  target_npc_id uuid,
  target_house_id uuid,
  target_faction_id uuid,
  target_quest_id uuid,
  target_session_id uuid,
  target_player_visible boolean,
  target_gm_notes text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_event_id uuid;
  previous_state jsonb;
  event_snapshot jsonb;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage campaign events.'
      using errcode = '42501';
  end if;

  if target_event_id is null then
    insert into public.campaign_events (
      campaign_id, title, description, campaign_date, end_date,
      date_is_approximate, category, status, certainty, source,
      location_id, npc_id, house_id, faction_id, quest_id, session_id,
      player_visible, created_by
    )
    values (
      target_campaign_id, trim(target_title), trim(target_description),
      trim(target_campaign_date), nullif(trim(target_end_date), ''),
      target_date_is_approximate, target_category, target_status,
      target_certainty, trim(target_source), target_location_id,
      target_npc_id, target_house_id, target_faction_id, target_quest_id,
      target_session_id, target_player_visible, current_user_id
    )
    returning id into saved_event_id;
  else
    select to_jsonb(event)
    into previous_state
    from public.campaign_events as event
    where event.campaign_id = target_campaign_id
      and event.id = target_event_id
    for update;

    if not found then
      raise exception 'The campaign event was not found.'
        using errcode = 'P0002';
    end if;

    update public.campaign_events
    set
      title = trim(target_title),
      description = trim(target_description),
      campaign_date = trim(target_campaign_date),
      end_date = nullif(trim(target_end_date), ''),
      date_is_approximate = target_date_is_approximate,
      category = target_category,
      status = target_status,
      certainty = target_certainty,
      source = trim(target_source),
      location_id = target_location_id,
      npc_id = target_npc_id,
      house_id = target_house_id,
      faction_id = target_faction_id,
      quest_id = target_quest_id,
      session_id = target_session_id,
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_event_id
    returning id into saved_event_id;
  end if;

  select to_jsonb(event)
  into event_snapshot
  from public.campaign_events as event
  where event.campaign_id = target_campaign_id
    and event.id = saved_event_id;

  insert into public.campaign_event_history (
    campaign_id, event_id, event_title, action,
    before_state, after_state, created_by
  )
  values (
    target_campaign_id, saved_event_id, trim(target_title),
    case when previous_state is null then 'created' else 'updated' end,
    previous_state, event_snapshot, current_user_id
  );

  insert into public.campaign_event_gm_notes (
    campaign_id, event_id, notes, updated_at
  )
  values (
    target_campaign_id, saved_event_id, trim(target_gm_notes), now()
  )
  on conflict (campaign_id, event_id)
  do update set notes = excluded.notes, updated_at = now();

  return saved_event_id;
end;
$$;

create function public.delete_campaign_event(
  target_campaign_id uuid,
  target_event_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_state jsonb;
  previous_title text;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage campaign events.'
      using errcode = '42501';
  end if;

  select to_jsonb(event), event.title
  into previous_state, previous_title
  from public.campaign_events as event
  where event.campaign_id = target_campaign_id
    and event.id = target_event_id
  for update;

  if not found then
    raise exception 'The campaign event was not found.'
      using errcode = 'P0002';
  end if;

  insert into public.campaign_event_history (
    campaign_id, event_id, event_title, action,
    before_state, created_by
  )
  values (
    target_campaign_id, target_event_id, previous_title, 'deleted',
    previous_state, current_user_id
  );

  delete from public.campaign_events
  where campaign_id = target_campaign_id
    and id = target_event_id;
end;
$$;

revoke all on function public.save_campaign_event(
  uuid, uuid, text, text, text, text, boolean, text, text, text, text,
  uuid, uuid, uuid, uuid, uuid, uuid, boolean, text
) from public, anon;
grant execute on function public.save_campaign_event(
  uuid, uuid, text, text, text, text, boolean, text, text, text, text,
  uuid, uuid, uuid, uuid, uuid, uuid, boolean, text
) to authenticated;

revoke all on function public.delete_campaign_event(uuid, uuid)
from public, anon;
grant execute on function public.delete_campaign_event(uuid, uuid)
to authenticated;

revoke all on public.campaign_events, public.campaign_event_gm_notes,
  public.campaign_event_history from anon, authenticated;
grant select, insert, update, delete on public.campaign_events to authenticated;
grant select, insert, update, delete on public.campaign_event_gm_notes
to authenticated;
grant select, insert on public.campaign_event_history to authenticated;
