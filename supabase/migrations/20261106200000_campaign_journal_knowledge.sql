alter table public.campaign_journal_entries
  add constraint campaign_journal_entries_campaign_id_id_unique
  unique (campaign_id, id);

alter table public.campaign_journal_entries
  add column category text not null default 'unsorted'
    check (category in (
      'session_prep', 'session_recap', 'npc', 'location', 'politics',
      'quest', 'encounter', 'worldbuilding', 'rules', 'unsorted'
    )),
  add column tags text[] not null default '{}'
    check (cardinality(tags) <= 20),
  add column pinned boolean not null default false;

create table public.campaign_journal_entry_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  entry_id uuid not null,
  location_id uuid,
  npc_id uuid,
  house_id uuid,
  faction_id uuid,
  quest_id uuid,
  session_id uuid,
  event_id uuid,
  map_id uuid,
  created_at timestamptz not null default now(),
  constraint campaign_journal_entry_links_single_target
    check (num_nonnulls(
      location_id, npc_id, house_id, faction_id, quest_id,
      session_id, event_id, map_id
    ) = 1),
  foreign key (campaign_id, entry_id)
    references public.campaign_journal_entries(campaign_id, id)
    on delete cascade,
  foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id),
  foreign key (campaign_id, npc_id)
    references public.campaign_npcs(campaign_id, id),
  foreign key (campaign_id, house_id)
    references public.campaign_houses(campaign_id, id),
  foreign key (campaign_id, faction_id)
    references public.campaign_factions(campaign_id, id),
  foreign key (campaign_id, quest_id)
    references public.campaign_quests(campaign_id, id),
  foreign key (campaign_id, session_id)
    references public.campaign_sessions(campaign_id, id),
  foreign key (campaign_id, event_id)
    references public.campaign_events(campaign_id, id),
  foreign key (campaign_id, map_id)
    references public.campaign_maps(campaign_id, id)
);

create unique index campaign_journal_entry_links_location_unique
on public.campaign_journal_entry_links (campaign_id, entry_id, location_id)
where location_id is not null;
create unique index campaign_journal_entry_links_npc_unique
on public.campaign_journal_entry_links (campaign_id, entry_id, npc_id)
where npc_id is not null;
create unique index campaign_journal_entry_links_house_unique
on public.campaign_journal_entry_links (campaign_id, entry_id, house_id)
where house_id is not null;
create unique index campaign_journal_entry_links_faction_unique
on public.campaign_journal_entry_links (campaign_id, entry_id, faction_id)
where faction_id is not null;
create unique index campaign_journal_entry_links_quest_unique
on public.campaign_journal_entry_links (campaign_id, entry_id, quest_id)
where quest_id is not null;
create unique index campaign_journal_entry_links_session_unique
on public.campaign_journal_entry_links (campaign_id, entry_id, session_id)
where session_id is not null;
create unique index campaign_journal_entry_links_event_unique
on public.campaign_journal_entry_links (campaign_id, entry_id, event_id)
where event_id is not null;
create unique index campaign_journal_entry_links_map_unique
on public.campaign_journal_entry_links (campaign_id, entry_id, map_id)
where map_id is not null;

create index campaign_journal_entries_search
on public.campaign_journal_entries using gin (to_tsvector('simple', title || ' ' || content));

alter table public.campaign_journal_entry_links enable row level security;

create policy campaign_journal_entry_links_member_read
on public.campaign_journal_entry_links for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    public.is_campaign_member(campaign_id)
    and exists (
      select 1
      from public.campaign_journal_entries as entry
      where entry.campaign_id = campaign_journal_entry_links.campaign_id
        and entry.id = campaign_journal_entry_links.entry_id
        and entry.player_visible
    )
  )
);

create policy campaign_journal_entry_links_gm_manage
on public.campaign_journal_entry_links for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create function public.save_campaign_note(
  target_campaign_id uuid,
  target_entry_id uuid,
  target_title text,
  target_content text,
  target_campaign_date text,
  target_category text,
  target_tags text[],
  target_pinned boolean,
  target_player_visible boolean,
  target_links jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_entry_id uuid;
  link jsonb;
  link_kind text;
  link_record_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if not public.is_campaign_gm(target_campaign_id) then
    raise exception 'Only a campaign GM can manage campaign notes.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(target_links) is distinct from 'array' then
    raise exception 'Campaign note links must be an array.'
      using errcode = '22023';
  end if;
  if jsonb_array_length(target_links) > 32 then
    raise exception 'Campaign notes cannot have more than 32 linked records.'
      using errcode = '22023';
  end if;

  if target_entry_id is null then
    insert into public.campaign_journal_entries (
      campaign_id, title, content, campaign_date, category, tags,
      pinned, player_visible, created_by
    )
    values (
      target_campaign_id, trim(target_title), trim(target_content),
      nullif(trim(target_campaign_date), ''), target_category,
      coalesce(target_tags, '{}'), target_pinned, target_player_visible,
      current_user_id
    )
    returning id into saved_entry_id;
  else
    update public.campaign_journal_entries
    set
      title = trim(target_title),
      content = trim(target_content),
      campaign_date = nullif(trim(target_campaign_date), ''),
      category = target_category,
      tags = coalesce(target_tags, '{}'),
      pinned = target_pinned,
      player_visible = target_player_visible,
      updated_at = now()
    where campaign_id = target_campaign_id
      and id = target_entry_id
    returning id into saved_entry_id;

    if not found then
      raise exception 'The campaign note was not found.'
        using errcode = 'P0002';
    end if;
  end if;

  delete from public.campaign_journal_entry_links
  where campaign_id = target_campaign_id
    and entry_id = saved_entry_id;

  for link in select value from jsonb_array_elements(target_links)
  loop
    link_kind := link ->> 'type';
    link_record_id := (link ->> 'id')::uuid;
    if link_kind not in (
      'location', 'npc', 'house', 'faction', 'quest',
      'session', 'event', 'map'
    ) then
      raise exception 'Unsupported campaign note link type: %', link_kind
        using errcode = '22023';
    end if;
    if link_record_id is null then
      raise exception 'Campaign note link IDs are required.'
        using errcode = '22023';
    end if;

    insert into public.campaign_journal_entry_links (
      campaign_id, entry_id, location_id, npc_id, house_id, faction_id,
      quest_id, session_id, event_id, map_id
    )
    values (
      target_campaign_id,
      saved_entry_id,
      case when link_kind = 'location' then link_record_id end,
      case when link_kind = 'npc' then link_record_id end,
      case when link_kind = 'house' then link_record_id end,
      case when link_kind = 'faction' then link_record_id end,
      case when link_kind = 'quest' then link_record_id end,
      case when link_kind = 'session' then link_record_id end,
      case when link_kind = 'event' then link_record_id end,
      case when link_kind = 'map' then link_record_id end
    );
  end loop;

  return saved_entry_id;
end;
$$;

revoke all on function public.save_campaign_note(
  uuid, uuid, text, text, text, text, text[], boolean, boolean, jsonb
) from public, anon;
grant execute on function public.save_campaign_note(
  uuid, uuid, text, text, text, text, text[], boolean, boolean, jsonb
) to authenticated;

revoke all on public.campaign_journal_entry_links from anon, authenticated;
grant select, insert, delete on public.campaign_journal_entry_links
to authenticated;
grant update on public.campaign_journal_entries to authenticated;
