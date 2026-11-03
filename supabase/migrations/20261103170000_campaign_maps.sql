insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'campaign-maps',
  'campaign-maps',
  false,
  104857600,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.campaign_maps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  parent_map_id uuid,
  location_id uuid,
  name text not null check (length(trim(name)) between 1 and 160),
  map_type text not null check (
    map_type in (
      'world', 'continent', 'region', 'kingdom',
      'city', 'settlement', 'interior', 'dungeon'
    )
  ),
  description text not null default '' check (length(description) <= 20000),
  mime_type text check (
    mime_type is null
    or mime_type in ('image/png', 'image/jpeg', 'image/webp', 'image/gif')
  ),
  player_visible boolean not null default false,
  artwork_path text,
  file_size bigint check (file_size is null or file_size between 1 and 104857600),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, id),
  unique (artwork_path),
  check (
    artwork_path is null
    or artwork_path = campaign_id::text || '/' || id::text || '/artwork'
  ),
  check ((artwork_path is null) = (mime_type is null)),
  check ((artwork_path is null) = (file_size is null)),
  check (parent_map_id is null or parent_map_id <> id),
  constraint campaign_maps_parent_same_campaign
    foreign key (campaign_id, parent_map_id)
    references public.campaign_maps(campaign_id, id),
  constraint campaign_maps_location_same_campaign
    foreign key (campaign_id, location_id)
    references public.campaign_locations(campaign_id, id)
);

create index campaign_maps_campaign_parent
on public.campaign_maps (campaign_id, parent_map_id);

create index campaign_maps_campaign_location
on public.campaign_maps (campaign_id, location_id);

create function public.ensure_campaign_map_visibility_tree()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.player_visible and new.parent_map_id is not null
    and not exists (
      select 1
      from public.campaign_maps as parent
      where parent.campaign_id = new.campaign_id
        and parent.id = new.parent_map_id
        and parent.player_visible
    )
  then
    raise exception 'A player-visible map must have a player-visible parent map.'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and not new.player_visible
    and exists (
      select 1
      from public.campaign_maps as child
      where child.campaign_id = new.campaign_id
        and child.parent_map_id = new.id
        and child.player_visible
    )
  then
    raise exception 'A map with player-visible child maps cannot be hidden.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger campaign_maps_visibility_tree
before insert or update of campaign_id, parent_map_id, player_visible
on public.campaign_maps
for each row
execute function public.ensure_campaign_map_visibility_tree();

alter table public.campaign_maps enable row level security;

create policy campaign_maps_member_read
on public.campaign_maps for select
to authenticated
using (
  public.is_campaign_gm(campaign_id)
  or (
    player_visible
    and public.is_campaign_member(campaign_id)
  )
);

create policy campaign_maps_gm_insert
on public.campaign_maps for insert
to authenticated
with check (
  public.is_campaign_gm(campaign_id)
  and (created_by is null or created_by = (select auth.uid()))
);

create policy campaign_maps_gm_update
on public.campaign_maps for update
to authenticated
using (public.is_campaign_gm(campaign_id))
with check (public.is_campaign_gm(campaign_id));

create policy campaign_maps_gm_delete
on public.campaign_maps for delete
to authenticated
using (public.is_campaign_gm(campaign_id));

create function public.can_manage_campaign_map_artwork(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[];
begin
  path_parts := string_to_array(object_name, '/');
  if cardinality(path_parts) <> 3
    or path_parts[3] <> 'artwork'
    or path_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or path_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  return exists (
    select 1
    from public.campaign_maps as campaign_map
    where campaign_map.campaign_id = path_parts[1]::uuid
      and campaign_map.id = path_parts[2]::uuid
      and public.is_campaign_gm(campaign_map.campaign_id)
  );
end;
$$;

create function public.can_read_campaign_map_artwork(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[];
begin
  path_parts := string_to_array(object_name, '/');
  if cardinality(path_parts) <> 3
    or path_parts[3] <> 'artwork'
    or path_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    or path_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    return false;
  end if;

  return exists (
    select 1
    from public.campaign_maps as campaign_map
    where campaign_map.campaign_id = path_parts[1]::uuid
      and campaign_map.id = path_parts[2]::uuid
      and campaign_map.artwork_path = object_name
      and (
        public.is_campaign_gm(campaign_map.campaign_id)
        or (
          campaign_map.player_visible
          and public.is_campaign_member(campaign_map.campaign_id)
        )
      )
  );
end;
$$;

revoke all on function public.can_manage_campaign_map_artwork(text)
  from public, anon;
revoke all on function public.can_read_campaign_map_artwork(text)
  from public, anon;
grant execute on function public.can_manage_campaign_map_artwork(text)
  to authenticated;
grant execute on function public.can_read_campaign_map_artwork(text)
  to authenticated;

create policy campaign_maps_artwork_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'campaign-maps'
  and public.can_read_campaign_map_artwork(name)
);

create policy campaign_maps_artwork_gm_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'campaign-maps'
  and public.can_manage_campaign_map_artwork(name)
);

create policy campaign_maps_artwork_gm_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'campaign-maps'
  and public.can_manage_campaign_map_artwork(name)
)
with check (
  bucket_id = 'campaign-maps'
  and public.can_manage_campaign_map_artwork(name)
);

create policy campaign_maps_artwork_gm_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'campaign-maps'
  and public.can_manage_campaign_map_artwork(name)
);

revoke all on public.campaign_maps from anon, authenticated;
grant select, insert, update, delete on public.campaign_maps to authenticated;
