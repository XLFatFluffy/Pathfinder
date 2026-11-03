create table public.campaign_map_markers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  map_id uuid not null,
  location_id uuid,
  name text not null check (length(trim(name)) between 1 and 160),
  marker_type text not null check (
    marker_type in (
      'city', 'settlement', 'fortress', 'ruins',
      'landmark', 'port', 'hidden'
    )
  ),
  x double precision not null check (x between 0 and 1),
  y double precision not null check (y between 0 and 1),
  player_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_map_markers_map_same_campaign
    foreign key (campaign_id, map_id)
    references public.campaign_maps(campaign_id, id)
    on delete cascade,
  constraint campaign_map_markers_location_same_campaign
    foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id)
    on delete set null (location_id)
);

create index campaign_map_markers_map
on public.campaign_map_markers (campaign_id, map_id);

create index campaign_map_markers_location
on public.campaign_map_markers (campaign_id, location_id);

alter table public.campaign_map_markers enable row level security;

create policy campaign_map_markers_member_read
on public.campaign_map_markers for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
    and exists (
      select 1
      from public.campaign_maps as campaign_map
      where campaign_map.id = campaign_map_markers.map_id
        and campaign_map.campaign_id = campaign_map_markers.campaign_id
        and campaign_map.player_visible
    )
    and (
      location_id is null
      or exists (
        select 1
        from public.campaign_locations as location
        where location.id = campaign_map_markers.location_id
          and location.campaign_id = campaign_map_markers.campaign_id
          and location.player_visible
      )
    )
  )
);

create policy campaign_map_markers_gm_insert
on public.campaign_map_markers for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_map_markers_gm_update
on public.campaign_map_markers for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_map_markers_gm_delete
on public.campaign_map_markers for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

revoke all on public.campaign_map_markers from anon, authenticated;
grant select, insert, update, delete on public.campaign_map_markers
to authenticated;
