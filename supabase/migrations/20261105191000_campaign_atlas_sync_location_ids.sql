alter table public.campaign_atlas_sync_runs
add column location_source_ids jsonb not null default '[]'::jsonb
check (jsonb_typeof(location_source_ids) = 'array');
