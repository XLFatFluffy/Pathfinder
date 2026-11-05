alter table public.campaign_maps
drop constraint campaign_maps_map_type_check;

alter table public.campaign_maps
add constraint campaign_maps_map_type_check
check (
  map_type in (
    'world', 'continent', 'region', 'kingdom', 'city',
    'settlement', 'district', 'interior', 'dungeon'
  )
);

alter table public.campaign_maps
add column source_id text check (
  source_id is null or length(trim(source_id)) between 1 and 160
);

alter table public.campaign_locations
add column source_id text check (
  source_id is null or length(trim(source_id)) between 1 and 160
);

alter table public.campaign_map_markers
add column source_id text check (
  source_id is null or length(trim(source_id)) between 1 and 160
);

alter table public.campaign_map_overlays
add column source_id text check (
  source_id is null or length(trim(source_id)) between 1 and 160
);

create unique index campaign_maps_campaign_source
on public.campaign_maps (campaign_id, source_id)
where source_id is not null;

create unique index campaign_locations_campaign_source
on public.campaign_locations (campaign_id, source_id)
where source_id is not null;

create unique index campaign_map_markers_map_source
on public.campaign_map_markers (campaign_id, map_id, source_id)
where source_id is not null;

create unique index campaign_map_overlays_map_source
on public.campaign_map_overlays (campaign_id, map_id, source_id)
where source_id is not null;

create table public.campaign_atlas_sync_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  map_id uuid not null,
  source_ids jsonb not null check (jsonb_typeof(source_ids) = 'array'),
  before_state jsonb not null check (jsonb_typeof(before_state) = 'object'),
  status text not null default 'applying'
    check (status in ('applying', 'applied', 'partial', 'rolled_back')),
  created_at timestamptz not null default now(),
  rolled_back_at timestamptz,
  constraint campaign_atlas_sync_runs_map_same_campaign
    foreign key (campaign_id, map_id)
    references public.campaign_maps(campaign_id, id)
    on delete cascade
);

create index campaign_atlas_sync_runs_latest
on public.campaign_atlas_sync_runs (campaign_id, map_id, created_at desc);

alter table public.campaign_atlas_sync_runs enable row level security;

create policy campaign_atlas_sync_runs_gm_manage
on public.campaign_atlas_sync_runs for all
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

revoke all on public.campaign_atlas_sync_runs from anon, authenticated;
grant select, insert, update on public.campaign_atlas_sync_runs to authenticated;
