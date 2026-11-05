create table public.campaign_import_sources (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  record_type text not null check (
    record_type in (
      'locations',
      'npcs',
      'houses',
      'house_relationships',
      'factions',
      'quests',
      'sessions',
      'journal_entries'
    )
  ),
  source_key text not null check (length(trim(source_key)) between 1 and 120),
  entity_id uuid not null,
  record_name text not null check (length(trim(record_name)) between 1 and 200),
  canon_status text not null check (
    canon_status in ('PROPOSED', 'APPROVED', 'ESTABLISHED', 'REJECTED', 'REVISED', 'UNRESOLVED')
  ),
  visibility text not null check (visibility in ('GM_ONLY', 'PLAYER_SHARED')),
  knowledge_type text not null check (
    knowledge_type in ('fact', 'rumor', 'belief', 'discovery', 'gm_truth', 'proposal')
  ),
  provenance text not null check (length(trim(provenance)) between 1 and 1000),
  imported_at timestamptz not null default now(),
  unique (campaign_id, record_type, source_key),
  unique (campaign_id, record_type, entity_id),
  constraint campaign_import_sources_visibility_canon_check check (
    visibility <> 'PLAYER_SHARED'
    or (
      canon_status not in ('PROPOSED', 'REJECTED', 'UNRESOLVED')
      and knowledge_type not in ('gm_truth', 'proposal')
    )
  )
);

create index campaign_import_sources_campaign_key
on public.campaign_import_sources (campaign_id, record_type, source_key);

alter table public.campaign_import_sources enable row level security;

create policy campaign_import_sources_gm_read
on public.campaign_import_sources for select
to authenticated
using (public.is_campaign_gm(campaign_id));

create policy campaign_import_sources_gm_insert
on public.campaign_import_sources for insert
to authenticated
with check (public.is_campaign_gm(campaign_id));

revoke all on public.campaign_import_sources from anon, authenticated;
grant select, insert on public.campaign_import_sources to authenticated;
